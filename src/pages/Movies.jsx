import React from "react";
import { useNavigate } from "react-router-dom";

const dummyMovies = [
  {
    id: "1",
    title: "Inception",
    poster:
      "https://image.tmdb.org/t/p/w342/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
  },
  {
    id: "2",
    title: "Interstellar",
    poster:
      "https://image.tmdb.org/t/p/w342/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
  },
  {
    id: "3",
    title: "The Dark Knight",
    poster:
      "https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  },
  {
    id: "4",
    title: "The Matrix",
    poster:
      "https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  },
  {
    id: "5",
    title: "Avatar",
    poster:
      "https://image.tmdb.org/t/p/w342/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
  },
];

export default function Movies({ user }) {
  const navigate = useNavigate();

  const handleClick = (movieId) => {
    // not subscribed -> payment page
    if (!user?.isSubscribed) {
      alert("⚠️ Please subscribe to watch movies!");
      navigate("/account/payment");
      return;
    }
    // subscribed -> movie detail route (make sure App.jsx has /movies/:id)
    navigate(`/movies/${movieId}`);
  };

  return (
    <div className="pt-20 p-10 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Movies</h1>

      {/* Movies list grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {dummyMovies.map((movie) => (
          <button
            type="button"
            key={movie.id}
            className="text-left cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleClick(movie.id)}
          >
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-auto rounded-lg shadow-md"
              loading="lazy"
            />
            <p className="mt-2 text-center">{movie.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
