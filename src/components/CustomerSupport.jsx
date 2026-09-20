import React, { useState } from "react"
import { auth } from "../firebase"

const SUPPORT_API_URL =
  import.meta.env.VITE_SUPPORT_API_URL ||
  "http://127.0.0.1:8000"

export default function CustomerSupport({ user }) {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const [threadId] = useState(
    () => `customer-${crypto.randomUUID()}`
  )

  const sendMessage = async () => {
    if (!message.trim() || loading) {
      return
    }

    if (!auth.currentUser) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Please sign in to use customer support.",
        },
      ])

      return
    }

    const customerMessage = message.trim()

    setMessage("")

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: customerMessage,
      },
    ])

    try {
      setLoading(true)

      // Get Firebase ID token from the
      // currently authenticated Firebase user.
      const firebaseToken =
        await auth.currentUser.getIdToken()

      const response = await fetch(
        `${SUPPORT_API_URL}/support`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseToken}`,
          },

          body: JSON.stringify({
            thread_id: threadId,
            message: customerMessage,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Customer support request failed."
        )
      }

      if (data.status === "completed") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.response ||
              "I could not generate a response.",
          },
        ])
      } else if (
        data.status === "human_review_required"
      ) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Your request has been forwarded for human support review.",
          },
        ])
      }

    } catch (error) {
      console.error(
        "Customer support error:",
        error
      )

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I could not connect to customer support right now.",
        },
      ])

    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">

      <div className="max-w-4xl mx-auto">

        {/* Header */}

        <div className="text-center mb-8">

          <h1 className="text-4xl font-bold">

            <span className="text-[#e50914]">
              SAWANT
            </span>

            <span className="text-white">
              FLIX
            </span>

            <span className="ml-3">
              Support
            </span>

          </h1>

          <p className="text-gray-400 mt-3">
            AI-powered customer support for your Sawantflix account
          </p>

        </div>


        {/* Customer Information */}

        <div className="bg-[#181818] border border-gray-800 rounded-xl p-4 mb-6">

          <p className="text-sm text-gray-400">
            Signed in as
          </p>

          <p className="font-semibold mt-1">
            {user?.displayName ||
              user?.email ||
              "Sawantflix Customer"}
          </p>

        </div>


        {/* Chat */}

        <div className="bg-[#181818] border border-gray-800 rounded-xl min-h-[500px] flex flex-col">

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">

            {messages.length === 0 && (

              <div className="text-center text-gray-500 py-20">

                <div className="text-5xl mb-4">
                  🎧
                </div>

                <h2 className="text-xl text-white font-semibold">
                  How can we help you?
                </h2>

                <p className="mt-2">
                  Ask about your subscription,
                  payments, account, or technical issues.
                </p>

              </div>

            )}


            {messages.map(
              (item, index) => (

                <div
                  key={index}
                  className={
                    item.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >

                  <div
                    className={
                      item.role === "user"
                        ? "max-w-[75%] bg-[#e50914] rounded-2xl px-4 py-3"
                        : "max-w-[75%] bg-[#303030] rounded-2xl px-4 py-3"
                    }
                  >

                    {item.content}

                  </div>

                </div>

              )
            )}


            {loading && (

              <div className="flex justify-start">

                <div className="bg-[#303030] rounded-2xl px-4 py-3 text-gray-400">

                  AI is checking your request...

                </div>

              </div>

            )}

          </div>


          {/* Input */}

          <div className="border-t border-gray-800 p-4">

            <div className="flex gap-3">

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask about your account, subscription, payment..."
                rows={2}
                className="flex-1 resize-none bg-[#303030] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
              />

              <button
                onClick={sendMessage}
                disabled={
                  loading ||
                  !message.trim()
                }
                className="self-end px-6 py-3 bg-[#e50914] hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "..."
                  : "Send"}
              </button>

            </div>

            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send • Shift + Enter for a new line
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}