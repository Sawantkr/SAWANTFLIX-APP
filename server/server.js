import express from "express";
import cors from "cors";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import axios from "axios";

import { admin, db } from "./firebase.js";
import pool from "./postgres.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

const BACKEND_URL =
  process.env.Backend_URL;

const SUPPORT_API_KEY =
  process.env.SUPPORT_API_KEY;

const SUPPORT_ADMIN_EMAIL =
  "sawantkumarsawant7209@gmail.com";

// =====================================================
// FIREBASE SUPPORT ADMIN AUTHENTICATION
// =====================================================

const verifySupportAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        ok: false,
        error: "Authentication token is required",
      });
    }

    const idToken = authHeader.substring(7);

    if (!idToken) {
      return res.status(401).json({
        ok: false,
        error: "Authentication token is required",
      });
    }

    const decodedToken =
      await admin.auth().verifyIdToken(idToken);

    const userEmail =
      decodedToken.email?.toLowerCase().trim();

    if (
      userEmail !==
      SUPPORT_ADMIN_EMAIL.toLowerCase().trim()
    ) {
      return res.status(403).json({
        ok: false,
        error: "Access denied. Support admin only.",
      });
    }

    req.supportAdmin = decodedToken;

    next();
  } catch (error) {
    console.error(
      "Support admin authentication error:",
      error
    );

    return res.status(401).json({
      ok: false,
      error: "Invalid or expired authentication token",
    });
  }
};

// =====================================================
// FIREBASE ADMIN OR SUPPORT API KEY
// =====================================================

const verifySupportAdminOrApiKey = async (
  req,
  res,
  next
) => {
  const supportApiKey =
    req.headers["x-support-api-key"];

  if (
    supportApiKey &&
    supportApiKey === SUPPORT_API_KEY
  ) {
    return next();
  }

  return verifySupportAdmin(
    req,
    res,
    next
  );
};

// =====================================================
// RAZORPAY CONFIGURATION CHECK
// =====================================================

if (!key_id || !key_secret) {
  console.warn(
    "⚠️ Missing Razorpay keys in .env (Payment won't work)."
  );
}

// =====================================================
// RAZORPAY INSTANCE
// =====================================================

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

// =====================================================
// BASIC ROUTES
// =====================================================

app.get("/", (_req, res) => {
  res.send(
    "Backend server is running!"
  );
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

app.get(
  "/api/db-test",
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          "SELECT current_database(), current_user"
        );

      res.json({
        ok: true,
        database:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "PostgreSQL error:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          "PostgreSQL connection failed",
      });
    }
  }
);

// =====================================================
// USER SYNC
// FIREBASE USER -> POSTGRESQL
// =====================================================

app.post(
  "/api/users/sync",
  async (req, res) => {
    try {
      const {
        firebaseUid,
        email,
        name,
      } = req.body;

      if (!firebaseUid) {
        return res.status(400).json({
          error:
            "firebaseUid is required",
        });
      }

      const result =
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
          RETURNING *
          `,
          [
            firebaseUid,
            email || null,
            name || null,
          ]
        );

      console.log(
        "✅ User synced:",
        firebaseUid
      );

      res.json({
        ok: true,
        user: result.rows[0],
      });
    } catch (error) {
      console.error(
        "User sync error:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          "Failed to sync user",
      });
    }
  }
);

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

app.post(
  "/api/create-order",
  async (req, res) => {
    try {
      const {
        amount,
        firebaseUid,
        email,
        name,
      } = req.body;

      if (
        !amount ||
        isNaN(amount) ||
        Number(amount) <= 0
      ) {
        return res.status(400).json({
          error:
            "Invalid amount",
        });
      }

      console.log(
        "Creating order for amount:",
        amount
      );

      // MAKE SURE USER EXISTS

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

      // CREATE RAZORPAY ORDER

      const order =
        await razorpay.orders.create({
          amount: Math.round(
            Number(amount) * 100
          ),
          currency: "INR",
          receipt:
            `rcpt_${Date.now()}`,
        });

      console.log(
        "Order created:",
        order.id
      );

      return res.json({
        orderId: order.id,
        amount: order.amount,
        currency:
          order.currency,
        keyId: key_id,
      });
    } catch (e) {
      console.error(
        "Order create error:",
        e?.error || e
      );

      return res.status(500).json({
        error:
          "Order creation failed",
        details:
          e?.error?.description ||
          e?.message ||
          "Unknown error",
      });
    }
  }
);

// =====================================================
// VERIFY PAYMENT + SAVE PAYMENT
// =====================================================

app.post(
  "/api/verify-payment",
  async (req, res) => {
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
          error:
            "Missing payment fields",
        });
      }

      const payload =
        `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            key_secret
          )
          .update(payload)
          .digest("hex");

      const verified =
        expectedSignature ===
        razorpay_signature;

      console.log(
        "🔑 Payment verification:",
        verified
      );

      if (!verified) {
        return res.json({
          verified: false,
        });
      }

      if (firebaseUid) {
        const userResult =
          await pool.query(
            `
            SELECT id
            FROM users
            WHERE firebase_uid = $1
            `,
            [firebaseUid]
          );

        if (
          userResult.rows.length >
          0
        ) {
          const userId =
            userResult.rows[0].id;

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
                CURRENT_TIMESTAMP +
                  INTERVAL '30 days'
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
        savedToDatabase:
          Boolean(firebaseUid),
      });
    } catch (error) {
      console.error(
        "Verify payment error:",
        error
      );

      return res.status(500).json({
        verified: false,
        error:
          "Verification failed",
      });
    }
  }
);

