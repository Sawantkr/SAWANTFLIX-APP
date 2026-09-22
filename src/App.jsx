import React, { useEffect, useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"

import Navbar from "./components/Navbar"
import Banner from "./components/Banner"
import Row from "./components/Row"
import MovieModal from "./components/MovieModal"
import AuthModal from "./components/AuthModal"
import Footer from "./components/Footer"
import CustomerSupport from "./components/CustomerSupport"
import HumanSupportDashboard from "./components/HumanSupportDashboard"

import {
  fetchTrending,
  fetchTopRated,
  fetchUpcoming,
  searchMovie,
} from "./api/tmdb"

import { auth } from "./firebase"
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth"

// Pages
import TVShows from "./pages/TVShows"
import Movies from "./pages/Movies"
import NewPopular from "./pages/NewPopular"
import MyList from "./pages/MyList"
import Payment from "./pages/Payment"
import MovieDetail from "./pages/MovieDetail"

// Business / Legal Pages
import About from "./pages/About"
import ContactPage from "./pages/ContactPage"
import PrivacyPolicy from "./pages/PrivacyPolicy"
import TermsAndConditions from "./pages/TermsAndConditions"
import RefundPolicy from "./pages/RefundPolicy"


// =====================================================
// SUPPORT ADMIN ACCOUNT
// =====================================================

const SUPPORT_ADMIN_EMAIL =
  "sawantkumarsawant7209@gmail.com"


export default function App() {

  const location = useLocation()


  // =====================================================
  // STATES
  // =====================================================

  const [trending, setTrending] = useState([])
  const [topRated, setTopRated] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [selected, setSelected] = useState(null)

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState("signin")

  const [isLight, setIsLight] = useState(false)

  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)


  // =====================================================
  // CHECK ADMIN ROUTE
  // =====================================================

  const isAdminRoute =
    location.pathname === "/admin/support"


  // =====================================================
  // MOVIES FETCH
  // =====================================================

  useEffect(() => {

    fetchTrending()
      .then((r) => setTrending(r.data.results))
      .catch(() => {})

    fetchTopRated()
      .then((r) => setTopRated(r.data.results))
      .catch(() => {})

    fetchUpcoming()
      .then((r) => setUpcoming(r.data.results))
      .catch(() => {})

  }, [])


  // =====================================================
  // SEARCH DEBOUNCE
  // =====================================================

  useEffect(() => {

    if (query.trim() === "") {

      setSearchResults([])

      return
    }


    const t = setTimeout(() => {

      searchMovie(query)
        .then((r) =>
          setSearchResults(r.data.results)
        )
        .catch(() => {})

    }, 400)


    return () => clearTimeout(t)

  }, [query])


  // =====================================================
  // FIREBASE USER -> POSTGRESQL SYNC
  // =====================================================

  const syncUserWithBackend = async (
    firebaseUser
  ) => {

    try {

      const response = await fetch(
  `${import.meta.env.VITE_SAWANTFLIX_API_URL}/api/users/sync`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            firebaseUid:
              firebaseUser.uid,

            email:
              firebaseUser.email,

            name:
              firebaseUser.displayName,
          }),
        }
      )


      const data =
        await response.json()


      if (!response.ok) {

        console.error(
          "❌ User sync failed:",
          data
        )

        return
      }


      console.log(
        "✅ User synced with PostgreSQL:",
        data.user
      )


    } catch (error) {

      console.error(
        "❌ PostgreSQL user sync error:",
        error
      )

    }
  }


  // =====================================================
  // FIREBASE AUTH LISTENER
  // =====================================================

  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {

          if (firebaseUser) {

            await syncUserWithBackend(
              firebaseUser
            )


            setUser({
              ...firebaseUser,
              isSubscribed: false,
            })

          } else {

            setUser(null)

          }


          setLoading(false)

        }
      )


    return () => unsub()

  }, [])


  // =====================================================
  // HANDLERS
  // =====================================================

  const openAuth = (
    mode = "signin"
  ) => {

    setAuthMode(mode)

    setAuthOpen(true)

  }


  const openMovie = (movie) => {

    setSelected(movie)

  }


  const logout = async () => {

    await signOut(auth)

    setUser(null)

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-screen bg-black text-white">

        <p>Loading...</p>

      </div>

    )

  }


  // =====================================================
  // ADMIN SUPPORT PORTAL
  // =====================================================

  if (isAdminRoute) {

    // User is not logged in
    if (!user) {

      return (

        <div className="flex items-center justify-center min-h-screen bg-black text-white">

          <AuthModal
            open={true}
            mode="signin"
            onClose={() => {}}
          />

        </div>

      )

    }


    // Check authorized support email
    const loggedInEmail =
      user.email?.toLowerCase().trim()


    const authorizedEmail =
      SUPPORT_ADMIN_EMAIL
        .toLowerCase()
        .trim()


    if (loggedInEmail !== authorizedEmail) {

      return (

        <div className="flex items-center justify-center min-h-screen bg-black text-white">

          <div className="text-center">

            <h1 className="text-3xl font-bold mb-4">
              Access Denied
            </h1>


            <p className="text-gray-400 mb-6">
              You are not authorized to access
              the support dashboard.
            </p>


            <button
              onClick={logout}
              className="px-5 py-2 bg-red-600 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>

          </div>

        </div>

      )

    }


    // Authorized support user
    return (
      <HumanSupportDashboard />
    )

  }


  // =====================================================
  // NORMAL CUSTOMER AUTH
  // =====================================================

  if (!user) {

    return (

      <div className="flex items-center justify-center min-h-screen bg-black text-white">

        <AuthModal
          open={true}
          mode={authMode}
          onClose={() => {}}
        />

      </div>

    )

  }


  // =====================================================
  // NORMAL CUSTOMER APP
  // =====================================================

  return (

    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight
          ? "bg-white text-black"
          : "bg-black text-white"
      }`}
    >


      {/* =================================================
          CUSTOMER NAVBAR
          ================================================= */}

      <Navbar

        onOpenAuth={openAuth}

        onToggleTheme={() =>
          setIsLight((s) => !s)
        }

        isLight={isLight}

        onSearch={setQuery}

        user={user}

        onLogout={logout}

      />


      {/* =================================================
          CUSTOMER ROUTES
          ================================================= */}

      <Routes>


        {/* =================================================
            HOME
            ================================================= */}

        <Route
          path="/"
          element={

            <main className="container mx-auto px-4 pt-20">

              <Banner
                movies={trending}
                interval={4000}
              />


              <div className="mt-8 space-y-8">

                <Row
                  title="Trending Now"
                  movies={trending}
                  onOpen={openMovie}
                />

                <Row
                  title="Top Rated"
                  movies={topRated}
                  onOpen={openMovie}
                />

                <Row
                  title="Upcoming"
                  movies={upcoming}
                  onOpen={openMovie}
                />

                {searchResults.length > 0 && (

                  <Row
                    title="Search Results"
                    movies={searchResults}
                    onOpen={openMovie}
                  />

                )}

              </div>

            </main>

          }
        />


        {/* =================================================
            TV SHOWS
            ================================================= */}

        <Route
          path="/tv"
          element={
            <TVShows />
          }
        />


        {/* =================================================
            MOVIES
            ================================================= */}

        <Route
          path="/movies"
          element={
            <Movies user={user} />
          }
        />


        {/* =================================================
            NEW & POPULAR
            ================================================= */}

        <Route
          path="/new"
          element={
            <NewPopular />
          }
        />


        {/* =================================================
            MY LIST
            ================================================= */}

        <Route
          path="/my-list"
          element={
            <MyList />
          }
        />


        {/* =================================================
            MOVIE DETAIL
            ================================================= */}

        <Route
          path="/movies/:id"
          element={
            <MovieDetail />
          }
        />


        {/* =================================================
            PAYMENT
            ================================================= */}

        <Route
          path="/account/payment"
          element={
            <Payment />
          }
        />


        {/* =================================================
            CUSTOMER SUPPORT
            ================================================= */}

        <Route
          path="/support"
          element={
            <CustomerSupport user={user} />
          }
        />


        {/* =================================================
            BUSINESS / LEGAL PAGES
            ================================================= */}

        {/* ABOUT US */}

        <Route
          path="/about"
          element={
            <About />
          }
        />


        {/* CONTACT US */}

        <Route
          path="/contact"
          element={
            <ContactPage />
          }
        />


        {/* PRIVACY POLICY */}

        <Route
          path="/privacy-policy"
          element={
            <PrivacyPolicy />
          }
        />


        {/* TERMS & CONDITIONS */}

        <Route
          path="/terms-and-conditions"
          element={
            <TermsAndConditions />
          }
        />


        {/* REFUND & CANCELLATION POLICY */}

        <Route
          path="/refund-policy"
          element={
            <RefundPolicy />
          }
        />


      </Routes>


      {/* =================================================
          CUSTOMER FOOTER
          ================================================= */}

      <Footer />


      {/* =================================================
          MOVIE MODAL
          ================================================= */}

      <MovieModal

        movie={selected}

        onClose={() =>
          setSelected(null)
        }

      />


    </div>

  )

}