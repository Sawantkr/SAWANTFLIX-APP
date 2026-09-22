import React from "react";

export default function Footer() {
  return (
    <footer className="mt-12 py-10 bg-black text-gray-400 text-sm">
      <div className="container mx-auto px-6">

        {/* Top: Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">

          {/* Company */}
          <div className="flex flex-col space-y-3">

            <a
              href="/about"
              className="hover:underline"
            >
              About Us
            </a>

            <a
              href="/contact"
              className="hover:underline"
            >
              Contact Us
            </a>

            <a
              href="/support"
              className="hover:underline"
            >
              Help Center
            </a>

            <a
              href="/movies"
              className="hover:underline"
            >
              Movies
            </a>

          </div>


          {/* Legal */}
          <div className="flex flex-col space-y-3">

            <a
              href="/privacy-policy"
              className="hover:underline"
            >
              Privacy Policy
            </a>

            <a
              href="/terms-and-conditions"
              className="hover:underline"
            >
              Terms & Conditions
            </a>

            <a
              href="/refund-policy"
              className="hover:underline"
            >
              Refund & Cancellation Policy
            </a>

            <a
              href="/privacy-policy"
              className="hover:underline"
            >
              Cookie Policy
            </a>

          </div>


          {/* Account & Content */}
          <div className="flex flex-col space-y-3">

            <a
              href="/account/payment"
              className="hover:underline"
            >
              Account
            </a>

            <a
              href="/tv"
              className="hover:underline"
            >
              TV Shows
            </a>

            <a
              href="/new"
              className="hover:underline"
            >
              New & Popular
            </a>

            <a
              href="/my-list"
              className="hover:underline"
            >
              My List
            </a>

          </div>


          {/* Information */}
          <div className="flex flex-col space-y-3">

            <a
              href="/contact"
              className="hover:underline"
            >
              Customer Support
            </a>

            <a
              href="/terms-and-conditions"
              className="hover:underline"
            >
              Legal Notices
            </a>

            <a
              href="/about"
              className="hover:underline"
            >
              Company Information
            </a>

            <span className="text-gray-500">
              Only on SawantFlix
            </span>

          </div>

        </div>


        {/* Business Information */}
        <div className="mt-10 pt-6 border-t border-gray-800 text-center">

          <p className="text-gray-400">
            SawantFlix
          </p>

          <p className="mt-2 text-gray-500 text-xs">
            Online movie streaming and entertainment platform.
          </p>

          <p className="mt-2 text-gray-500 text-xs">
            For payment, subscription, refund or account-related
            assistance, please contact our customer support team.
          </p>

          <p className="mt-2 text-gray-500 text-xs">
            Email: sawantkumarsawant7209@gmail.com
          </p>

          <p className="mt-6 text-gray-500 text-xs">
            © 2026 SAWANTFLIX. All rights reserved.
          </p>

        </div>

      </div>
    </footer>
  );
}