import axios from 'axios'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'
export const IMAGE = (path) => `https://image.tmdb.org/t/p/w500${path}`
export const fetchTrending = () => axios.get(`${BASE}/trending/movie/day?api_key=${API_KEY}`)
export const fetchTopRated = () => axios.get(`${BASE}/movie/top_rated?api_key=${API_KEY}`)
export const fetchUpcoming = () => axios.get(`${BASE}/movie/upcoming?api_key=${API_KEY}`)
export const searchMovie = (query, page=1) => axios.get(`${BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`)
export const fetchVideos = (movieId) => axios.get(`${BASE}/movie/${movieId}/videos?api_key=${API_KEY}`)