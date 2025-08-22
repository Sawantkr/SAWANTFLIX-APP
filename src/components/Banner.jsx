import React from 'react'
export default function Banner({ movie }){
  if(!movie) return (
    <header className="h-72 md:h-96 flex items-end bg-gradient-to-t from-black to-transparent" />
  )
  return (
    <header className="h-72 md:h-96 relative text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`}} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
      <div className="container relative z-10 py-8">
        <h2 className="text-3xl font-bold">{movie.title || movie.name}</h2>
        <p className="max-w-xl mt-3 text-sm md:text-base">{movie.overview}</p>
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 bg-white text-black rounded font-semibold">Play</button>
          <button className="px-4 py-2 border rounded">My List</button>
        </div>
      </div>
    </header>
  )
}