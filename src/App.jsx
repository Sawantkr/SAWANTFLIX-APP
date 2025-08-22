import React, { useEffect, useState } from "react"
import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Banner from "./components/Banner"
import Row from "./components/Row"
import MovieModal from "./components/MovieModal"
import AuthModal from "./components/AuthModal"
import Footer from "./components/Footer"
import { fetchTrending, fetchTopRated, fetchUpcoming, searchMovie } from "./api/tmdb"
import { auth } from "./firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

// Pages
import TVShows from "./pages/TVShows"
import Movies from "./pages/Movies"
import NewPopular from "./pages/NewPopular"
import MyList from "./pages/MyList"
import Payment from "./pages/Payment"   // ✅ Payment page import

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

  // Movies fetch
  useEffect(() => {
    fetchTrending().then(r => setTrending(r.data.results)).catch(() => {})
    fetchTopRated().then(r => setTopRated(r.data.results)).catch(() => {})
    fetchUpcoming().then(r => setUpcoming(r.data.results)).catch(() => {})
  }, [])

  // Search debounce
  useEffect(() => {
    if (query.trim() === "") {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      searchMovie(query).then(r => setSearchResults(r.data.results))
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      // 🔹 yahan tum backend se subscription status bhi fetch kar sakte ho
      // Abhi ke liye hardcode kar raha hu
      if (u) {
        setUser({ ...u, isSubscribed: false }) // ✅ test ke liye false
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Handlers
  const openAuth = (mode = "signin") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const openMovie = (m) => setSelected(m)

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p>Loading...</p>
      </div>
    )
  }

  // Agar user login nahi hai => sirf AuthModal dikhao
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <AuthModal open={true} mode={authMode} onClose={() => {}} />
      </div>
    )
  }

  // Agar user login hai => pura app dikhao
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      {/* Navbar */}
      <Navbar
        onOpenAuth={openAuth}
        onToggleTheme={() => setIsLight(s => !s)}
        isLight={isLight}
        onSearch={setQuery}
        user={user}
        onLogout={logout}
      />

      {/* Routes */}
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <main className="container mx-auto px-4 pt-20">
              <Banner movie={trending[0]} />
              <div className="mt-8 space-y-8">
                <Row title="Trending Now" movies={trending} onOpen={openMovie} />
                <Row title="Top Rated" movies={topRated} onOpen={openMovie} />
                <Row title="Upcoming" movies={upcoming} onOpen={openMovie} />
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

        {/* Other Pages */}
        <Route path="/tv" element={<TVShows />} />
        {/* ✅ user prop pass kiya */}
        <Route path="/movies" element={<Movies user={user} />} /> 
        <Route path="/new" element={<NewPopular />} />
        <Route path="/my-list" element={<MyList />} />

        {/* ✅ Payment Page */}
        <Route path="/account/payment" element={<Payment />} />
      </Routes>

      {/* Footer */}
      <Footer />

      {/* Popups */}
      <MovieModal movie={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
