import React, { useEffect, useRef, useState } from "react"

export default function Banner({
  movies = [],
  interval = 5000,
  hoverPause = true,
}) {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const [loadingTrailer, setLoadingTrailer] = useState(false)

  // per-movie trailer cache: { [id]: { type: "yt"|"video", key?:string, url?:string } }
  const [trailerCache, setTrailerCache] = useState({})
  const [currentKey, setCurrentKey] = useState(null) // YouTube key for current slide (if any)

  const videoRef = useRef(null)

  // Vite env key
  const TMDB_API_KEY =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_TMDB_API_KEY) ||
    ""

  // Auto-rotate (pause on hover or when trailer is open)
  useEffect(() => {
    if (!movies.length) return
    if (isPaused || showTrailer) return
    const t = setInterval(() => {
      setIndex((p) => (p + 1) % movies.length)
    }, interval)
    return () => clearInterval(t)
  }, [movies, interval, isPaused, showTrailer])

  const onEnter = () => hoverPause && setIsPaused(true)
  const onLeave = () => hoverPause && setIsPaused(false)

  if (!movies.length) {
    return (
      <header className="h-72 md:h-96 flex items-end bg-gradient-to-t from-black to-transparent" />
    )
  }

  const movie = movies[index]

  // jab slide badle, currentKey ko cache se reload karo (per-slide)
  useEffect(() => {
    const cached = trailerCache[movie?.id]
    if (cached?.type === "yt") setCurrentKey(cached.key || null)
    else setCurrentKey(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, movie?.id])

  // HTML5 video ko hover-pause ke saath control (overlay visible tabhi apply)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isPaused) v.pause()
    else v.play().catch(() => {})
  }, [isPaused, showTrailer])

  // Manual arrows
  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + movies.length) % movies.length)
  const nextSlide = () =>
    setIndex((prev) => (prev + 1) % movies.length)

  // Fetch trailer for CURRENT slide only when Play is clicked
  const handlePlay = async () => {
    if (!movie?.id) return

    // 1) if direct video url present on movie, use it and cache
    if (movie.trailerUrl) {
      setTrailerCache((c) => ({
        ...c,
        [movie.id]: { type: "video", url: movie.trailerUrl },
      }))
      setShowTrailer(true)
      return
    }

    // 2) if cached YouTube key exists, show immediately
    const cached = trailerCache[movie.id]
    if (cached?.type === "yt" && cached.key) {
      setCurrentKey(cached.key)
      setShowTrailer(true)
      return
    }

    // 3) else fetch from TMDB for THIS movie
    setLoadingTrailer(true)
    try {
      if (!TMDB_API_KEY) throw new Error("Missing TMDB API key")
      const type = movie.media_type || (movie.first_air_date ? "tv" : "movie")
      const url = `https://api.themoviedb.org/3/${type}/${movie.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`
      const res = await fetch(url)
      const data = await res.json()
      const vids = Array.isArray(data?.results) ? data.results : []
      const pick =
        vids.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
        vids.find((v) => v.site === "YouTube")

      if (pick?.key) {
        setTrailerCache((c) => ({
          ...c,
          [movie.id]: { type: "yt", key: pick.key },
        }))
        setCurrentKey(pick.key)
      }
    } catch (e) {
      console.error("Trailer fetch failed", e)
    } finally {
      setLoadingTrailer(false)
      setShowTrailer(true)
    }
  }

  return (
    <header
      className="h-72 md:h-96 relative text-white transition-all duration-700 overflow-hidden"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* BACKDROP image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${
            movie.backdrop_path || movie.poster_path || ""
          })`,
        }}
      />

      {/* subtle animated glow */}
      <div className="pointer-events-none absolute inset-0 z-[5]">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl banner-glow" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl banner-glow delay-[-1s]" />
      </div>

      {/* dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />

      {/* CONTENT */}
      <div className="container relative z-20 py-8">
        <h2 className="text-3xl font-bold drop-shadow">
          {movie.title || movie.name}
        </h2>
        <p className="max-w-xl mt-3 text-sm md:text-base line-clamp-3">
          {movie.overview}
        </p>
        <div className="mt-4 flex gap-3 items-center">
          <button
            onClick={handlePlay}
            className="px-4 py-2 bg-white text-black rounded font-semibold disabled:opacity-60"
            disabled={loadingTrailer}
          >
            {loadingTrailer ? "Loading..." : "Play"}
          </button>
          <button className="px-4 py-2 border rounded">My List</button>

          {/* label only — hover pe 'Pause', otherwise 'Playing' */}
          <button
            className="px-4 py-2 border rounded font-medium"
            aria-label={isPaused ? "Paused" : "Playing"}
            title={isPaused ? "Paused" : "Playing"}
          >
            {isPaused ? "Pause" : "Playing"}
          </button>
        </div>
      </div>

      {/* ARROWS */}
      <button
        onClick={prevSlide}
        className="absolute left-6 bottom-10 z-50 h-12 w-12 grid place-items-center
                   rounded-full bg-black/50 hover:bg-black/70 backdrop-blur
                   text-3xl font-bold leading-none transition focus:outline-none focus:ring focus:ring-white/40"
        aria-label="Previous"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 bottom-10 z-50 h-12 w-12 grid place-items-center
                   rounded-full bg-black/50 hover:bg-black/70 backdrop-blur
                   text-3xl font-bold leading-none transition focus:outline-none focus:ring focus:ring-white/40"
        aria-label="Next"
      >
        ›
      </button>

      {/* DOTS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* TRAILER OVERLAY (per current slide) */}
      {showTrailer && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setShowTrailer(false)}
            className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full
                       bg-white/20 hover:bg-white/30 text-white text-xl"
            aria-label="Close trailer"
          >
            ✕
          </button>

          {/* Priority: direct HTML5 video (if cached as such) */}
          {trailerCache[movie.id]?.type === "video" ? (
            <video
              ref={videoRef}
              className="w-[90%] max-w-5xl aspect-video rounded-lg shadow-2xl"
              src={trailerCache[movie.id].url}
              muted
              autoPlay
              controls
              playsInline
              poster={`https://image.tmdb.org/t/p/original${
                movie.backdrop_path || movie.poster_path || ""
              }`}
            />
          ) : currentKey ? (
            <iframe
              className="w-[90%] max-w-5xl aspect-video rounded-lg shadow-2xl"
              src={`https://www.youtube.com/embed/${currentKey}?autoplay=1&mute=0&controls=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1`}
              title="Trailer"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          ) : (
            <div className="text-white">Trailer not available.</div>
          )}
        </div>
      )}

      {/* component-scoped CSS for glow */}
      <style>{`
        .banner-glow {
          background: radial-gradient(60% 60% at 50% 50%, #ffffff 0%, transparent 60%);
          animation: banner-pan 10s linear infinite;
        }
        @keyframes banner-pan {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(20px, -10px, 0) scale(1.1); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
      `}</style>
    </header>
  )
}
