import React, { useEffect, useState } from "react"
import { IMAGE } from "../api/tmdb"

export default function MovieCard({ movie, onOpen }) {
  const [added, setAdded] = useState(false)

  // Check agar already "My List" me hai
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myList")) || []
    setAdded(saved.some((m) => m.id === movie.id))
  }, [movie.id])

  // Add/Remove My List
  const handleToggle = (e) => {
    e.stopPropagation() // Poster click se trailer open na ho
    let saved = JSON.parse(localStorage.getItem("myList")) || []

    if (added) {
      saved = saved.filter((m) => m.id !== movie.id)
    } else {
      saved.push(movie)
    }

    localStorage.setItem("myList", JSON.stringify(saved))
    setAdded(!added)
  }

  return (
    <div
      className="w-36 md:w-44 relative group cursor-pointer"
      onClick={() => onOpen(movie)}
    >
      {/* Poster */}
      <img
        src={IMAGE(movie.poster_path)}
        alt={movie.title}
        className="rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-110"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
        <div className="relative flex flex-col items-center">
          <button
            onClick={handleToggle}
            className={`p-2 rounded-full shadow-lg transition-all duration-300 ${
              added
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-800 hover:bg-red-600"
            } text-white text-lg`}
          >
            {added ? "✓" : "+"}
          </button>

          {/* Tooltip */}
          <span className="absolute top-12 text-xs px-2 py-1 rounded-md bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            {added ? "Remove from My List" : "Add to My List"}
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="mt-2 text-sm truncate text-center">{movie.title}</p>
    </div>
  )
}