// =====================================================
// CUSTOMER SUPPORT API
// AI ACCESS
// =====================================================

app.get(
  "/api/support/customer/:firebaseUid",
  async (req, res) => {
    try {
      const supportApiKey =
        req.headers[
          "x-support-api-key"
        ];

      if (
        !supportApiKey ||
        supportApiKey !==
          SUPPORT_API_KEY
      ) {
        return res.status(401).json({
          ok: false,
          error:
            "Unauthorized",
        });
      }

      const {
        firebaseUid,
      } = req.params;

      const userResult =
        await pool.query(
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

      if (
        userResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "Customer not found",
        });
      }

      const user =
        userResult.rows[0];

      const subscriptionResult =
        await pool.query(
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

      const paymentResult =
        await pool.query(
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
        subscriptionResult
          .rows[0] || null;

      const latestPayment =
        paymentResult
          .rows[0] || null;

      res.json({
        ok: true,

        customer: {
          id: user.id,

          firebaseUid:
            user.firebase_uid,

          email:
            user.email,

          name:
            user.name,

          createdAt:
            user.created_at,
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
        error:
          "Failed to fetch customer support data",
      });
    }
  }
);

// =====================================================
// CREATE SUPPORT TICKET
// AI ACCESS
// =====================================================

// =====================================================
// CREATE / REUSE SUPPORT TICKET
// AI ACCESS
// =====================================================

app.post(
  "/api/support/tickets",
  async (req, res) => {
    try {
      const supportApiKey =
        req.headers["x-support-api-key"];

      if (
        !supportApiKey ||
        supportApiKey !== SUPPORT_API_KEY
      ) {
        return res.status(401).json({
          ok: false,
          error: "Unauthorized",
        });
      }

      const {
        firebaseUid,
        subject,
        category,
        message,
      } = req.body;

      if (!firebaseUid || !message) {
        return res.status(400).json({
          ok: false,
          error:
            "firebaseUid and message are required",
        });
      }

      // -------------------------------------------------
      // FIND CUSTOMER
      // -------------------------------------------------

      const userResult =
        await pool.query(
          `
          SELECT id
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

      const userId =
        userResult.rows[0].id;

      // -------------------------------------------------
      // CHECK FOR EXISTING ACTIVE TICKET
      // -------------------------------------------------
      // Business logic:
      // open / in_progress ticket = reuse it
      // resolved ticket = create a new ticket

      const existingTicketResult =
        await pool.query(
          `
          SELECT
            id,
            user_id,
            subject,
            status,
            priority,
            category,
            created_at,
            updated_at
          FROM support_tickets
          WHERE user_id = $1
            AND status IN ('open', 'in_progress')
          ORDER BY updated_at DESC
          LIMIT 1
          `,
          [userId]
        );

      // -------------------------------------------------
      // REUSE EXISTING ACTIVE TICKET
      // -------------------------------------------------

      if (existingTicketResult.rows.length > 0) {
        const ticket =
          existingTicketResult.rows[0];

        const messageResult =
          await pool.query(
            `
            INSERT INTO support_messages (
              ticket_id,
              sender_type,
              message
            )
            VALUES (
              $1,
              'customer',
              $2
            )
            RETURNING *
            `,
            [
              ticket.id,
              message,
            ]
          );

        await pool.query(
          `
          UPDATE support_tickets
          SET
            updated_at = NOW()
          WHERE id = $1
          `,
          [ticket.id]
        );

        // Customer-facing ticket number
        const customerTicketNumberResult =
          await pool.query(
            `
            SELECT COUNT(*)::int AS customer_ticket_number
            FROM support_tickets
            WHERE user_id = $1
              AND id <= $2
            `,
            [
              userId,
              ticket.id,
            ]
          );

        const customerTicketNumber =
          customerTicketNumberResult
            .rows[0]
            ?.customer_ticket_number || 1;

        ticket.customer_ticket_number =
          customerTicketNumber;

        console.log(
          "♻️ Existing support ticket reused:",
          ticket.id
        );

        return res.status(200).json({
          ok: true,
          reused: true,
          ticket,
          ticket_id: ticket.id,
          customer_ticket_number:
            customerTicketNumber,
          message:
            messageResult.rows[0],
        });
      }

      // -------------------------------------------------
      // NO ACTIVE TICKET
      // CREATE NEW TICKET
      // -------------------------------------------------

      const ticketResult =
        await pool.query(
          `
          INSERT INTO support_tickets (
            user_id,
            subject,
            category,
            status,
            priority
          )
          VALUES (
            $1,
            $2,
            $3,
            'open',
            'normal'
          )
          RETURNING *
          `,
          [
            userId,

            subject ||
              "Customer Support",

            category ||
              "general",
          ]
        );

      const ticket =
        ticketResult.rows[0];

      // -------------------------------------------------
      // CUSTOMER TICKET NUMBER
      // -------------------------------------------------

      const customerTicketNumberResult =
        await pool.query(
          `
          SELECT COUNT(*)::int AS customer_ticket_number
          FROM support_tickets
          WHERE user_id = $1
            AND id <= $2
          `,
          [
            userId,
            ticket.id,
          ]
        );

      const customerTicketNumber =
        customerTicketNumberResult
          .rows[0]
          ?.customer_ticket_number || 1;

      ticket.customer_ticket_number =
        customerTicketNumber;

      // -------------------------------------------------
      // SAVE FIRST CUSTOMER MESSAGE
      // -------------------------------------------------

      const messageResult =
        await pool.query(
          `
          INSERT INTO support_messages (
            ticket_id,
            sender_type,
            message
          )
          VALUES (
            $1,
            'customer',
            $2
          )
          RETURNING *
          `,
          [
            ticket.id,
            message,
          ]
        );

      console.log(
        "✅ New support ticket created:",
        ticket.id
      );

      return res.status(201).json({
        ok: true,
        reused: false,
        ticket,
        ticket_id: ticket.id,
        customer_ticket_number:
          customerTicketNumber,
        message:
          messageResult.rows[0],
      });

    } catch (error) {
      console.error(
        "Create/reuse support ticket error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to create support ticket",
      });
    }
  }
);

// =====================================================
// GET ALL SUPPORT TICKETS
// HUMAN SUPPORT DASHBOARD
// =====================================================

app.get(
  "/api/support/tickets",
  verifySupportAdmin,
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            st.id,
            st.user_id,
            u.firebase_uid,
            u.email,
            u.name,
            st.subject,
            st.status,
            st.priority,
            st.category,
            st.created_at,
            st.updated_at
          FROM support_tickets st
          LEFT JOIN users u
            ON st.user_id = u.id
          ORDER BY
            st.created_at DESC
          `
        );

      return res.json({
        ok: true,
        tickets:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Get all support tickets error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to fetch support tickets",
      });
    }
  }
);

// =====================================================
// GET CUSTOMER SUPPORT TICKETS
// AI ACCESS
// =====================================================

app.get(
  "/api/support/tickets/:firebaseUid",
  async (req, res) => {
    try {
      const supportApiKey =
        req.headers[
          "x-support-api-key"
        ];

      if (
        !supportApiKey ||
        supportApiKey !==
          SUPPORT_API_KEY
      ) {
        return res.status(401).json({
          ok: false,
          error:
            "Unauthorized",
        });
      }

      const {
        firebaseUid,
      } = req.params;

      const result =
        await pool.query(
          `
          SELECT
            st.id,
            st.user_id,
            st.subject,
            st.status,
            st.priority,
            st.category,
            st.created_at,
            st.updated_at,

            (
              SELECT COUNT(*)::int
              FROM support_tickets st2
              WHERE st2.user_id = st.user_id
                AND st2.id <= st.id
            ) AS customer_ticket_number

          FROM support_tickets st
          JOIN users u
            ON st.user_id = u.id
          WHERE u.firebase_uid = $1
          ORDER BY
            st.created_at DESC
          `,
          [firebaseUid]
        );

      return res.json({
        ok: true,
        tickets:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Get support tickets error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to fetch support tickets",
      });
    }
  }
);

// =====================================================
// GET TICKET MESSAGES
// =====================================================

app.get(
  "/api/support/tickets/:ticketId/messages",
  verifySupportAdminOrApiKey,
  async (req, res) => {
    try {
      const {
        ticketId,
      } = req.params;

      const result =
        await pool.query(
          `
          SELECT
            id,
            ticket_id,
            sender_type,
            message,
            created_at
          FROM support_messages
          WHERE ticket_id = $1
          ORDER BY
            created_at ASC
          `,
          [ticketId]
        );

      return res.json({
        ok: true,
        messages:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Get support messages error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to fetch support messages",
      });
    }
  }
);

// =====================================================
// ADD HUMAN AGENT MESSAGE
// HUMAN SUPPORT DASHBOARD
// =====================================================

app.post(
  "/api/support/tickets/:ticketId/messages",
  verifySupportAdmin,
  async (req, res) => {
    try {
      const {
        ticketId,
      } = req.params;

      const {
        message,
      } = req.body;

      if (
        !message ||
        !message.trim()
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Message is required",
        });
      }

      const ticketResult =
        await pool.query(
          `
          SELECT id
          FROM support_tickets
          WHERE id = $1
          `,
          [ticketId]
        );

      if (
        ticketResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "Ticket not found",
        });
      }

      const messageResult =
        await pool.query(
          `
          INSERT INTO support_messages (
            ticket_id,
            sender_type,
            message
          )
          VALUES (
            $1,
            'agent',
            $2
          )
          RETURNING
            id,
            ticket_id,
            sender_type,
            message,
            created_at
          `,
          [
            ticketId,
            message.trim(),
          ]
        );

      await pool.query(
        `
        UPDATE support_tickets
        SET
          status = 'in_progress',
          updated_at = NOW()
        WHERE id = $1
        `,
        [ticketId]
      );

      return res.status(201).json({
        ok: true,
        message:
          messageResult.rows[0],
      });
    } catch (error) {
      console.error(
        "Add agent message error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to send agent message",
      });
    }
  }
);

