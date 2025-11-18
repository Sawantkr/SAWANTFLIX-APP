# Sawantflix

Netflix‑style streaming UI built with React, Vite, Tailwind, Firebase Auth, and TMDB. Includes a simple Express backend for Razorpay payments. The app supports email/password, Google OAuth, and phone OTP authentication; theme toggling; multilingual UI; hero banners with trailers; movie rows; search; and a payment page.

- Live App: `https://sawantflix-app-1.onrender.com`


**Highlights**
- Modern React app bootstrapped with Vite and Tailwind.
- Authentication: email/password, Google, and phone OTP via Firebase.
- Movie data fetched from TMDB (Trending, Top Rated, Upcoming, Search).
- Hero banner with auto-rotating slides and trailer playback.
- Movie modal with YouTube trailer and details.
- i18n with English and Hindi resources (language switcher UI lists more).
- Light/Dark theme toggle.
- Payment page with Razorpay checkout (UPI demo flow) via Express backend.


## Tech Stack
- Frontend: `React 18`, `Vite 5`, `TailwindCSS`, `React Router`, `Axios`, `i18next`
- Auth: `Firebase Auth` (email/password, Google, phone OTP)
- Backend: `Express`, `cors`, `dotenv`, `Razorpay`
- Build/Dev: `concurrently` for combined dev experience


## Features
- Authentication modal with:
  - Sign In / Sign Up using email and password
  - Google sign‑in
  - Phone OTP with invisible reCAPTCHA (`#recaptcha-container`)
- Responsive navbar with:
  - Routes: Home, TV Shows, Movies, New & Popular, My List
  - Search input with debounced TMDB queries
  - Language selector (English, हिन्दी, Marathi, Español, Français)
  - Theme toggle (light/dark)
  - User menu with quick actions and a link to Payment page
- Home page:
  - Banner carousel that auto‑rotates and can play trailers
  - Rows for Trending, Top Rated, Upcoming
  - Conditional row for Search Results
- Movie modal:
  - YouTube trailer embed (fallback to poster)
  - Title, date, rating, overview
- Payment page:
  - Select Basic, Standard, or Premium
  - Razorpay checkout via backend `/api/create-order`
  - Simple billing history in UI
- Footer with common links and branding


## Project Structure
```
Sawantflix-My-Contribution/
├── server/                # Express backend (Razorpay APIs)
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── src/                   # React frontend
│   ├── api/tmdb.js        # TMDB API helpers
│   ├── components/        # UI components (Navbar, Banner, AuthModal, etc.)
│   ├── pages/             # Route components (TVShows, Movies, Payment, etc.)
│   ├── firebase.js        # Firebase initialization & helpers
│   ├── config.js          # API base selection (dev/prod)
│   ├── App.jsx            # App routes and layout
│   ├── main.jsx           # App bootstrap
│   └── index.css          # Tailwind and global styles
├── package.json           # Frontend scripts and deps
├── vite.config.js
├── tailwind.config.js
└── README.md
```


## Environment Variables

Create a `.env` in the project root for frontend configuration (Vite uses `import.meta.env`):

```
VITE_TMDB_API_KEY=your_tmdb_api_key

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Create a `.env` in `server/` for backend configuration:

```
PORT=5000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Notes:
- `src/config.js` selects `API_BASE` by hostname:
  - `localhost` → `http://localhost:5000`
- The live app is at `https://sawantflix-app-1.onrender.com`. If your backend is hosted at a different URL, update `src/config.js` accordingly.


## Scripts

Frontend `package.json` exposes combined dev and individual scripts:

- `npm run dev` — run backend (nodemon) and frontend (Vite) together
- `npm run frontend` — start Vite dev server
- `npm run backend` — start backend via `server` package (nodemon)
- `npm run build` — build frontend for production
- `npm run preview` — preview the built frontend locally

Backend `server/package.json`:
- `npm run dev` — start `server.js` with nodemon
- `npm start` — start `server.js` with Node


## Getting Started

Prerequisites:
- Node.js 18+ (Vite 5 requires Node 18 or newer)
- TMDB account and API key
- Firebase project with Authentication enabled (Email/Password, Google, Phone)
- Razorpay account and test keys (for payment testing)

Setup:
1. Clone the repo and navigate to the project directory.
2. Create `.env` files as described above (frontend and `server/`).
3. Install dependencies:
   - `npm install`
   - `npm install --prefix server`
4. Run in development:
   - `npm run dev` (recommended) — starts both frontend and backend
   - or separately: `npm run frontend` and `npm run backend`
5. Open `http://localhost:5173` (Vite default) and sign in to use the app.

Production Build:
- `npm run build` to build the frontend (`dist/`)
- Serve the backend (`server/server.js`); it can be configured to serve static files if you deploy frontend assets with the backend.


## Backend API (Razorpay)

The Express backend provides payment endpoints:
- `POST /api/create-order` — creates a Razorpay order; returns `{ orderId, amount, currency, keyId }`
- `POST /api/verify-payment` — verifies Razorpay signature; returns `{ verified: boolean }`
- `GET /api` — health check

The frontend `Payment` page calls `POST /api/create-order` and launches Razorpay Checkout with UPI method for a demo flow.


## Internationalization

`src/components/i18n.js` initializes i18next with English (`en`) and Hindi (`hi`) translations for common navbar labels and placeholders. The navbar language selector shows additional options (Marathi, Spanish, French) that can be expanded by adding resources to `i18n.js`.


## Authentication

- Email/Password sign in and sign up
- Google OAuth via `GoogleAuthProvider`
- Phone OTP: uses invisible reCAPTCHA and `signInWithPhoneNumber`
- The app waits for Firebase auth state; if unauthenticated, the `AuthModal` is displayed instead of the main content


## TMDB Integration

- `src/api/tmdb.js` uses `VITE_TMDB_API_KEY` and Axios to fetch:
  - Trending (`/trending/movie/day`)
  - Top Rated (`/movie/top_rated`)
  - Upcoming (`/movie/upcoming`)
  - Search (`/search/movie`)
- Images use `https://image.tmdb.org/t/p/w500` and `original` sizes for banners.


## Deployment

- Frontend: deployed to `https://sawantflix-app-1.onrender.com`
- Backend: set `API_BASE` in `src/config.js` to your backend URL. 
- Common options: Render, Vercel (frontend), or any Node host for the backend.


