import express from "express";
import cors from "cors";
import Razorpay from "razorpay";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Razorpay init
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Root route (backend test)
app.get("/", (req, res) => {
  res.send("🔥 Backend server is running!");
});

// ✅ Test route
app.get("/api", (req, res) => {
  res.send("🚀 Backend API working fine!");
});

// ✅ Razorpay: Create order
app.post("/api/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // paisa me
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

/* -----------------------------
   Serve Frontend Build (React/Vite)
--------------------------------*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// React build serve karo
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
