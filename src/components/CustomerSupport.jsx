import React, { useState } from "react"
import { auth } from "../firebase"

const SUPPORT_API_URL =
  import.meta.env.VITE_SUPPORT_API_URL ||
  "http://127.0.0.1:8000"

export default function CustomerSupport({ user }) {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // HITL state
  const [humanReviewRequired, setHumanReviewRequired] =
    useState(false)

  const [interruptData, setInterruptData] =
    useState(null)

  const [humanResponse, setHumanResponse] =
    useState("")

  const [resuming, setResuming] = useState(false)

  const [threadId] = useState(
    () => `customer-${crypto.randomUUID()}`
  )

  // ==================================================
  // SEND CUSTOMER MESSAGE
  // ==================================================

  const sendMessage = async () => {
    if (
      !message.trim() ||
      loading ||
      humanReviewRequired
    ) {
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
            firebase_uid: auth.currentUser.uid,
          }),
        }
      )

      const data = await response.json()

      // ==================================================
      // HUMAN REVIEW REQUIRED
      // ==================================================

      if (
        response.ok &&
        data.status === "human_review_required"
      ) {
        setHumanReviewRequired(true)

        setInterruptData(
          data.interrupt_data || null
        )

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Your request requires human support review. Please wait while a human support representative reviews your request.",
          },
        ])

        return
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Customer support request failed."
        )
      }

      // ==================================================
      // NORMAL AI RESPONSE
      // ==================================================

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

  // ==================================================
  // RESUME HITL WORKFLOW
  // ==================================================

  const resumeHumanSupport = async () => {
    if (
      !humanResponse.trim() ||
      resuming
    ) {
      return
    }

    if (!auth.currentUser) {
      return
    }

    try {
      setResuming(true)

      const firebaseToken =
        await auth.currentUser.getIdToken()

      const response = await fetch(
        `${SUPPORT_API_URL}/support/resume`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseToken}`,
          },

          body: JSON.stringify({
            thread_id: threadId,
            human_response:
              humanResponse.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to resume support workflow."
        )
      }

      // ==================================================
      // IF WORKFLOW IS STILL WAITING FOR HUMAN
      // ==================================================

      if (
        data.status ===
        "human_review_required"
      ) {
        setInterruptData(
          data.interrupt_data || null
        )

        return
      }

      // ==================================================
      // WORKFLOW COMPLETED
      // ==================================================

      if (data.status === "completed") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.response ||
              "Your request has been processed by human support.",
          },
        ])

        setHumanResponse("")
        setInterruptData(null)
        setHumanReviewRequired(false)
      }
    } catch (error) {
      console.error(
        "Human support resume error:",
        error
      )

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "We could not resume the human support workflow right now.",
        },
      ])
    } finally {
      setResuming(false)
    }
  }

  // ==================================================
  // ENTER KEY
  // ==================================================

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

        {/* ==================================================
            HEADER
        ================================================== */}

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

        {/* ==================================================
            CUSTOMER INFORMATION
        ================================================== */}

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

        {/* ==================================================
            CHAT
        ================================================== */}

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

            {/* ==================================================
                AI LOADING
            ================================================== */}

            {loading && (

              <div className="flex justify-start">

                <div className="bg-[#303030] rounded-2xl px-4 py-3 text-gray-400">

                  AI is checking your request...

                </div>

              </div>

            )}

            {/* ==================================================
                HUMAN REVIEW PANEL
            ================================================== */}

            {humanReviewRequired && (

              <div className="mt-6 border border-orange-500/50 bg-orange-500/10 rounded-xl p-5">

                <div className="flex items-center gap-3 mb-4">

                  <div className="text-2xl">
                    🟠
                  </div>

                  <div>

                    <h3 className="text-lg font-semibold text-orange-400">
                      Human Support Required
                    </h3>

                    <p className="text-sm text-gray-400">
                      Your request has been escalated for human review.
                    </p>

                  </div>

                </div>

                {/* HITL Details */}

                {interruptData && (

                  <div className="bg-black/30 rounded-lg p-4 mb-4 space-y-2">

                    <div>

                      <p className="text-xs text-gray-500">
                        Customer Message
                      </p>

                      <p className="text-sm text-gray-200">
                        {interruptData.customer_message ||
                          "Not available"}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-gray-500">
                        Intent
                      </p>

                      <p className="text-sm text-gray-200">
                        {interruptData.intent ||
                          "Unknown"}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-gray-500">
                        Escalation Reason
                      </p>

                      <p className="text-sm text-gray-200">
                        {interruptData.escalation_reason ||
                          "Human review required"}
                      </p>

                    </div>

                    {interruptData.diagnostic_result && (

                      <div>

                        <p className="text-xs text-gray-500">
                          Diagnostic Result
                        </p>

                        <p className="text-sm text-gray-200">
                          {interruptData.diagnostic_result}
                        </p>

                      </div>

                    )}

                  </div>

                )}

                {/* Human Response */}

                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Human Support Response
                </label>

                <textarea
                  value={humanResponse}
                  onChange={(event) =>
                    setHumanResponse(
                      event.target.value
                    )
                  }
                  placeholder="Enter the response from human support..."
                  rows={4}
                  disabled={resuming}
                  className="w-full resize-none bg-[#181818] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <button
                  onClick={resumeHumanSupport}
                  disabled={
                    resuming ||
                    !humanResponse.trim()
                  }
                  className="mt-3 w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resuming
                    ? "Resuming..."
                    : "Resume Workflow"}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  The customer conversation will continue after human support responds.
                </p>

              </div>

            )}

          </div>

          {/* ==================================================
              CUSTOMER INPUT
          ================================================== */}

          <div className="border-t border-gray-800 p-4">

            {humanReviewRequired && (

              <div className="mb-3 text-center">

                <p className="text-sm text-orange-400">
                  🟠 Human support is currently reviewing your request.
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Please wait for the human support response before sending another message.
                </p>

              </div>

            )}

            <div className="flex gap-3">

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={
                  loading ||
                  humanReviewRequired
                }
                placeholder={
                  humanReviewRequired
                    ? "Waiting for human support..."
                    : "Ask about your account, subscription, payment..."
                }
                rows={2}
                className="flex-1 resize-none bg-[#303030] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <button
                onClick={sendMessage}
                disabled={
                  loading ||
                  humanReviewRequired ||
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
              {humanReviewRequired
                ? "Human support review is in progress."
                : "Press Enter to send • Shift + Enter for a new line"}
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}