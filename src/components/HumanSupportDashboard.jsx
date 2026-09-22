import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

const API_URL = "https://sawantflix-app-1.onrender.com";

function HumanSupportDashboard() {
  const auth = getAuth();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  const [refunds, setRefunds] = useState([]);

  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  const [sendingReply, setSendingReply] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [processingRefundId, setProcessingRefundId] =
    useState(null);

  // =====================================================
  // FIREBASE AUTH
  // =====================================================

  const getFirebaseToken = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error(
        "You must be logged in to access support admin."
      );
    }

    const token = await currentUser.getIdToken();

    if (!token) {
      throw new Error(
        "Unable to get Firebase authentication token."
      );
    }

    return token;
  };

  const getHeaders = async (includeJson = false) => {
    const token = await getFirebaseToken();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  };

  // =====================================================
  // COMMON RESPONSE HANDLER
  // =====================================================

  const handleResponse = async (response) => {
    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Authentication failed. Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Access denied. Support admin only."
        );
      }

      throw new Error(
        data.error ||
          data.message ||
          "Request failed"
      );
    }

    return data;
  };

  // =====================================================
  // GET SUPPORT TICKETS
  // =====================================================

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);

      const headers = await getHeaders();

      const response = await fetch(
        `${API_URL}/api/support/tickets`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await handleResponse(response);

      if (data.ok) {
        setTickets(data.tickets || []);
      } else {
        throw new Error(
          data.error || "Failed to fetch tickets"
        );
      }
    } catch (error) {
      console.error(
        "❌ Failed to fetch tickets:",
        error
      );

      setTickets([]);

      if (
        error.message?.includes("Access denied") ||
        error.message?.includes("Authentication failed")
      ) {
        alert(error.message);
      }
    } finally {
      setLoadingTickets(false);
    }
  };

  // =====================================================
  // GET TICKET MESSAGES
  // =====================================================

  const fetchMessages = async (ticketId) => {
    try {
      setLoadingMessages(true);

      const headers = await getHeaders();

      const response = await fetch(
        `${API_URL}/api/support/tickets/${ticketId}/messages`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await handleResponse(response);

      if (data.ok) {
        setMessages(data.messages || []);
      } else {
        throw new Error(
          data.error || "Failed to fetch messages"
        );
      }
    } catch (error) {
      console.error(
        "❌ Failed to fetch messages:",
        error
      );

      setMessages([]);

      alert(
        error.message ||
          "Failed to fetch messages"
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  // =====================================================
  // SELECT TICKET
  // =====================================================

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setMessages([]);
    setReply("");

    await fetchMessages(ticket.id);
  };

  // =====================================================
  // SEND HUMAN AGENT REPLY
  // =====================================================

  const sendReply = async () => {
    if (!selectedTicket) {
      alert("Please select a ticket.");
      return;
    }

    if (!reply.trim()) {
      return;
    }

    try {
      setSendingReply(true);

      const headers = await getHeaders(true);

      const response = await fetch(
        `${API_URL}/api/support/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: reply.trim(),
          }),
        }
      );

      const data = await handleResponse(response);

      if (!data.ok) {
        throw new Error(
          data.error || "Failed to send reply"
        );
      }

      setReply("");

      await fetchMessages(selectedTicket.id);
      await fetchTickets();

      setSelectedTicket((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          status: "in_progress",
        };
      });
    } catch (error) {
      console.error(
        "❌ Send reply error:",
        error
      );

      alert(
        error.message ||
          "Failed to send reply"
      );
    } finally {
      setSendingReply(false);
    }
  };

  // =====================================================
  // RESOLVE TICKET
  // =====================================================

  const resolveTicket = async () => {
    if (!selectedTicket) {
      return;
    }

    try {
      setResolving(true);

      const headers = await getHeaders(true);

      const response = await fetch(
        `${API_URL}/api/support/tickets/${selectedTicket.id}/status`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            status: "resolved",
          }),
        }
      );

      const data = await handleResponse(response);

      if (!data.ok) {
        throw new Error(
          data.error ||
            "Failed to resolve ticket"
        );
      }

      setSelectedTicket(
        data.ticket || {
          ...selectedTicket,
          status: "resolved",
        }
      );

      await fetchTickets();
    } catch (error) {
      console.error(
        "❌ Resolve ticket error:",
        error
      );

      alert(
        error.message ||
          "Failed to resolve ticket"
      );
    } finally {
      setResolving(false);
    }
  };

  // =====================================================
  // GET REFUNDS
  // =====================================================

  const fetchRefunds = async () => {
    try {
      setLoadingRefunds(true);

      const headers = await getHeaders();

      const response = await fetch(
        `${API_URL}/api/support/refunds`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await handleResponse(response);

      if (data.ok) {
        setRefunds(data.refunds || []);
      } else {
        throw new Error(
          data.error || "Failed to fetch refunds"
        );
      }
    } catch (error) {
      console.error(
        "❌ Failed to fetch refunds:",
        error
      );

      setRefunds([]);

      alert(
        error.message ||
          "Failed to fetch refunds"
      );
    } finally {
      setLoadingRefunds(false);
    }
  };

  // =====================================================
  // APPROVE REFUND
  // =====================================================

  const approveRefund = async (refundId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this refund?\n\nThis will create an actual Razorpay refund."
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingRefundId(refundId);

      const headers = await getHeaders(true);

      const response = await fetch(
        `${API_URL}/api/support/refunds/${refundId}/approve`,
        {
          method: "POST",
          headers,
        }
      );

      const data = await handleResponse(response);

      if (!data.ok) {
        throw new Error(
          data.error ||
            "Failed to approve refund"
        );
      }

      alert(
        `Refund processed successfully.\n\nRazorpay Refund ID: ${
          data.razorpay?.refundId ||
          data.razorpay_refund_id ||
          "N/A"
        }`
      );

      await fetchRefunds();
    } catch (error) {
      console.error(
        "❌ Approve refund error:",
        error
      );

      alert(
        error.message ||
          "Failed to approve refund"
      );
    } finally {
      setProcessingRefundId(null);
    }
  };

  // =====================================================
  // REJECT REFUND
  // =====================================================

  const rejectRefund = async (refundId) => {
    const reason = window.prompt(
      "Enter the reason for rejecting this refund:"
    );

    if (reason === null) {
      return;
    }

    const rejectionReason = reason.trim();

    if (!rejectionReason) {
      alert(
        "Please enter a rejection reason."
      );
      return;
    }

    try {
      setProcessingRefundId(refundId);

      const headers = await getHeaders(true);

      const response = await fetch(
        `${API_URL}/api/support/refunds/${refundId}/reject`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            reason: rejectionReason,
          }),
        }
      );

      const data = await handleResponse(response);

      if (!data.ok) {
        throw new Error(
          data.error ||
            "Failed to reject refund"
        );
      }

      alert("Refund request rejected.");

      await fetchRefunds();
    } catch (error) {
      console.error(
        "❌ Reject refund error:",
        error
      );

      alert(
        error.message ||
          "Failed to reject refund"
      );
    } finally {
      setProcessingRefundId(null);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    console.log(
      "Support Admin API URL:",
      API_URL
    );

    console.log(
      "Current Firebase user:",
      auth.currentUser?.email
    );

    const loadDashboard = async () => {
      await Promise.all([
        fetchTickets(),
        fetchRefunds(),
      ]);
    };

    loadDashboard().catch((error) => {
      console.error(
        "Dashboard loading error:",
        error
      );
    });
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <h1 style={{ margin: 0 }}>
        Sawantflix Human Support
      </h1>

      <div
        style={{
          marginTop: "8px",
          color: "#aaa",
          fontSize: "14px",
        }}
      >
        Logged in as:{" "}
        {auth.currentUser?.email ||
          "Unknown user"}
      </div>

      {/* =================================================
          REFUND REQUESTS
          ================================================= */}

      <div
        style={{
          marginTop: "25px",
          background: "#1c1c1c",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h2 style={{ margin: 0 }}>
            Refund Requests
          </h2>

          <button
            onClick={fetchRefunds}
            disabled={loadingRefunds}
            style={{
              padding: "8px 16px",
              cursor: loadingRefunds
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loadingRefunds
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {loadingRefunds ? (
          <p>Loading refund requests...</p>
        ) : refunds.length === 0 ? (
          <p style={{ color: "#aaa" }}>
            No refund requests found.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "15px",
            }}
          >
            {refunds.map((refund) => (
              <div
                key={refund.id}
                style={{
                  background: "#252525",
                  padding: "18px",
                  borderRadius: "8px",
                  border:
                    refund.status ===
                    "requested"
                      ? "1px solid #555"
                      : "1px solid #333",
                }}
              >
                {/* REFUND TOP */}
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      Refund #{refund.id}
                    </strong>

                    <div
                      style={{
                        marginTop: "8px",
                        color: "#ccc",
                      }}
                    >
                      Customer:{" "}
                      {refund.name ||
                        "Customer"}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: "#aaa",
                      }}
                    >
                      Email:{" "}
                      {refund.email ||
                        "N/A"}
                    </div>
                  </div>

                  <div>
                    <div>
                      Amount:{" "}
                      <strong>
                        ₹{refund.amount}
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                      }}
                    >
                      Status:{" "}
                      <strong>
                        {refund.status}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* REASON */}
                <div
                  style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "#111",
                    borderRadius: "6px",
                  }}
                >
                  <strong>
                    Reason:
                  </strong>

                  <div
                    style={{
                      marginTop: "6px",
                      color: "#ccc",
                      whiteSpace: "pre-wrap",
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {refund.reason ||
                      "No reason provided"}
                  </div>
                </div>

                {/* PAYMENT ID */}
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Payment ID:{" "}
                  {refund.razorpay_payment_id ||
                    refund.payment_id ||
                    "N/A"}
                </div>

                {/* RAZORPAY REFUND ID */}
                {(refund.status ===
                  "processed" ||
                  refund.razorpay_refund_id) && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#aaa",
                    }}
                  >
                    Razorpay Refund ID:{" "}
                    {refund.razorpay_refund_id ||
                      "N/A"}
                  </div>
                )}

                {/* ACTION BUTTONS */}
                {refund.status ===
                  "requested" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() =>
                        approveRefund(
                          refund.id
                        )
                      }
                      disabled={
                        processingRefundId ===
                        refund.id
                      }
                      style={{
                        padding:
                          "10px 18px",
                        cursor:
                          processingRefundId ===
                          refund.id
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {processingRefundId ===
                      refund.id
                        ? "Processing..."
                        : "Approve Refund"}
                    </button>

                    <button
                      onClick={() =>
                        rejectRefund(
                          refund.id
                        )
                      }
                      disabled={
                        processingRefundId ===
                        refund.id
                      }
                      style={{
                        padding:
                          "10px 18px",
                        cursor:
                          processingRefundId ===
                          refund.id
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {processingRefundId ===
                      refund.id
                        ? "Processing..."
                        : "Reject Refund"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          SUPPORT AREA
          ================================================= */}

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "25px",
          alignItems: "flex-start",
        }}
      >
        {/* =================================================
            TICKET LIST
            ================================================= */}

        <div
          style={{
            width: "35%",
            background: "#1c1c1c",
            padding: "20px",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              Support Tickets
            </h2>

            <button
              onClick={fetchTickets}
              disabled={loadingTickets}
              style={{
                padding: "7px 12px",
                cursor:
                  loadingTickets
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loadingTickets
                ? "..."
                : "Refresh"}
            </button>
          </div>

          <div
            style={{
              marginTop: "20px",
            }}
          >
            {loadingTickets ? (
              <p>
                Loading tickets...
              </p>
            ) : tickets.length ===
              0 ? (
              <p>
                No support tickets
              </p>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() =>
                    handleSelectTicket(
                      ticket
                    )
                  }
                  style={{
                    padding: "15px",
                    marginBottom:
                      "10px",
                    background:
                      selectedTicket?.id ===
                      ticket.id
                        ? "#333"
                        : "#252525",
                    borderRadius:
                      "8px",
                    cursor:
                      "pointer",
                  }}
                >
                  <strong>
                    #{ticket.id}{" "}
                    {ticket.subject}
                  </strong>

                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "14px",
                      color: "#aaa",
                    }}
                  >
                    {ticket.email}
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                    }}
                  >
                    Status:{" "}
                    <strong>
                      {ticket.status}
                    </strong>
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "13px",
                      color: "#aaa",
                    }}
                  >
                    Category:{" "}
                    {ticket.category}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* =================================================
            TICKET DETAILS
            ================================================= */}

        <div
          style={{
            flex: 1,
            background: "#1c1c1c",
            padding: "20px",
            borderRadius: "10px",
            boxSizing: "border-box",
          }}
        >
          {!selectedTicket ? (
            <div>
              <h2>
                Select a ticket
              </h2>

              <p>
                Customer support
                ticket select karo.
              </p>
            </div>
          ) : (
            <>
              <h2>
                #{selectedTicket.id}{" "}
                {selectedTicket.subject}
              </h2>

              <p>
                Customer:{" "}
                {selectedTicket.name ||
                  "Customer"}
              </p>

              <p>
                Email:{" "}
                {selectedTicket.email}
              </p>

              <p>
                Status:{" "}
                <strong>
                  {selectedTicket.status}
                </strong>
              </p>

              {/* =================================================
                  MESSAGES
                  ================================================= */}

              <div
                style={{
                  marginTop: "20px",
                  height: "350px",
                  overflowY: "auto",
                  background: "#111",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                {loadingMessages ? (
                  <p>
                    Loading messages...
                  </p>
                ) : messages.length ===
                  0 ? (
                  <p>
                    No messages found.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom:
                          "15px",
                        padding: "12px",
                        background:
                          msg.sender_type ===
                          "customer"
                            ? "#292929"
                            : "#333",
                        borderRadius:
                          "8px",
                      }}
                    >
                      <strong>
                        {msg.sender_type ===
                        "customer"
                          ? "Customer"
                          : "Agent"}
                      </strong>

                      <p
                        style={{
                          margin:
                            "8px 0 0",
                          whiteSpace:
                            "pre-wrap",
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* =================================================
                  REPLY
                  ================================================= */}

              {selectedTicket.status !==
                "resolved" && (
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <textarea
                    value={reply}
                    onChange={(e) =>
                      setReply(
                        e.target.value
                      )
                    }
                    placeholder="Type your reply..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background:
                        "#252525",
                      color: "#fff",
                      border:
                        "1px solid #444",
                      borderRadius:
                        "8px",
                      resize: "vertical",
                      boxSizing:
                        "border-box",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={
                        sendReply
                      }
                      disabled={
                        sendingReply ||
                        !reply.trim()
                      }
                      style={{
                        padding:
                          "10px 20px",
                        cursor:
                          sendingReply ||
                          !reply.trim()
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {sendingReply
                        ? "Sending..."
                        : "Send Reply"}
                    </button>

                    <button
                      onClick={
                        resolveTicket
                      }
                      disabled={
                        resolving
                      }
                      style={{
                        padding:
                          "10px 20px",
                        cursor:
                          resolving
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {resolving
                        ? "Resolving..."
                        : "Resolve Ticket"}
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================
                  RESOLVED
                  ================================================= */}

              {selectedTicket.status ===
                "resolved" && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "15px",
                    background:
                      "#252525",
                    borderRadius: "8px",
                  }}
                >
                  ✅ This ticket has
                  been resolved.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HumanSupportDashboard;