import React from "react"
import MovieCard from "./MovieCard"

export default function Row({ title, movies = [], onOpen }) {
  return (
    <section className="py-6">
      <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 px-1">
        {title}
      </h3>

      <div className="relative">
        {/* scrollable strip */}
        <div
          className="
            flex gap-2 sm:gap-3 overflow-x-auto scroll-smooth
            snap-x snap-mandatory pb-2 pr-2 -ml-1 pl-1
            scrollbar-hide
          "
          style={{
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {movies.map((m) => (
            <div key={m.id} className="snap-start shrink-0 w-28 sm:w-36 md:w-44 lg:w-52">
              <MovieCard movie={m} onOpen={onOpen} />
            </div>
          ))}
        </div>

        {/* fade hints (left/right) */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-4 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-black to-transparent" />
      </div>
    </section>
  )
}
