import React, { useEffect, useState } from "react"
import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Banner from "./components/Banner"
import Row from "./components/Row"
import MovieModal from "./components/MovieModal"
import AuthModal from "./components/AuthModal"
import Footer from "./components/Footer"
import CustomerSupport from "./components/CustomerSupport"

import {
  fetchTrending,
  fetchTopRated,
  fetchUpcoming,
  searchMovie,
} from "./api/tmdb"

import { auth } from "./firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

// Pages
import TVShows from "./pages/TVShows"
import Movies from "./pages/Movies"
import NewPopular from "./pages/NewPopular"
import MyList from "./pages/MyList"
import Payment from "./pages/Payment"
import MovieDetail from "./pages/MovieDetail"


export default function App() {

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
        .then((r) => setSearchResults(r.data.results))
        .catch(() => {})

    }, 400)

    return () => clearTimeout(t)

  }, [query])


  // =====================================================
  // FIREBASE USER -> POSTGRESQL SYNC
  // =====================================================

  const syncUserWithBackend = async (firebaseUser) => {

    try {

      const response = await fetch(
        "http://localhost:5000/api/users/sync",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
          }),
        }
      )

      const data = await response.json()

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

    const unsub = onAuthStateChanged(
      auth,
      async (firebaseUser) => {

        if (firebaseUser) {

          // Sync Firebase user with PostgreSQL
          await syncUserWithBackend(firebaseUser)

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

  const openAuth = (mode = "signin") => {

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
  // AUTH SCREEN
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
  // MAIN APP
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
          NAVBAR
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
          ROUTES
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


                {/* Trending */}

                <Row
                  title="Trending Now"
                  movies={trending}
                  onOpen={openMovie}
                />


                {/* Top Rated */}

                <Row
                  title="Top Rated"
                  movies={topRated}
                  onOpen={openMovie}
                />


                {/* Upcoming */}

                <Row
                  title="Upcoming"
                  movies={upcoming}
                  onOpen={openMovie}
                />


                {/* Search Results */}

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
          element={<TVShows />}
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
          element={<NewPopular />}
        />


        {/* =================================================
            MY LIST
            ================================================= */}

        <Route
          path="/my-list"
          element={<MyList />}
        />


        {/* =================================================
            MOVIE DETAIL
            ================================================= */}

        <Route
          path="/movies/:id"
          element={<MovieDetail />}
        />


        {/* =================================================
            PAYMENT
            ================================================= */}

        <Route
          path="/account/payment"
          element={<Payment />}
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

      </Routes>


      {/* =================================================
          FOOTER
          ================================================= */}

      <Footer />


      {/* =================================================
          MOVIE MODAL
          ================================================= */}

      <MovieModal
        movie={selected}
        onClose={() => setSelected(null)}
      />

    </div>

  )
}