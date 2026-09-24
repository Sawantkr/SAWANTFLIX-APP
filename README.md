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

# 🏗️ System Architecture

Sawantflix follows a modular client-server architecture.

The React frontend communicates with the Express backend through REST APIs, while external services such as Firebase, TMDB and Razorpay provide authentication, movie data and payment functionality.

```text
                         ┌─────────────────────┐
                         │      SAWANTFLIX     │
                         │    React Frontend   │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      Firebase Auth             TMDB API             Express API
             │                                             │
             │                              ┌──────────────┼──────────────┐
             │                              │              │              │
             │                              ▼              ▼              ▼
             │                         Razorpay       PostgreSQL      Support APIs
             │
             ▼
       Authenticated User
                                   
                                   
                         ┌─────────────────────┐
                         │ Agentic AI Support  │
                         │    FastAPI Backend  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                               LangGraph
                                    │
                         ┌──────────┼──────────┐
                         ▼          ▼          ▼
                      Billing   Technical   Account
                         │          │          │
                         └──────────┼──────────┘
                                    ▼
                            Human Escalation
                                    │
                                    ▼
                          Human Support Dashboard
