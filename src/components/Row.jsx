import React from 'react'
import MovieCard from './MovieCard'
export default function Row({ title, movies = [], onOpen }){
  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <div className="flex gap-4 overflow-x-auto">
        {movies.map(m => <MovieCard key={m.id} movie={m} onOpen={onOpen} />)}
      </div>
    </div>
  )
}
