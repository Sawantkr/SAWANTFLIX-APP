import React from "react";

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-6">
          About SawantFlix
        </h1>

        <p className="text-gray-300 leading-7 mb-5">
          SawantFlix is an online movie and entertainment platform
          designed to provide users with a simple and convenient way
          to discover movies and entertainment content.
        </p>

        <p className="text-gray-300 leading-7 mb-5">
          Users can explore trending, top-rated and upcoming movies,
          search for movies, view movie information and manage their
          account.
        </p>

        <p className="text-gray-300 leading-7">
          SawantFlix is a technology project demonstrating an online
          entertainment platform with user authentication, payment
          functionality and customer support features.
        </p>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">
            Our Platform
          </h2>

          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Movie discovery and search</li>
            <li>Trending and top-rated movies</li>
            <li>Upcoming movie information</li>
            <li>User account management</li>
            <li>Subscription and payment functionality</li>
            <li>Customer support</li>
          </ul>
        </div>

      </div>
    </div>
  );
}