// =====================================================
// UPDATE SUPPORT TICKET STATUS
// HUMAN SUPPORT
// =====================================================

app.put(
  "/api/support/tickets/:ticketId/status",
  verifySupportAdmin,
  async (req, res) => {
    try {
      const {
        ticketId,
      } = req.params;

      const {
        status,
      } = req.body;

      const allowedStatuses = [
        "open",
        "in_progress",
        "resolved",
      ];

      if (!status) {
        return res.status(400).json({
          ok: false,
          error:
            "Status is required",
        });
      }

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Invalid status. Allowed values: open, in_progress, resolved",
        });
      }

      const ticketCheck =
        await pool.query(
          `
          SELECT id
          FROM support_tickets
          WHERE id = $1
          `,
          [ticketId]
        );

      if (
        ticketCheck.rows.length ===
        0
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "Ticket not found",
        });
      }

      const result =
        await pool.query(
          `
          UPDATE support_tickets
          SET
            status = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            user_id,
            subject,
            status,
            priority,
            category,
            created_at,
            updated_at
          `,
          [
            status,
            ticketId,
          ]
        );

      console.log(
        `✅ Ticket ${ticketId} status updated to ${status}`
      );

      return res.json({
        ok: true,
        ticket:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Update support ticket status error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to update ticket status",
      });
    }
  }
);

