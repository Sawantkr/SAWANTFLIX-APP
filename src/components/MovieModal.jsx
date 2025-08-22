import React, { useEffect, useState, useCallback } from "react";
import { fetchVideos, IMAGE } from "../api/tmdb";

export default function MovieModal({ movie, onClose }) {
  const [videoKey, setVideoKey] = useState(null);

  // Fetch trailer when movie changes
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!movie) return;
      try {
        const res = await fetchVideos(movie.id);
        const list = Array.isArray(res?.data?.results) ? res.data.results : [];
        const yt =
          list.find(v => v.site === "YouTube" && v.type === "Trailer") ||
          list.find(v => v.site === "YouTube");
        if (!ignore) setVideoKey(yt?.key || null);
      } catch {
        if (!ignore) setVideoKey(null);
      }
    }
    load();
    return () => { ignore = true; };
  }, [movie]);

  // Close on ESC
  const onKey = useCallback(
    (e) => { if (e.key === "Escape") onClose?.(); },
    [onClose]
  );
  useEffect(() => {
    if (!movie) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [movie, onKey]);

  if (!movie) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm
                 flex items-center justify-center p-3 sm:p-4
                 overflow-y-auto overscroll-contain"
      onClick={(e) => {
        // click on backdrop closes (but not when clicking inside card)
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Movie details"
    >
      {/* Card */}
      <div className="relative w-full max-w-3xl bg-neutral-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Close button – fixed top-right of card */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3
                     h-10 w-10 grid place-items-center rounded-full
                     bg-white/15 hover:bg-white/25 text-white text-xl
                     focus:outline-none focus:ring-2 focus:ring-white/40 z-50"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Media (Trailer or Poster) */}
        <div className="w-full">
          {videoKey ? (
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoKey}?autoplay=0&rel=0&modestbranding=1`}
                title="Trailer"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                frameBorder="0"
              />
            </div>
          ) : (
            <img
              src={IMAGE(movie.backdrop_path || movie.poster_path)}
              alt={movie.title || movie.name}
              className="w-full max-h-[60vh] object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4">
          {/* Poster (hide if big backdrop already used) */}
          {!videoKey && movie.poster_path ? (
            <img
              src={IMAGE(movie.poster_path)}
              alt="poster"
              className="w-28 sm:w-32 rounded-lg hidden sm:block"
            />
          ) : null}

          <div>
            <h2 className="text-lg sm:text-2xl font-bold">
              {movie.title || movie.name}
            </h2>
            {movie.release_date || movie.first_air_date ? (
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {movie.release_date || movie.first_air_date}
                {movie.vote_average ? ` • ⭐ ${movie.vote_average.toFixed(1)}` : ""}
              </p>
            ) : null}

            <p className="text-sm sm:text-base mt-3 leading-relaxed">
              {movie.overview || "No description available."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
