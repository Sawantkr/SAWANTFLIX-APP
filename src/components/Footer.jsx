import React from 'react'
export default function Footer(){
  return (
    <footer className="mt-12 py-10 bg-gray-900 text-gray-300">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-6">
        <div><p>Help Center</p><p>Account</p><p>Media Center</p></div>
        <div><p>Jobs</p><p>Ways to Watch</p><p>Terms of Use</p></div>
        <div><p>Cookie Preferences</p><p>Corporate Info</p><p>Contact Us</p></div>
        <div><p>Social</p></div>
      </div>
      <p className="text-center mt-6">© 2025 SAWANTFLIX</p>
    </footer>
  )
}
