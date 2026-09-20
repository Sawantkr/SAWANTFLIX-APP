import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "../config";
import { auth } from "../firebase";

export default function Payment({ isLight }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 19,
      quality: "720p",
      screens: 1,
    },
    {
      id: "standard",
      name: "Standard",
      price: 29,
      quality: "1080p",
      screens: 2,
    },
    {
      id: "premium",
      name: "Premium",
      price: 49,
      quality: "4K + HDR",
      screens: 4,
    },
  ];

  const selectedPlan =
    plans.find((p) => p.id === currentPlan) || null;

  // =====================================================
  // LOAD CURRENT SUBSCRIPTION FROM POSTGRESQL
  // =====================================================

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const firebaseUser = auth.currentUser;

        if (!firebaseUser) {
          setLoadingSubscription(false);
          return;
        }

        const response = await fetch(
          `${API_BASE}/api/users/${firebaseUser.uid}/subscription`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Subscription fetch failed:",
            data
          );
          return;
        }

        if (data.subscribed && data.subscription) {
          setCurrentPlan(data.subscription.plan);

          console.log(
            "✅ Active subscription:",
            data.subscription
          );
        } else {
          setCurrentPlan(null);

          console.log(
            "ℹ️ No active subscription"
          );
        }
      } catch (error) {
        console.error(
          "Subscription loading error:",
          error
        );
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadSubscription();
  }, []);

  // =====================================================
  // LOAD RAZORPAY SCRIPT
  // =====================================================

  async function ensureRazorpay() {
    if (window.Razorpay) {
      return;
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = resolve;

      script.onerror = () =>
        reject(
          new Error(
            "Razorpay checkout.js load failed"
          )
        );

      document.body.appendChild(script);
    });
  }

  // =====================================================
  // HANDLE PAYMENT
  // =====================================================

  const handlePayment = async (amount, planId) => {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        alert("Please login first.");
        return;
      }

      const plan = plans.find(
        (p) => p.id === planId
      );

      if (!plan) {
        alert("Invalid plan selected.");
        return;
      }

      console.log(
        "💳 Starting payment for:",
        plan.name
      );

      // -------------------------------------------------
      // STEP 1: CREATE RAZORPAY ORDER
      // -------------------------------------------------

      const orderResponse = await fetch(
        `${API_BASE}/api/create-order`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            amount,
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            name:
              firebaseUser.displayName ||
              firebaseUser.email,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        console.error(
          "Order creation failed:",
          orderData
        );

        alert(
          "Order create nahi hua: " +
            (orderData.error || "Unknown error")
        );

        return;
      }

      const {
        orderId,
        amount: paise,
        currency,
        keyId,
      } = orderData;

      if (!orderId) {
        alert("Razorpay order create nahi hua.");
        return;
      }

      console.log(
        "✅ Razorpay order created:",
        orderId
      );

      // -------------------------------------------------
      // STEP 2: LOAD RAZORPAY
      // -------------------------------------------------

      await ensureRazorpay();

      // -------------------------------------------------
      // STEP 3: RAZORPAY CHECKOUT
      // -------------------------------------------------

      const options = {
        key: keyId,

        order_id: orderId,

        amount: paise,

        currency,

        name: "SAWANTFLIX",

        description:
          `${plan.name} Subscription`,

        method: {
          upi: true,
        },

        prefill: {
          name:
            firebaseUser.displayName ||
            "Sawantflix User",

          email:
            firebaseUser.email ||
            "user@example.com",

          contact: "9999999999",
        },

        theme: {
          color: "#E50914",
        },

        // -------------------------------------------------
        // PAYMENT SUCCESS
        // -------------------------------------------------

        handler: async (response) => {
          try {
            console.log(
              "💰 Razorpay payment response:",
              response
            );

            // -------------------------------------------------
            // STEP 4: VERIFY PAYMENT ON BACKEND
            // -------------------------------------------------

            const verifyResponse =
              await fetch(
                `${API_BASE}/api/verify-payment`,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,

                    firebaseUid:
                      firebaseUser.uid,

                    plan: planId,

                    amount,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            console.log(
              "🔐 Payment verification:",
              verifyData
            );

            if (
              !verifyResponse.ok ||
              !verifyData.verified
            ) {
              alert(
                "Payment verification failed."
              );

              return;
            }

            // -------------------------------------------------
            // STEP 5: UPDATE UI
            // -------------------------------------------------

            setCurrentPlan(planId);

            setBillingHistory((prev) => [
              {
                id:
                  response.razorpay_payment_id,

                date:
                  new Date()
                    .toISOString()
                    .slice(0, 10),

                amount: `₹${amount}`,

                method: "UPI",

                status: "Success",
              },

              ...prev,
            ]);

            alert(
              `Payment Successful!\n\n` +
                `Plan: ${plan.name}\n` +
                `Amount: ₹${amount}\n` +
                `Payment ID: ${response.razorpay_payment_id}`
            );

            console.log(
              "✅ Subscription saved in PostgreSQL"
            );
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            alert(
              "Payment successful hua ho sakta hai, " +
                "lekin verification mein problem aayi."
            );
          }
        },
      };

      // -------------------------------------------------
      // CREATE RAZORPAY INSTANCE
      // -------------------------------------------------

      const razorpay =
        new window.Razorpay(options);

      // -------------------------------------------------
      // PAYMENT FAILED
      // -------------------------------------------------

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "❌ Razorpay payment failed:",
            response
          );

          setBillingHistory((prev) => [
            {
              id:
                response?.error?.metadata
                  ?.payment_id ||
                `txn_${Date.now()}`,

              date:
                new Date()
                  .toISOString()
                  .slice(0, 10),

              amount: `₹${amount}`,

              method: "UPI",

              status: "Failed",
            },

            ...prev,
          ]);

          alert(
            "Payment Failed:\n" +
              (
                response?.error?.description ||
                "Unknown payment error"
              )
          );
        }
      );

      // -------------------------------------------------
      // OPEN RAZORPAY
      // -------------------------------------------------

      razorpay.open();
    } catch (error) {
      console.error(
        "Payment initialization error:",
        error
      );

      alert(
        "Payment start nahi ho paya. Console check karo."
      );
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`min-h-screen flex items-center justify-center pt-20 px-4 transition-colors duration-300 ${
        isLight
          ? "bg-white text-black"
          : "bg-black text-white"
      }`}
    >
      <div
        className={`w-full max-w-5xl rounded-2xl shadow-xl p-8 transition-colors duration-300 ${
          isLight
            ? "bg-gray-100"
            : "bg-zinc-900"
        }`}
      >
        <h1 className="text-3xl font-bold mb-2">
          Manage Subscription & Payment
        </h1>

        <p
          className={`${
            isLight
              ? "text-gray-600"
              : "text-gray-400"
          } mb-8`}
        >
          Update your payment method, view
          billing history, and manage your
          SAWANTFLIX plan.
        </p>

        {/* CURRENT PLAN */}

        {!loadingSubscription &&
          selectedPlan && (
            <div className="mb-8 p-5 rounded-xl border border-green-600 bg-green-900/20">
              <p className="text-green-400 font-semibold">
                ✓ Active Subscription
              </p>

              <p className="text-lg font-bold mt-1">
                {selectedPlan.name}
              </p>

              <p className="text-sm text-gray-400">
                ₹{selectedPlan.price} / month
              </p>
            </div>
          )}

        {/* PLANS */}

        <h2 className="text-xl font-semibold mb-4">
          Available Plans
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() =>
                setCurrentPlan(plan.id)
              }
              className={`p-5 rounded-xl border cursor-pointer transition ${
                currentPlan === plan.id
                  ? "border-red-600 bg-red-600/10 shadow-lg"
                  : isLight
                  ? "border-gray-300 bg-white"
                  : "border-zinc-700 bg-zinc-800"
              }`}
            >
              <h3 className="text-lg font-bold mb-2">
                {plan.name}
              </h3>

              <p
                className={
                  isLight
                    ? "text-gray-700"
                    : "text-gray-300"
                }
              >
                ₹{plan.price} / month
              </p>

              <p
                className={`${
                  isLight
                    ? "text-gray-600"
                    : "text-gray-400"
                } text-sm`}
              >
                Quality: {plan.quality}
              </p>

              <p
                className={`${
                  isLight
                    ? "text-gray-600"
                    : "text-gray-400"
                } text-sm mb-4`}
              >
                Screens: {plan.screens}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  if (
                    currentPlan === plan.id
                  ) {
                    return;
                  }

                  handlePayment(
                    plan.price,
                    plan.id
                  );
                }}
                className={`w-full px-3 py-2 rounded-lg transition ${
                  currentPlan === plan.id
                    ? "bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {currentPlan === plan.id
                  ? "Current Plan"
                  : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        {/* ACTIONS */}

        <div className="space-y-4">
          <button
            onClick={() =>
              selectedPlan &&
              handlePayment(
                selectedPlan.price,
                selectedPlan.id
              )
            }
            disabled={!selectedPlan}
            className={`w-full px-4 py-3 rounded-xl font-medium transition ${
              isLight
                ? "bg-gray-200 hover:bg-gray-300 text-black"
                : "bg-zinc-700 hover:bg-zinc-600 text-white"
            } ${
              !selectedPlan
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >
            🪙 Pay via UPI (Test) —{" "}
            {selectedPlan
              ? `Pay ₹${selectedPlan.price}`
              : "Select a plan"}
          </button>

          <button
            onClick={() =>
              setShowHistory(true)
            }
            className={`w-full px-4 py-3 rounded-xl font-medium transition ${
              isLight
                ? "bg-gray-200 hover:bg-gray-300 text-black"
                : "bg-zinc-700 hover:bg-zinc-600 text-white"
            }`}
          >
            📄 View Billing History
          </button>
        </div>
      </div>

      {/* BILLING HISTORY MODAL */}

      <AnimatePresence>
        {showHistory && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative ${
                isLight
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-white"
              }`}
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
            >
              <h2 className="text-2xl font-bold mb-4">
                Billing History
              </h2>

              {billingHistory.length ===
              0 ? (
                <div
                  className={`${
                    isLight
                      ? "text-gray-600"
                      : "text-gray-400"
                  } p-4`}
                >
                  No transactions yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={
                          isLight
                            ? "border-b border-gray-300"
                            : "border-b border-zinc-700"
                        }
                      >
                        <th className="p-3">
                          Transaction ID
                        </th>

                        <th className="p-3">
                          Date
                        </th>

                        <th className="p-3">
                          Amount
                        </th>

                        <th className="p-3">
                          Method
                        </th>

                        <th className="p-3">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {billingHistory.map(
                        (txn) => (
                          <tr
                            key={txn.id}
                            className={
                              isLight
                                ? "border-b border-gray-200"
                                : "border-b border-zinc-800"
                            }
                          >
                            <td className="p-3 text-sm">
                              {txn.id}
                            </td>

                            <td className="p-3">
                              {txn.date}
                            </td>

                            <td className="p-3">
                              {txn.amount}
                            </td>

                            <td className="p-3">
                              {txn.method}
                            </td>

                            <td
                              className={`p-3 font-medium ${
                                txn.status ===
                                "Success"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {txn.status}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={() =>
                  setShowHistory(false)
                }
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