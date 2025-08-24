// src/config.js
const dev = window.location.hostname === "localhost";

export const API_BASE = dev
  ? "http://localhost:5000"  // local backend
  : "https://sawantflix-app.onrender.com"; // deployed backend
