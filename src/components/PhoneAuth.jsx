import React, { useState } from "react"
import { auth } from "../firebase"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"

export default function PhoneAuth({ onClose }) {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 🔹 Recaptcha setup
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container", // id of div
        {
          size: "invisible", // invisible so user won’t see
          callback: () => console.log("Recaptcha resolved ✅"),
        },
        auth
      )
    }
  }

  // 🔹 Send OTP
  const sendOtp = async () => {
    try {
      setLoading(true)
      setError("")
      setupRecaptcha()

      const appVerifier = window.recaptchaVerifier
      const result = await signInWithPhoneNumber(auth, phone, appVerifier)

      setConfirmationResult(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Verify OTP
  const verifyOtp = async () => {
    try {
      setLoading(true)
      setError("")
      await confirmationResult.confirm(otp)
      onClose()
    } catch (e) {
      setError("Invalid OTP, please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="bg-red-600/80 text-white text-sm p-2 mb-4 rounded">{error}</p>}

      {!confirmationResult ? (
        <>
          <input
            className="w-full p-3 mb-4 rounded bg-[#333] text-white placeholder-gray-400"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold transition disabled:opacity-50"
            onClick={sendOtp}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          {/* 👇 Recaptcha Container (Firebase needs this) */}
          <div id="recaptcha-container"></div>
        </>
      ) : (
        <>
          <input
            className="w-full p-3 mb-4 rounded bg-[#333] text-white placeholder-gray-400"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-semibold transition disabled:opacity-50"
            onClick={verifyOtp}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}
    </div>
  )
}
