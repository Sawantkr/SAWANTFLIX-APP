import React, { useEffect, useState } from "react";
import { IMAGE } from "../api/tmdb";

export default function MovieCard({ movie, onOpen }) {
  const [added, setAdded] = useState(false);
  const [mobileActions, setMobileActions] = useState(false); 


  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myList")) || [];
    setAdded(saved.some((m) => m.id === movie.id));
  }, [movie.id]);

  const toggleMyList = (e) => {
    e.stopPropagation();
    let saved = JSON.parse(localStorage.getItem("myList")) || [];
    if (added) {
      saved = saved.filter((m) => m.id !== movie.id);
    } else {
      saved.push(movie);
    }
    localStorage.setItem("myList", JSON.stringify(saved));
    setAdded(!added);
  };

  const openInfo = (e) => {
    e.stopPropagation();
    onOpen?.(movie);
    setMobileActions(false);
  };

  return (
    <div
      className="movie-card relative w-28 sm:w-36 md:w-44 lg:w-52 cursor-pointer group select-none"
      onClick={() => onOpen?.(movie)}
    >
      {/* Poster */}
      <img
        src={IMAGE(movie.poster_path)}
        alt={movie.title || movie.name}
        className="w-full h-auto rounded-lg shadow-lg"
        draggable={false}
      />

      <div className="hidden md:flex absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center">
        <div className="flex gap-2">
          <button
            onClick={toggleMyList}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              added ? "bg-green-600" : "bg-gray-800 hover:bg-red-600"
            }`}
          >
            {added ? "✓ My List" : "+ My List"}
          </button>
          <button
            onClick={openInfo}
            className="px-3 py-1 rounded-md text-sm font-medium bg-white/90 text-black hover:bg-white"
          >
            Details
          </button>
        </div>
      </div>

      {/* Mobile (sm-) quick actions trigger */}
      <button
        className="md:hidden absolute top-1.5 right-1.5 h-7 w-7 grid place-items-center rounded-full bg-black/60 text-white text-sm active:scale-95"
        onClick={(e) => {
          e.stopPropagation();
          setMobileActions((s) => !s);
        }}
        aria-label="More actions"
      >
        ⋯
      </button>

      {/* Mobile actions popover */}
      {mobileActions && (
        <div
          className="md:hidden absolute top-9 right-1.5 z-10 w-32 rounded-lg bg-black/85 border border-white/10 p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={toggleMyList}
            className="w-full text-left px-2 py-1 text-sm rounded hover:bg-white/10"
          >
            {added ? "✓ Remove" : "+ My List"}
          </button>
          <button
            onClick={openInfo}
            className="w-full text-left px-2 py-1 text-sm rounded hover:bg-white/10"
          >
            Details
          </button>
        </div>
      )}

      {/* Title */}
      <p className="mt-2 text-xs sm:text-sm truncate text-center">
        {movie.title || movie.name}
      </p>
    </div>
  );
}
