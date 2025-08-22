import React from "react";
import { useNavigate } from "react-router-dom";

// Example dummy movies (baad me API se laa sakte ho)
const dummyMovies = [
  { id: 1, title: "Movie 1", poster: "https://image.tmdb.org/t/p/w200/xyz1.jpg" },
  { id: 2, title: "Movie 2", poster: "https://image.tmdb.org/t/p/w200/xyz2.jpg" },
  { id: 3, title: "Movie 3", poster: "https://image.tmdb.org/t/p/w200/xyz3.jpg" },
];

export default function Movies({ user }) {
  const navigate = useNavigate();

  const handleClick = (movieId) => {
    if (!user?.isSubscribed) {
      alert("⚠️ Please subscribe to watch movies!");
      navigate("/payment"); // Subscription page pe bhej do
    } else {
      navigate(`/movies/${movieId}`); // Agar subscribed hai toh movie detail
    }
  };

  return (
    <div className="pt-20 p-10">
      <h1 className="text-3xl font-bold mb-4">Movies</h1>

      {/* Movies list grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {dummyMovies.map((movie) => (
          <div
            key={movie.id}
            className="cursor-pointer hover:scale-105 transition"
            onClick={() => handleClick(movie.id)}
          >
            <img
              src={movie.poster}
              alt={movie.title}
              className="rounded-lg shadow-md"
            />
            <p className="mt-2 text-center">{movie.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