// =====================================================
// CREATE REFUND REQUEST
// HUMAN SUPPORT
// =====================================================

app.post(
  "/api/support/tickets/:ticketId/refund",
  verifySupportAdmin,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { reason, amount } = req.body;

      // -------------------------------------------------
      // VALIDATE REASON
      // -------------------------------------------------

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          ok: false,
          error: "Refund reason is required",
        });
      }

      // -------------------------------------------------
      // FIND TICKET + CUSTOMER
      // -------------------------------------------------

      const ticketResult =
        await pool.query(
          `
          SELECT
            st.id AS ticket_id,
            st.user_id,
            st.status AS ticket_status,
            u.firebase_uid,
            u.email,
            u.name
          FROM support_tickets st
          JOIN users u
            ON st.user_id = u.id
          WHERE st.id = $1
          `,
          [ticketId]
        );

      if (
        ticketResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "Support ticket not found",
        });
      }

      const ticket =
        ticketResult.rows[0];

      // -------------------------------------------------
      // FIND SUCCESSFUL PAYMENT
      // -------------------------------------------------

      const paymentResult =
        await pool.query(
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
            AND status = 'success'
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [ticket.user_id]
        );

      if (
        paymentResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "No successful payment found for this customer",
        });
      }

      const payment =
        paymentResult.rows[0];

      // -------------------------------------------------
      // REFUND AMOUNT
      // -------------------------------------------------

      const refundAmount =
        amount !== undefined &&
        amount !== null &&
        amount !== ""
          ? Number(amount)
          : Number(payment.amount);

      if (
        !Number.isFinite(
          refundAmount
        ) ||
        refundAmount <= 0
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Invalid refund amount",
        });
      }

      if (
        refundAmount >
        Number(payment.amount)
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Refund amount cannot be greater than payment amount",
        });
      }

      // -------------------------------------------------
      // CHECK EXISTING REFUND
      // -------------------------------------------------

      const existingRefund =
        await pool.query(
          `
          SELECT
            id,
            payment_id,
            razorpay_refund_id,
            amount,
            status,
            reason,
            created_at
          FROM refunds
          WHERE payment_id = $1
            AND status IN (
              'requested',
              'approved',
              'processed'
            )
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [payment.id]
        );

      if (
        existingRefund.rows.length >
        0
      ) {
        return res.status(409).json({
          ok: false,
          error:
            "A refund already exists for this payment",
          refund:
            existingRefund.rows[0],
        });
      }

      // -------------------------------------------------
      // INSERT REFUND REQUEST
      // -------------------------------------------------

      const refundResult =
        await pool.query(
          `
          INSERT INTO refunds (
            payment_id,
            amount,
            status,
            reason,
            requested_by
          )
          VALUES (
            $1,
            $2,
            'requested',
            $3,
            $4
          )
          RETURNING *
          `,
          [
            payment.id,
            refundAmount,
            reason.trim(),
            ticket.email ||
              ticket.firebase_uid,
          ]
        );

      const refund =
        refundResult.rows[0];

      console.log(
        "💰 Refund request created:",
        refund.id
      );

      // -------------------------------------------------
      // ADD MESSAGE TO SUPPORT CHAT
      // -------------------------------------------------

      await pool.query(
        `
        INSERT INTO support_messages (
          ticket_id,
          sender_type,
          message
        )
        VALUES (
          $1,
          'agent',
          $2
        )
        `,
        [
          ticketId,
          `Refund request created for ₹${refundAmount}. Status: requested. Reason: ${reason.trim()}`,
        ]
      );

      // -------------------------------------------------
      // UPDATE TICKET
      // -------------------------------------------------

      await pool.query(
        `
        UPDATE support_tickets
        SET
          status = 'in_progress',
          updated_at = NOW()
        WHERE id = $1
        `,
        [ticketId]
      );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(201).json({
        ok: true,

        message:
          "Refund request created successfully",

        refund,

        payment: {
          id: payment.id,
          razorpay_order_id:
            payment.razorpay_order_id,
          razorpay_payment_id:
            payment.razorpay_payment_id,
          amount: payment.amount,
          status: payment.status,
        },

        ticket: {
          id: ticket.ticket_id,
          status: "in_progress",
        },
      });
    } catch (error) {
      console.error(
        "Create refund request error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to create refund request",
      });
    }
  }
);


// =====================================================
// CUSTOMER CREATE REFUND REQUEST
// FIREBASE AUTHENTICATED CUSTOMER
// =====================================================

app.post(
  "/api/support/customer/refund-request",
  async (req, res) => {
    try {
      // -------------------------------------------------
      // VERIFY FIREBASE CUSTOMER TOKEN
      // -------------------------------------------------

      const authHeader = req.headers.authorization;

      if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
      ) {
        return res.status(401).json({
          ok: false,
          error: "Authentication token is required",
        });
      }

      const idToken = authHeader.substring(7);

      if (!idToken) {
        return res.status(401).json({
          ok: false,
          error: "Authentication token is required",
        });
      }

      const decodedToken =
        await admin.auth().verifyIdToken(idToken);

      const firebaseUid = decodedToken.uid;
      const customerEmail = decodedToken.email || null;

      // -------------------------------------------------
      // REQUEST BODY
      // -------------------------------------------------

      const {
        ticketId,
        reason,
        amount,
      } = req.body;

      if (!ticketId) {
        return res.status(400).json({
          ok: false,
          error: "ticketId is required",
        });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          ok: false,
          error: "Refund reason is required",
        });
      }

      // -------------------------------------------------
      // VERIFY TICKET BELONGS TO CUSTOMER
      // -------------------------------------------------

      const ticketResult =
        await pool.query(
          `
          SELECT
            st.id AS ticket_id,
            st.user_id,
            st.status AS ticket_status,
            u.firebase_uid,
            u.email,
            u.name
          FROM support_tickets st
          JOIN users u
            ON st.user_id = u.id
          WHERE st.id = $1
            AND u.firebase_uid = $2
          `,
          [
            ticketId,
            firebaseUid,
          ]
        );

      if (
        ticketResult.rows.length === 0
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "Support ticket not found for this customer",
        });
      }

      const ticket =
        ticketResult.rows[0];

      // -------------------------------------------------
      // FIND SUCCESSFUL PAYMENT
      // -------------------------------------------------

      const paymentResult =
        await pool.query(
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
            AND status = 'success'
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [ticket.user_id]
        );

      if (
        paymentResult.rows.length === 0
      ) {
        return res.status(404).json({
          ok: false,
          error:
            "No successful payment found for this customer",
        });
      }

      const payment =
        paymentResult.rows[0];

      // -------------------------------------------------
      // REFUND AMOUNT
      // -------------------------------------------------

      const refundAmount =
        amount !== undefined &&
        amount !== null &&
        amount !== ""
          ? Number(amount)
          : Number(payment.amount);

      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0
      ) {
        return res.status(400).json({
          ok: false,
          error: "Invalid refund amount",
        });
      }

      if (
        refundAmount >
        Number(payment.amount)
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Refund amount cannot be greater than payment amount",
        });
      }

      // -------------------------------------------------
      // CHECK EXISTING REFUND
      // -------------------------------------------------

      const existingRefund =
        await pool.query(
          `
          SELECT
            id,
            payment_id,
            razorpay_refund_id,
            amount,
            status,
            reason,
            requested_by,
            created_at,
            updated_at
          FROM refunds
          WHERE payment_id = $1
            AND status IN (
              'requested',
              'approved',
              'processed'
            )
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [payment.id]
        );

      if (
        existingRefund.rows.length > 0
      ) {
        return res.status(409).json({
          ok: false,
          error:
            "A refund already exists for this payment",
          refund:
            existingRefund.rows[0],
        });
      }

      // -------------------------------------------------
      // CREATE REFUND REQUEST
      // -------------------------------------------------

      const refundResult =
        await pool.query(
          `
          INSERT INTO refunds (
            payment_id,
            amount,
            status,
            reason,
            requested_by
          )
          VALUES (
            $1,
            $2,
            'requested',
            $3,
            $4
          )
          RETURNING *
          `,
          [
            payment.id,
            refundAmount,
            reason.trim(),
            customerEmail ||
              firebaseUid,
          ]
        );

      const refund =
        refundResult.rows[0];

      console.log(
        "💰 Customer refund request created:",
        refund.id,
        "Customer:",
        firebaseUid
      );

      // -------------------------------------------------
      // ADD MESSAGE TO SUPPORT CHAT
      // -------------------------------------------------

      await pool.query(
        `
        INSERT INTO support_messages (
          ticket_id,
          sender_type,
          message
        )
        VALUES (
          $1,
          'customer',
          $2
        )
        `,
        [
          ticketId,
          `Refund requested for ₹${refundAmount}. Reason: ${reason.trim()}`,
        ]
      );

      // -------------------------------------------------
      // UPDATE SUPPORT TICKET
      // -------------------------------------------------

      await pool.query(
        `
        UPDATE support_tickets
        SET
          status = 'in_progress',
          updated_at = NOW()
        WHERE id = $1
        `,
        [ticketId]
      );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(201).json({
        ok: true,

        message:
          "Refund request submitted successfully",

        refund,

        payment: {
          id: payment.id,
          razorpay_order_id:
            payment.razorpay_order_id,
          razorpay_payment_id:
            payment.razorpay_payment_id,
          amount: payment.amount,
          status: payment.status,
        },

        ticket: {
          id: ticket.ticket_id,
          status: "in_progress",
        },
      });
    } catch (error) {
      console.error(
        "Customer refund request error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error:
          "Failed to submit refund request",
        details:
          error?.message ||
          "Unknown error",
      });
    }
  }
);



