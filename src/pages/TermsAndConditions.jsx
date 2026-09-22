import React from "react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Terms & Conditions
        </h1>

        <p className="text-gray-400 mb-8">
          Last updated: September 2026
        </p>

        <section className="space-y-6 text-gray-300 leading-7">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using SawantFlix, users agree to comply with
              these Terms & Conditions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              2. Account
            </h2>
            <p>
              Users are responsible for providing accurate account
              information and maintaining the security of their account.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              3. Subscription and Payment
            </h2>
            <p>
              Certain features or content may require a subscription or
              payment. Applicable pricing will be displayed before
              completing a transaction.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              4. Acceptable Use
            </h2>
            <p>
              Users must not misuse the platform, attempt unauthorized
              access, interfere with platform functionality or use the
              service for unlawful activities.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              5. Service Changes
            </h2>
            <p>
              SawantFlix may modify, update or improve platform features
              from time to time.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              6. Contact
            </h2>
            <p>
              For questions regarding these terms, contact:
              {" "}
              sawantkumarsawant7209@gmail.com
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}