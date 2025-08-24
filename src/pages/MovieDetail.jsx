import React from "react";
import { useParams } from "react-router-dom";

export default function MovieDetail() {
  const { id } = useParams(); 

  return (
    <div className="pt-20 p-10">
      <h1 className="text-3xl font-bold mb-4">Movie Detail Page</h1>
      <p>Movie ID: {id}</p>
    </div>
  );
}