// =====================================================
// GET ALL REFUNDS
// HUMAN SUPPORT DASHBOARD
// =====================================================

app.get(
  "/api/support/refunds",
  verifySupportAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          r.id,
          r.payment_id,
          r.razorpay_refund_id,
          r.amount,
          r.status,
          r.reason,
          r.requested_by,
          r.approved_by,
          r.created_at,
          r.updated_at,

          p.razorpay_order_id,
          p.razorpay_payment_id,
          p.amount AS payment_amount,

          u.firebase_uid,
          u.email,
          u.name

        FROM refunds r

        JOIN payments p
          ON r.payment_id = p.id

        JOIN users u
          ON p.user_id = u.id

        ORDER BY
          r.created_at DESC
        `
      );

      return res.json({
        ok: true,
        refunds: result.rows,
      });
    } catch (error) {
      console.error(
        "Get refunds error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error: "Failed to fetch refunds",
      });
    }
  }
);

// =====================================================
// APPROVE REFUND
// HUMAN SUPPORT
// ACTUAL RAZORPAY REFUND
// =====================================================

app.post(
  "/api/support/refunds/:refundId/approve",
  verifySupportAdmin,
  async (req, res) => {
    try {
      const { refundId } = req.params;

      const refundResult =
        await pool.query(
          `
          SELECT
            r.id,
            r.payment_id,
            r.amount,
            r.status,
            r.reason,

            p.razorpay_payment_id,
            p.amount AS payment_amount,
            p.user_id

          FROM refunds r

          JOIN payments p
            ON r.payment_id = p.id

          WHERE r.id = $1
          `,
          [refundId]
        );

      if (refundResult.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "Refund request not found",
        });
      }

      const refund = refundResult.rows[0];

      // Only requested refunds can be approved
      if (refund.status !== "requested") {
        return res.status(409).json({
          ok: false,
          error:
            `Refund cannot be approved because current status is '${refund.status}'`,
        });
      }

      if (!refund.razorpay_payment_id) {
        return res.status(400).json({
          ok: false,
          error: "Razorpay payment ID is missing",
        });
      }

      const refundAmount = Number(
        refund.amount
      );

      const paymentAmount = Number(
        refund.payment_amount
      );

      // Validate refund amount
      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0 ||
        !Number.isFinite(paymentAmount) ||
        refundAmount > paymentAmount
      ) {
        return res.status(400).json({
          ok: false,
          error: "Invalid refund amount",
        });
      }

      // -------------------------------------------------
      // MARK REFUND AS APPROVED
      // -------------------------------------------------

      await pool.query(
        `
        UPDATE refunds
        SET
          status = 'approved',
          approved_by = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          req.supportAdmin.email,
          refundId,
        ]
      );

      // -------------------------------------------------
      // CREATE ACTUAL RAZORPAY REFUND
      // -------------------------------------------------

      try {
        // -------------------------------------------------
        // TEMPORARY RAZORPAY PAYMENT DIAGNOSTIC
        // Check the exact payment before attempting refund.
        // -------------------------------------------------

        const paymentDetails =
          await razorpay.payments.fetch(
            refund.razorpay_payment_id
          );

        console.log(
          "🔎 Razorpay Payment Details:",
          {
            id: paymentDetails.id,
            amount: paymentDetails.amount,
            status: paymentDetails.status,
            captured: paymentDetails.captured,
            amount_refunded:
              paymentDetails.amount_refunded,
            refund_status:
              paymentDetails.refund_status,
          }
        );

        console.log(
          "Refund Payment ID:",
          refund.razorpay_payment_id
        );

        console.log(
          "Refund Amount Paise:",
          Math.round(refundAmount * 100)
        );

        // -------------------------------------------------
        // RAZORPAY REFUND VIA DIRECT REST API
        // This bypasses the SDK only to diagnose the
        // "invalid request sent" response.
        // -------------------------------------------------

        const refundAmountPaise = Math.round(
          refundAmount * 100
        );

        const refundResponse =
          await axios.post(
            `https://api.razorpay.com/v1/payments/${refund.razorpay_payment_id}/refund`,
            {
              amount: refundAmountPaise,
            },
            {
              auth: {
                username: key_id,
                password: key_secret,
              },
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

        const razorpayRefund =
          refundResponse.data;

        console.log(
          "💰 Razorpay refund created:",
          razorpayRefund.id
        );

        // -------------------------------------------------
        // MARK REFUND AS PROCESSED
        // -------------------------------------------------

        const updatedRefund =
          await pool.query(
            `
            UPDATE refunds
            SET
              razorpay_refund_id = $1,
              status = 'processed',
              updated_at = NOW()
            WHERE id = $2
            RETURNING *
            `,
            [
              razorpayRefund.id,
              refundId,
            ]
          );

        // -------------------------------------------------
        // EXPIRE SUBSCRIPTION AFTER FULL REFUND
        // -------------------------------------------------

        if (refundAmount === paymentAmount) {
          await pool.query(
            `
            UPDATE subscriptions
            SET
              status = 'expired',
              end_date = CURRENT_TIMESTAMP
            WHERE user_id = $1
              AND status = 'active'
            `,
            [refund.user_id]
          );

          console.log(
            "✅ Subscription expired after full refund:",
            refund.user_id
          );
        }

        return res.json({
          ok: true,
          message:
            "Refund approved and processed successfully",

          refund:
            updatedRefund.rows[0],

          razorpay: {
            refundId:
              razorpayRefund.id,

            paymentId:
              refund.razorpay_payment_id,

            amount:
              refundAmount,
          },
        });
      } catch (razorpayError) {
        console.error(
          "Razorpay refund error:",
          razorpayError?.response?.data ||
            razorpayError?.error ||
            razorpayError?.message ||
            "Unknown Razorpay error"
        );

        console.error(
          "Razorpay HTTP status:",
          razorpayError?.response?.status ||
            "unknown"
        );

        // -------------------------------------------------
        // ROLLBACK APPROVAL IF RAZORPAY FAILS
        // -------------------------------------------------

        await pool.query(
          `
          UPDATE refunds
          SET
            status = 'requested',
            approved_by = NULL,
            updated_at = NOW()
          WHERE id = $1
          `,
          [refundId]
        );

        return res.status(500).json({
          ok: false,
          error: "Razorpay refund failed",

          details:
            razorpayError?.error
              ?.description ||
            razorpayError?.message ||
            "Unknown Razorpay error",
        });
      }
    } catch (error) {
      console.error(
        "Approve refund error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error: "Failed to approve refund",
      });
    }
  }
);

