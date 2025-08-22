import React, { useState } from "react"
import AuthModal from "../components/AuthModal"

export default function AuthPage() {
  const [mode, setMode] = useState("signin")

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <AuthModal 
        open={true} 
        mode={mode} 
        onClose={() => {}} 
      />

      {/* Switch Signin/Signup */}
      <div className="absolute bottom-10 text-center">
        {mode === "signin" ? (
          <p>
            New here?{" "}
            <button 
              className="text-red-500 underline" 
              onClick={() => setMode("signup")}
            >
              Create Account
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button 
              className="text-red-500 underline" 
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
