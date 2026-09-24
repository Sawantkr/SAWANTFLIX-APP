<div align="center">

# 🎬 SAWANTFLIX

### A Full-Stack Netflix-Style Streaming Platform

<p>
  <a href="https://sawantflix-app-1.onrender.com">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Sawantflix-00C853?style=for-the-badge" />
  </a>
  <a href="https://github.com/Sawantkr/SAWANTFLIX-APP">
    <img src="https://img.shields.io/badge/💻%20Source%20Code-GitHub-181717?style=for-the-badge&logo=github" />
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-Payments-528FF0?style=flat-square" />
</p>

<p>
  A full-stack streaming-style web application featuring movie discovery,
  authentication, subscriptions, Razorpay payments, refunds,
  and AI-powered customer support with human escalation.
</p>

</div>

---

## ✨ What is Sawantflix?

**Sawantflix** is a full-stack streaming-style web application inspired by modern OTT platforms.

The project combines a responsive React frontend with an Express.js backend, Firebase Authentication, TMDB movie data, Razorpay payment processing, PostgreSQL data storage, and an integrated Agentic AI customer-support system.

The application demonstrates how multiple services can work together to create a complete end-to-end web application.

### 🚀 Live Demo

👉 **https://sawantflix-app-1.onrender.com**

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| 🎬 Movie Discovery | Trending, Top Rated, Upcoming and Search |
| 🔐 Authentication | Email/Password, Google OAuth and Phone OTP |
| 🌍 Multi-language UI | English and Hindi support |
| 🌓 Theme | Light/Dark mode |
| 🎞️ Trailers | YouTube trailer playback |
| 🔎 Search | Movie search with TMDB |
| 💳 Payments | Razorpay subscription checkout |
| 💰 Refunds | Customer refund request and human approval workflow |
| 🤖 AI Support | AI-powered customer support |
| 👨‍💻 Human Support | Human agent escalation and ticket handling |
| 🗄️ Database | PostgreSQL-backed application records |
| 📱 Responsive UI | Responsive React interface |
| 🚀 Deployment | Production deployment using Render |

---
## 🏗️ System Architecture

Sawantflix follows a full-stack architecture where the React frontend
communicates with the Express backend for application, payment,
database and customer-support operations.

Customer-support requests are forwarded to the Agentic AI service,
which uses FastAPI and LangGraph to classify the user's intent and
route the request to specialized workflows such as Billing,
Technical, or Account.

The AI system can use RAG and the knowledge base to generate
context-aware responses. When an issue requires human intervention,
the workflow escalates the request to the Human Support Dashboard,
where an agent can reply, investigate the issue, approve/reject
refunds, and resolve the ticket.


                                                  ┌──────────────────────────────┐
                         │          SAWANTFLIX          │
                         │        React Frontend       │
                         │                              │
                         │  • Movie Discovery           │
                         │  • Search & Details           │
                         │  • Authentication            │
                         │  • Subscription               │
                         │  • Customer Support           │
                         └──────────────┬───────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
      ┌───────────────┐         ┌───────────────┐       ┌────────────────┐
      │ Firebase Auth │         │    TMDB API   │       │  Express API   │
      │               │         │               │       │ Node.js Server │
      │ • Email       │         │ • Movies      │       └───────┬────────┘
      │ • Google      │         │ • Search      │               │
      │ • Phone OTP   │         │ • Trailers    │       ┌───────┼──────────┐
      └───────┬───────┘         └───────────────┘       │       │          │
              │                                         ▼       ▼          ▼
              ▼                                    ┌────────┐ ┌────────┐ ┌──────────────┐
       Authenticated User                          │Razorpay│ │Postgres│ │Support APIs │
                                                   │        │ │        │ │              │
                                                   │Payment │ │Database│ │Tickets      │
                                                   │Refund  │ │        │ │Customer     │
                                                   └────────┘ └────────┘ │Support      │
                                                                        └──────┬───────┘
                                                                               │
                                                                               │
                                                                               ▼
                         ┌────────────────────────────────────────────────────────────┐
                         │                  AGENTIC AI SUPPORT                        │
                         │                       FastAPI                              │
                         └────────────────────────────┬───────────────────────────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │    LangGraph    │
                                             │ Workflow Engine │
                                             └────────┬────────┘
                                                      │
                                                      ▼
                                          ┌──────────────────────┐
                                          │ Intent Classification │
                                          └──────────┬───────────┘
                                                     │
                       ┌─────────────────────────────┼─────────────────────────────┐
                       │                             │                             │
                       ▼                             ▼                             ▼
              ┌────────────────┐          ┌────────────────┐          ┌────────────────┐
              │ Billing        │          │ Technical      │          │ Account        │
              │ Workflow       │          │ Workflow       │          │ Workflow       │
              │                │          │                │          │                │
              │ • Payment      │          │ • App Issues   │          │ • Account      │
              │ • Subscription │          │ • Technical    │          │ • Login        │
              │ • Refund       │          │   Problems     │          │ • User Issues  │
              └───────┬────────┘          └───────┬────────┘          └───────┬────────┘
                      │                            │                            │
                      └────────────────────────────┼────────────────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │       RAG       │
                                          │ Knowledge Base  │
                                          │                 │
                                          │ • Account       │
                                          │ • Billing       │
                                          │ • FAQ           │
                                          │ • Technical     │
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                             ┌───────────┐
                                             │  Groq LLM │
                                             └─────┬─────┘
                                                   │
                                      ┌────────────┴────────────┐
                                      │                         │
                                      ▼                         ▼
                               ┌─────────────┐          ┌──────────────────┐
                               │   Resolved  │          │ Human Escalation │
                               │   Response  │          └────────┬─────────┘
                               └─────────────┘                   │
                                                                ▼
                                                       ┌─────────────────────┐
                                                       │ Human Support       │
                                                       │ Dashboard           │
                                                       │                     │
                                                       │ • View Tickets      │
                                                       │ • Reply to Customer │
                                                       │ • Approve Refund    │
                                                       │ • Reject Refund     │
                                                       │ • Resolve Ticket    │
                                                       └──────────┬──────────┘
                                                                  │
                                                                  ▼
                                                            ┌─────────────┐
                                                            │  Customer   │
                                                            │   Response  │
                                                            └─────────────┘
