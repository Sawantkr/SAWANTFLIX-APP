import express from "express";
import cors from "cors";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import axios from "axios";

import { db } from "./firebase.js";
import pool from "./postgres.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;
const BACKEND_URL = process.env.Backend_URL;

if (!key_id || !key_secret) {
  console.warn("⚠️ Missing Razorpay keys in .env (Payment won't work).");
}

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

// =====================================================
// BASIC ROUTES
// =====================================================

app.get("/", (_req, res) => {
  res.send("Backend server is running!");
});

app.get("/api", (_req, res) => {
  res.json({
    ok: true,
    msg: "Backend API working fine!",
  });
});

// =====================================================
// DATABASE TEST
// =====================================================

app.get("/api/db-test", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database(), current_user"
    );

    res.json({
      ok: true,
      database: result.rows[0],
    });
  } catch (error) {
    console.error("PostgreSQL error:", error);

    res.status(500).json({
      ok: false,
      error: "PostgreSQL connection failed",
    });
  }
});

// =====================================================
// USER SYNC - FIREBASE USER -> POSTGRESQL
// =====================================================

app.post("/api/users/sync", async (req, res) => {
  try {
    const {
      firebaseUid,
      email,
      name,
    } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({
        error: "firebaseUid is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO users (
        firebase_uid,
        email,
        name
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name
      RETURNING *
      `,
      [
        firebaseUid,
        email || null,
        name || null,
      ]
    );

    console.log("✅ User synced:", firebaseUid);

    res.json({
      ok: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("User sync error:", error);

    res.status(500).json({
      ok: false,
      error: "Failed to sync user",
    });
  }
});

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

app.post("/api/create-order", async (req, res) => {
  try {
    const {
      amount,
      firebaseUid,
      email,
      name,
    } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
      });
    }

    console.log("Creating order for amount:", amount);

    // If Firebase user information is available,
    // make sure the user exists in PostgreSQL.
    if (firebaseUid) {
      await pool.query(
        `
        INSERT INTO users (
          firebase_uid,
          email,
          name
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (firebase_uid)
        DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name
        `,
        [
          firebaseUid,
          email || null,
          name || null,
        ]
      );
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    console.log("Order created:", order.id);

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
    });
  } catch (e) {
    console.error(
      "Order create error:",
      e?.error || e
    );

    return res.status(500).json({
      error: "Order creation failed",
      details:
        e?.error?.description ||
        e?.message ||
        "Unknown error",
    });
  }
});

// =====================================================
// VERIFY PAYMENT + SAVE PAYMENT
// =====================================================

app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      firebaseUid,
      plan,
      amount,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        verified: false,
        error: "Missing payment fields",
      });
    }

    const payload =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(payload)
      .digest("hex");

    const verified =
      expectedSignature === razorpay_signature;

    console.log(
      "🔑 Payment verification:",
      verified
    );

    if (!verified) {
      return res.json({
        verified: false,
      });
    }

    // -------------------------------------------------
    // SAVE PAYMENT TO POSTGRESQL
    // -------------------------------------------------

    if (firebaseUid) {
      const userResult = await pool.query(
        `
        SELECT id
        FROM users
        WHERE firebase_uid = $1
        `,
        [firebaseUid]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;

        await pool.query(
          `
          INSERT INTO payments (
            user_id,
            razorpay_order_id,
            razorpay_payment_id,
            amount,
            status
          )
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            userId,
            razorpay_order_id,
            razorpay_payment_id,
            Number(amount) || 0,
            "success",
          ]
        );

        // ---------------------------------------------
        // SAVE SUBSCRIPTION
        // ---------------------------------------------

        if (plan) {
          await pool.query(
            `
            INSERT INTO subscriptions (
              user_id,
              plan,
              amount,
              status,
              start_date,
              end_date
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP + INTERVAL '30 days'
            )
            `,
            [
              userId,
              plan,
              Number(amount) || 0,
              "active",
            ]
          );
        }

        console.log(
          "✅ Payment saved to PostgreSQL"
        );
      }
    }

    return res.json({
      verified: true,
      savedToDatabase: Boolean(firebaseUid),
    });
  } catch (error) {
    console.error(
      "Verify payment error:",
      error
    );

    return res.status(500).json({
      verified: false,
      error: "Verification failed",
    });
  }
});

