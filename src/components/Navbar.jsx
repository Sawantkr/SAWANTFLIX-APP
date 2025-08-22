import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar({
  onOpenAuth,
  onToggleTheme,
  isLight,
  onSearch,
  user,
  onLogout,
  onLanguageChange, // ✅ Parent se callback aayega
}) {
  const [query, setQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [language, setLanguage] = useState("en"); // ✅ Default English
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch(query);
      navigate("/");
    }
  };

  // Logo click handler
  const handleLogoClick = () => {
    navigate("/");
  };

  // ✅ Avatar select logic
  const getUserAvatar = () => {
    if (!user) {
      return "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png";
    }
    if (user.photoURL) return user.photoURL;
    if (user.email) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.email[0].toUpperCase()
      )}&background=random&color=fff`;
    }
    if (user.phoneNumber) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.phoneNumber
      )}&background=random&color=fff`;
    }
    return "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png";
  };

  // ✅ Language change handler
  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    if (onLanguageChange) {
      onLanguageChange(selectedLang); // parent ko inform karega
    }
  };

  return (
    <div
      className={`w-full py-3 sticky top-0 z-40 backdrop-blur-md shadow-md ${
        isLight ? "bg-white/95 text-black" : "bg-black/95 text-white"
      }`}
    >
      <div className="container flex items-center justify-between">
        {/* Left Section with Logo + Menu */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <h1
            className="text-4xl font-extrabold tracking-wide cursor-pointer"
            onClick={handleLogoClick}
          >
            <span className="text-[#e50914]">SAWANT</span>
            <span className={isLight ? "text-black" : "text-white"}>FLIX</span>
          </h1>

          {/* Menu */}
          <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "text-red-500 font-bold" : "hover:text-red-500"
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/tv"
                className={({ isActive }) =>
                  isActive ? "text-red-500 font-bold" : "hover:text-red-500"
                }
              >
                TV Shows
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/movies"
                className={({ isActive }) =>
                  isActive ? "text-red-500 font-bold" : "hover:text-red-500"
                }
              >
                Movies
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/new"
                className={({ isActive }) =>
                  isActive ? "text-red-500 font-bold" : "hover:text-red-500"
                }
              >
                New & Popular
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/my-list"
                className={({ isActive }) =>
                  isActive ? "text-red-500 font-bold" : "hover:text-red-500"
                }
              >
                My List
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`px-4 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition ${
              isLight
                ? "bg-gray-200 text-black placeholder-gray-600"
                : "bg-gray-800 text-white placeholder-gray-400"
            }`}
            placeholder="Search..."
          />

          {/* ✅ Language Selector */}
          <select
            value={language}
            onChange={handleLanguageChange}
            className={`px-2 py-1 rounded-md text-sm focus:outline-none border ${
              isLight
                ? "bg-gray-200 text-black border-gray-400"
                : "bg-gray-800 text-white border-gray-600"
            }`}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>

          {/* If User not logged in */}
          {!user && (
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-1.5 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                onClick={() => onOpenAuth("signin")}
              >
                Sign In
              </button>
              <button
                className="px-4 py-1.5 rounded-md border border-gray-500 text-sm hover:bg-gray-700 hover:text-white transition"
                onClick={() => onOpenAuth("signup")}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Avatar Dropdown */}
          {user && (
            <div className="relative">
              <img
                src={getUserAvatar()}
                alt="profile"
                className="w-10 h-10 rounded-md cursor-pointer object-cover"
                onClick={() => setOpenDropdown(!openDropdown)}
              />

              {openDropdown && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border overflow-hidden ${
                    isLight
                      ? "bg-white text-black border-gray-300"
                      : "bg-gray-900 text-white border-gray-700"
                  }`}
                >
                  {/* Profile Info */}
                  <div className="px-4 py-3 text-sm border-b border-gray-600 truncate">
                    {user.displayName
                      ? user.displayName
                      : user.email || user.phoneNumber}
                  </div>

                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition">
                    👤 Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition">
                    📺 Account
                  </button>

                  {/* Payment Option */}
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition"
                    onClick={() => navigate("/account/payment")}
                  >
                    💳 Payment
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition">
                    ❓ Help Center
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition"
                    onClick={onToggleTheme}
                  >
                    {isLight ? "🌙 Dark Mode" : "☀️ Light Mode"}
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm bg-red-600 hover:bg-red-700 transition"
                    onClick={onLogout}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
