import React, { useState } from "react"
import { auth, googleProvider } from "../firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth"
import PhoneAuth from "./PhoneAuth"

export default function AuthModal({ open, initialMode = "signin", onClose }) {
  const [mode, setMode] = useState(initialMode) // signin | signup | phone
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const resetFields = () => {
    setEmail("")
    setPassword("")
    setName("")
    setError("")
  }

  // 🔹 Email/Password Submit
  const submit = async () => {
    try {
      setLoading(true)
      setError("")

      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password)
        onClose() // ✅ signin ke baad app khul jaaye
      } else if (mode === "signup") {
        const userCred = await createUserWithEmailAndPassword(auth, email, password)
        if (name) {
          await updateProfile(userCred.user, { displayName: name })
        }

        // ✅ Account ban gaya, abhi signin nahi karna
        await signOut(auth)  
        alert("✅ Account created! Please Sign In.")

        setMode("signin") // signin page dikha do
      }

      resetFields()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Google Auth
  const google = async () => {
    try {
      setLoading(true)
      setError("")
      googleProvider.setCustomParameters({ prompt: "select_account" })
      const result = await signInWithPopup(auth, googleProvider)

      if (!result.user.displayName) {
        await updateProfile(result.user, {
          displayName: result.user.email.split("@")[0],
        })
      }

      resetFields()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Forgot Password
  const forgotPassword = async () => {
    if (!email) {
      setError("Enter your email to reset password")
      return
    }
    try {
      setLoading(true)
      setError("")
      await sendPasswordResetEmail(auth, email)
      alert("📩 Reset link sent! Check your email.")
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Background */}
      <div className="absolute inset-0">
        <img src="/logo.jpeg" alt="bg" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Modal Box */}
      <div className="relative flex flex-col items-center justify-center h-full px-4">
        <div className="bg-black/80 p-10 rounded-lg w-full max-w-md text-white shadow-xl">
          
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-wide">
              <span className="text-[#e50914]">SAWANT</span>
              <span className="text-white">FLIX</span>
            </h1>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold text-center mb-6">
            {mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create your account"
              : "Phone Login"}
          </h1>

          {/* Error */}
          {error && (
            <p className="bg-red-600/80 text-white text-sm p-2 mb-4 rounded">
              {error}
            </p>
          )}

          {/* Phone Auth Mode */}
          {mode === "phone" ? (
            <PhoneAuth onClose={onClose} />
          ) : (
            <>
              {/* Full Name (only for signup) */}
              {mode === "signup" && (
                <input
                  className="w-full p-3 mb-4 rounded bg-[#333] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              {/* Email */}
              <input
                className="w-full p-3 mb-4 rounded bg-[#333] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Password */}
              <input
                type="password"
                className="w-full p-3 mb-2 rounded bg-[#333] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Forgot Password */}
              {mode === "signin" && (
                <p
                  className="text-sm text-gray-400 hover:underline cursor-pointer mb-4"
                  onClick={forgotPassword}
                >
                  Forgot your password?
                </p>
              )}

              {/* CTA Button */}
              <button
                className="w-full py-3 mb-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition disabled:opacity-50"
                onClick={submit}
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : mode === "signin"
                  ? "Sign In"
                  : "Sign Up"}
              </button>

              {/* Google Login */}
              <button
                className="w-full py-3 border border-gray-500 hover:bg-gray-800 rounded font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={google}
                disabled={loading}
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continue with Google
              </button>

              {/* Phone Login */}
              <button
                className="w-full py-3 border border-gray-500 hover:bg-gray-800 rounded font-semibold transition mt-2"
                onClick={() => setMode("phone")}
              >
                Continue with Phone
              </button>

              {/* Switch Mode */}
              {mode === "signin" ? (
                <p className="mt-6 text-gray-400 text-sm text-center">
                  New to Sawantflix?{" "}
                  <span
                    className="text-white font-medium cursor-pointer hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Sign up now
                  </span>
                </p>
              ) : mode === "signup" ? (
                <p className="mt-6 text-gray-400 text-sm text-center">
                  Already have an account?{" "}
                  <span
                    className="text-white font-medium cursor-pointer hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </span>
                </p>
              ) : (
                <p
                  className="mt-6 text-gray-400 text-sm text-center cursor-pointer hover:underline"
                  onClick={() => setMode("signin")}
                >
                  Back to Email Login
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