// =====================================================
// REJECT REFUND
// HUMAN SUPPORT
// =====================================================

app.post(
  "/api/support/refunds/:refundId/reject",
  verifySupportAdmin,
  async (req, res) => {
    try {
      const { refundId } = req.params;

      const { reason } = req.body;

      const refundResult =
        await pool.query(
          `
          SELECT
            id,
            payment_id,
            amount,
            status,
            reason

          FROM refunds

          WHERE id = $1
          `,
          [refundId]
        );

      if (refundResult.rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "Refund request not found",
        });
      }

      const refund =
        refundResult.rows[0];

      // Only requested refunds can be rejected
      if (refund.status !== "requested") {
        return res.status(409).json({
          ok: false,
          error:
            `Refund cannot be rejected because current status is '${refund.status}'`,
        });
      }

      const rejectionReason =
        reason &&
        reason.trim()
          ? reason.trim()
          : "Refund rejected by support";

      const updatedRefund =
        await pool.query(
          `
          UPDATE refunds
          SET
            status = 'rejected',

            reason = $1,

            approved_by = $2,

            updated_at = NOW()

          WHERE id = $3

          RETURNING *
          `,
          [
            `${refund.reason} | Rejection: ${rejectionReason}`,

            req.supportAdmin.email,

            refundId,
          ]
        );

      // -------------------------------------------------
      // NOTIFY CUSTOMER IN THEIR ACTIVE SUPPORT TICKET
      // Refunds do not store ticket_id, so resolve the
      // customer through the payment and use the latest
      // active ticket for that customer.
      // -------------------------------------------------

      const ticketResult =
        await pool.query(
          `
          SELECT st.id
          FROM support_tickets st
          JOIN users u
            ON st.user_id = u.id
          JOIN payments p
            ON p.user_id = u.id
          WHERE p.id = $1
          ORDER BY st.updated_at DESC, st.created_at DESC
          LIMIT 1
          `,
          [refund.payment_id]
        );

      if (ticketResult.rows.length > 0) {
        const ticketId = ticketResult.rows[0].id;

        await pool.query(
          `
          INSERT INTO support_messages (
            ticket_id,
            sender_type,
            message
          )
          VALUES ($1, 'agent', $2)
          `,
          [
            ticketId,
            `❌ Refund request rejected. Reason: ${rejectionReason}`,
          ]
        );

        await pool.query(
          `
          UPDATE support_tickets
          SET
            status = 'in_progress',
            updated_at = NOW()
          WHERE id = $1
          `,
          [ticketId]
        );

        console.log(
          "📩 Refund rejection message sent to ticket:",
          ticketId
        );
      } else {
        console.warn(
          "⚠️ Refund rejected, but no active support ticket was found for payment:",
          refund.payment_id
        );
      }

      console.log(
        "❌ Refund rejected:",
        refundId
      );

      return res.json({
        ok: true,

        message:
          "Refund request rejected",

        refund:
          updatedRefund.rows[0],
      });
    } catch (error) {
      console.error(
        "Reject refund error:",
        error
      );

      return res.status(500).json({
        ok: false,
        error: "Failed to reject refund",
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
      const {
        firebaseUid,
      } = req.params;

      const result =
        await pool.query(
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
          ORDER BY
            s.created_at DESC
          LIMIT 1
          `,
          [firebaseUid]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.json({
          subscribed: false,
          subscription: null,
        });
      }

      const subscription =
        result.rows[0];

      const isActive =
        subscription.status ===
          "active" &&
        subscription.end_date &&
        new Date(
          subscription.end_date
        ) > new Date();

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
        error:
          "Failed to fetch subscription",
      });
    }
  }
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/health",
  (_req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp:
        new Date().toISOString(),
    });
  }
);

// =====================================================
// PING
// =====================================================

app.get(
  "/ping",
  (_req, res) => {
    res.status(200).send(
      "Pong!"
    );
  }
);

// =====================================================
// SERVER SELF PING
// =====================================================

function pingServer() {
  if (!BACKEND_URL) {
    return;
  }

  const url =
    `${BACKEND_URL}/ping`;

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

// =====================================================
// EVERY 10 MINUTES
// =====================================================

setInterval(
  pingServer,
  600000
);

// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `🚀 Server running on port ${PORT}`
    );
  }
);