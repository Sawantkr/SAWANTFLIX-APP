import React, { useEffect, useState } from "react"
import MovieCard from "../components/MovieCard"

export default function MyList() {
  const [myList, setMyList] = useState([])


  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myList")) || []
    setMyList(saved)
  }, [])

  
  const handleOpen = (movie) => {
    alert(`Open details for ${movie.title}`)
  }

  return (
    <div className="pt-20 p-40">
      <h1 className="text-3xl font-bold mb-4">My List</h1>

      {myList.length === 0 ? (
        <p className="text-gray-400">Aapne abhi tak koi movie add nahi ki hai.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {myList.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onOpen={handleOpen} />
          ))}
        </div>
      )}
    </div>
  )
}
