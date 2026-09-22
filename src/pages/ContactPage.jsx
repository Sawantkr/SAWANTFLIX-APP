import React from "react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Contact Us
        </h1>

        <p className="text-gray-300 leading-7 mb-8">
          If you have any questions, payment-related concerns,
          account issues, subscription questions or require
          customer support, please contact the SawantFlix support team.
        </p>

        <div className="bg-gray-900 rounded-lg p-6 space-y-6">

          <div>
            <h2 className="text-xl font-semibold text-white">
              Customer Support
            </h2>

            <p className="text-gray-400 mt-2">
              Our customer support team can help with account,
              subscription, payment and refund-related questions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Email
            </h2>

            <p className="text-gray-400 mt-2">
              sawantkumarsawant7209@gmail.com
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Support Hours
            </h2>

            <p className="text-gray-400 mt-2">
              Monday to Friday
            </p>

            <p className="text-gray-400">
              10:00 AM – 6:00 PM IST
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Payment & Refund Support
            </h2>

            <p className="text-gray-400 mt-2">
              For payment, subscription or refund-related queries,
              please provide your transaction details when contacting
              our support team.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}