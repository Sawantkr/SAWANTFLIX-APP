import React, { useEffect, useState } from 'react'
import { fetchVideos, IMAGE } from '../api/tmdb'
export default function MovieModal({ movie, onClose }){
  const [videoKey, setVideoKey] = useState(null)
  useEffect(()=>{
    if(!movie) return
    fetchVideos(movie.id).then(res=>{
      const t = res.data.results.find(v=>v.site==='YouTube'&&v.type==='Trailer')
      setVideoKey(t?.key||null)
    })
  },[movie])
  if(!movie) return null
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-black rounded-lg max-w-3xl w-full mx-4 overflow-hidden">
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="text-white text-2xl">✕</button>
        </div>
        <div className="p-4 md:flex gap-4">
          <img src={IMAGE(movie.poster_path)} alt="poster" className="w-40 rounded" />
          <div>
            <h2 className="text-xl font-bold">{movie.title}</h2>
            <p className="text-sm mt-2 max-w-xl">{movie.overview}</p>
            <div className="mt-4">
              {videoKey ? (
                <iframe className="w-full h-56 md:h-80" src={`https://www.youtube.com/embed/${videoKey}`} allow="autoplay; encrypted-media" />
              ) : <p className="text-sm text-gray-400">Trailer not found</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}