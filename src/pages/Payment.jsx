
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "../config"; 

export default function Payment({ isLight }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);

  const plans = [
    { id: "basic", name: "Basic", price: 19, quality: "720p", screens: 1 },
    { id: "standard", name: "Standard", price: 29, quality: "1080p", screens: 2 },
    { id: "premium", name: "Premium", price: 49, quality: "4K + HDR", screens: 4 },
  ];

  const selectedPlan = plans.find((p) => p.id === currentPlan) || null;

  async function ensureRazorpay() {
    if (window.Razorpay) return;
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = res;
      s.onerror = () => rej(new Error("checkout.js load failed"));
      document.body.appendChild(s);
    });
  }

  const handlePayment = async (amount, planId) => {
    try {
      const res = await fetch(`${API_BASE}/api/create-order`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const txt = await res.text();
        alert("❌ Order API failed: " + txt);
        return;
      }

      const { orderId, amount: paise, currency, keyId } = await res.json();
      if (!orderId) return alert("❌ Order create nahi hua");

      await ensureRazorpay();

      const options = {
        key: keyId,
        order_id: orderId,
        amount: paise,
        currency,
        name: "SAWANTFLIX",
        description: "Subscription Payment",
        method: "upi",
        prefill: { email: "user@example.com", contact: "9999999999" },
        theme: { color: "#E50914" },

        handler: (response) => {
          alert("✅ Payment Successful! Payment ID: " + response.razorpay_payment_id);
          setCurrentPlan(planId);

          setBillingHistory((prev) => [
            {
              id: response.razorpay_payment_id,
              date: new Date().toISOString().slice(0, 10),
              amount: `₹${amount}`,
              method: "UPI",
              status: "Success",
            },
            ...prev,
          ]);
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (resp) => {
        alert("❌ Payment Failed:\n" + JSON.stringify(resp.error, null, 2));
        setBillingHistory((prev) => [
          {
            id: resp?.error?.metadata?.payment_id || `txn_${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            amount: `₹${amount}`,
            method: "UPI",
            status: "Failed",
          },
          ...prev,
        ]);
      });

      rzp.open();
    } catch (error) {
      console.error("Payment init error:", error);
      alert("❌ Payment Failed (Console check karo)");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center pt-20 px-4 transition-colors duration-300 ${
        isLight ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      <div
        className={`w-full max-w-5xl rounded-2xl shadow-xl p-8 transition-colors duration-300 ${
          isLight ? "bg-gray-100" : "bg-zinc-900"
        }`}
      >
        <h1 className="text-3xl font-bold mb-2">Manage Subscription & Payment</h1>
        <p className={`${isLight ? "text-gray-600" : "text-gray-400"} mb-8`}>
          Update your payment method, view billing history, and manage your SAWANTFLIX plan.
        </p>

        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setCurrentPlan(plan.id)}
              className={`p-5 rounded-xl border cursor-pointer transition ${
                currentPlan === plan.id
                  ? "border-red-600 bg-opacity-80 shadow-lg"
                  : isLight
                  ? "border-gray-300 bg-white"
                  : "border-zinc-700 bg-zinc-800"
              }`}
            >
              <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
              <p className={`${isLight ? "text-gray-700" : "text-gray-300"}`}>₹{plan.price} / month</p>
              <p className={`${isLight ? "text-gray-600" : "text-gray-400"} text-sm`}>
                Quality: {plan.quality}
              </p>
              <p className={`${isLight ? "text-gray-600" : "text-gray-400"} text-sm mb-4`}>
                Screens: {plan.screens}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePayment(plan.price, plan.id);
                }}
                className={`w-full px-3 py-2 rounded-lg transition ${
                  currentPlan === plan.id
                    ? "bg-red-700 cursor-not-allowed text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? "Selected Plan" : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => selectedPlan && handlePayment(selectedPlan.price, selectedPlan.id)}
            disabled={!selectedPlan}
            className={`w-full px-4 py-3 rounded-xl font-medium transition ${
              isLight ? "bg-gray-200 hover:bg-gray-300 text-black" : "bg-zinc-700 hover:bg-zinc-600 text-white"
            } ${!selectedPlan ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            🪙 Pay via UPI (Test) —{" "}
            {selectedPlan ? `Pay ₹${selectedPlan.price}` : "Select a plan"}
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className={`w-full px-4 py-3 rounded-xl font-medium transition ${
              isLight ? "bg-gray-200 hover:bg-gray-300 text-black" : "bg-zinc-700 hover:bg-zinc-600 text-white"
            }`}
          >
            📄 View Billing History
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative ${
                isLight ? "bg-white text-black" : "bg-zinc-900 text-white"
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h2 className="text-2xl font-bold mb-4">Billing History</h2>

              {billingHistory.length === 0 ? (
                <div className={`${isLight ? "text-gray-600" : "text-gray-400"} p-4`}>
                  No transactions yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`${
                        isLight ? "border-b border-gray-300" : "border-b border-zinc-700"
                      }`}
                    >
                      <th className="p-3">Transaction ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((txn) => (
                      <tr
                        key={txn.id}
                        className={`${
                          isLight ? "border-b border-gray-200" : "border-b border-zinc-800"
                        }`}
                      >
                        <td className="p-3">{txn.id}</td>
                        <td className="p-3">{txn.date}</td>
                        <td className="p-3">{txn.amount}</td>
                        <td className="p-3">{txn.method}</td>
                        <td
                          className={`p-3 font-medium ${
                            txn.status === "Success" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {txn.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <button
                onClick={() => setShowHistory(false)}
                className={`absolute top-3 right-3 text-xl ${
                  isLight
                    ? "text-gray-500 hover:text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                ✖
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
