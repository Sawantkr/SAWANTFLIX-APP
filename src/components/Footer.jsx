import React from "react";

export default function Footer() {
  return (
    <footer className="mt-12 py-10 bg-black text-gray-400 text-sm">
      <div className="container">
        {/* Top: Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          <div className="flex flex-col space-y-3">
            <a href="#" className="hover:underline">FAQ</a>
            <a href="#" className="hover:underline">Investor Relations</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Speed Test</a>
          </div>
          <div className="flex flex-col space-y-3">
            <a href="#" className="hover:underline">Help Center</a>
            <a href="#" className="hover:underline">Jobs</a>
            <a href="#" className="hover:underline">Cookie Preferences</a>
            <a href="#" className="hover:underline">Legal Notices</a>
          </div>
          <div className="flex flex-col space-y-3">
            <a href="#" className="hover:underline">Account</a>
            <a href="#" className="hover:underline">Ways to Watch</a>
            <a href="#" className="hover:underline">Corporate Information</a>
            <a href="#" className="hover:underline">Only on SawantFlix</a>
          </div>
          <div className="flex flex-col space-y-3">
            <a href="#" className="hover:underline">Media Center</a>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Contact Us</a>
          </div>
        </div>

       

        {/* Branding */}
        <p className="text-center mt-6 text-gray-500 text-xs">
          © 2025 SAWANTFLIX
        </p>
      </div>
    </footer>
  );
}