// =====================================================
// CUSTOMER SUPPORT API - AI ACCESS
// =====================================================

app.get(
  "/api/support/customer/:firebaseUid",
  async (req, res) => {
    try {
      const supportApiKey =
        req.headers["x-support-api-key"];

      // Secure API key check
      if (
        !supportApiKey ||
        supportApiKey !== process.env.SUPPORT_API_KEY
      ) {
        return res.status(401).json({
          ok: false,
          error: "Unauthorized",
        });
      }

      const { firebaseUid } = req.params;

      // -------------------------------------------------
      // GET CUSTOMER
      // -------------------------------------------------

      const userResult = await pool.query(
        `
        SELECT
          id,
          firebase_uid,
          email,
          name,
          created_at
        FROM users
        WHERE firebase_uid = $1
        `,
        [firebaseUid]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "Customer not found",
        });
      }

      const user = userResult.rows[0];

      // -------------------------------------------------
      // GET LATEST SUBSCRIPTION
      // -------------------------------------------------

      const subscriptionResult = await pool.query(
        `
        SELECT
          id,
          plan,
          amount,
          status,
          start_date,
          end_date
        FROM subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [user.id]
      );

      // -------------------------------------------------
      // GET LATEST PAYMENT
      // -------------------------------------------------

      const paymentResult = await pool.query(
        `
        SELECT
          id,
          razorpay_order_id,
          razorpay_payment_id,
          amount,
          status,
          created_at
        FROM payments
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [user.id]
      );

      const subscription =
        subscriptionResult.rows[0] || null;

      const latestPayment =
        paymentResult.rows[0] || null;

      // -------------------------------------------------
      // RESPONSE FOR CUSTOMER SUPPORT AI
      // -------------------------------------------------

      res.json({
        ok: true,

        customer: {
          id: user.id,
          firebaseUid: user.firebase_uid,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
        },

        subscription,

        latestPayment,
      });
    } catch (error) {
      console.error(
        "Customer support API error:",
        error
      );

      res.status(500).json({
        ok: false,
        error: "Failed to fetch customer support data",
      });
    }
  }
);

// =====================================================
// GET USER SUBSCRIPTION
// =====================================================

app.get(
  "/api/users/:firebaseUid/subscription",
  async (req, res) => {
    try {
      const { firebaseUid } = req.params;

      const result = await pool.query(
        `
        SELECT
          s.id,
          s.plan,
          s.amount,
          s.status,
          s.start_date,
          s.end_date
        FROM subscriptions s
        JOIN users u
          ON s.user_id = u.id
        WHERE u.firebase_uid = $1
        ORDER BY s.created_at DESC
        LIMIT 1
        `,
        [firebaseUid]
      );

      if (result.rows.length === 0) {
        return res.json({
          subscribed: false,
          subscription: null,
        });
      }

      const subscription = result.rows[0];

      // Subscription is active only when:
      // 1. status is active
      // 2. end_date has not passed
      const isActive =
        subscription.status === "active" &&
        subscription.end_date &&
        new Date(subscription.end_date) > new Date();

      res.json({
        subscribed: isActive,
        subscription: {
          ...subscription,
          status: isActive
            ? "active"
            : "expired",
        },
      });
    } catch (error) {
      console.error(
        "Subscription fetch error:",
        error
      );

      res.status(500).json({
        error: "Failed to fetch subscription",
      });
    }
  }
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// PING
// =====================================================

app.get("/ping", (_req, res) => {
  res.status(200).send("Pong!");
});

// =====================================================
// SERVER SELF PING
// =====================================================

function pingServer() {
  if (!BACKEND_URL) {
    return;
  }

  const url = `${BACKEND_URL}/ping`;

  axios
    .get(url)
    .then(() =>
      console.log(
        "Pinged server at",
        new Date().toLocaleString()
      )
    )
    .catch((err) =>
      console.error(
        "Error pinging server:",
        err.message
      )
    );
}

// Every 10 minutes
setInterval(pingServer, 600000);

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});