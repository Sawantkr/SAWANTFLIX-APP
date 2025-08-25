import express from "express";
import cors from "cors";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

console.log(" RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log(" RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "Loaded " : "Missing ");

const app = express();

app.use(cors());
app.use(express.json()); 


const key_id = process.env.RAZORPAY_KEY_ID;        
const key_secret = process.env.RAZORPAY_KEY_SECRET; 

if (!key_id || !key_secret) {
  console.warn(" Missing Razorpay keys in .env (Payment won't work).");
}

const razorpay = new Razorpay({ key_id, key_secret });


app.get("/", (_req, res) => res.send(" Backend server is running!"));
app.get("/api", (_req, res) => res.json({ ok: true, msg: " Backend API working fine!" }));


app.post("/api/create-order", async (req, res) => {
  try {
    const { amount } = req.body; 
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    console.log(" Creating order for amount:", amount);

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`
    });

    console.log(" Order created:", order.id);

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id, 
    });
  } catch (e) {
    console.error(" Order create error:", e?.error || e);
    return res.status(500).json({
      error: "Order creation failed",
      details: e?.error?.description || e?.message || "Unknown error",
    });
  }
});


app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing fields" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(payload)
      .digest("hex");

    const verified = expectedSignature === razorpay_signature;

    console.log("🔑 Payment verification:", verified);

    return res.json({ verified });
  } catch (e) {
    console.error(" Verify error:", e);
    return res.status(500).json({ verified: false, error: "Verification failed" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  } catch {
    res.status(404).send("Frontend build not found");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
