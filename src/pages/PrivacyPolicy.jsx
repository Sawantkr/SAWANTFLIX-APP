import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Privacy Policy
        </h1>

        <p className="text-gray-400 mb-8">
          Last updated: September 2026
        </p>

        <section className="space-y-6 text-gray-300 leading-7">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              1. Information We Collect
            </h2>
            <p>
              SawantFlix may collect information provided by users during
              account registration, authentication, subscription and
              customer support interactions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              2. How We Use Information
            </h2>
            <p>
              Information may be used to provide account services,
              process subscriptions and payments, provide customer
              support and improve the platform.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              3. Payment Information
            </h2>
            <p>
              Payment processing is handled through the payment service
              provider integrated with the platform. SawantFlix does not
              intentionally store users' complete card or banking
              credentials.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              4. Account Information
            </h2>
            <p>
              Users are responsible for keeping their account credentials
              secure and should contact support if they believe their
              account has been accessed without authorization.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              5. Data Security
            </h2>
            <p>
              We take reasonable technical measures to protect user
              information and maintain the security of the platform.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              6. Contact
            </h2>
            <p>
              For privacy-related questions, contact:
              {" "}
              sawantkumarsawant7209@gmail.com
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}