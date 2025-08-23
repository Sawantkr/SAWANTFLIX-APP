import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

export default function Navbar({
  onOpenAuth,
  onToggleTheme,
  isLight,
  onSearch,
  user,
  onLogout,
  onLanguageChange,
}) {
  const [query, setQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  // close search/menu with ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // common search submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch?.(query);
    navigate("/");
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => navigate("/");

  const getUserAvatar = () => {
    if (!user)
      return "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png";
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

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    onLanguageChange?.(selectedLang);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((s) => {
      const next = !s;
      if (next) setMobileSearchOpen(false);
      return next;
    });
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen((s) => {
      const next = !s;
      if (next) setMobileMenuOpen(false);
      return next;
    });
  };

  return (
    <div
      className={`w-full sticky top-0 z-40 backdrop-blur-md shadow-md ${
        isLight ? "bg-white/95 text-black" : "bg-black/90 text-white"
      }`}
    >
      {/* top bar */}
      <div className="container flex items-center justify-between gap-3 py-2 sm:py-3">
        {/* Left: Burger + Logo */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden h-9 w-9 grid place-items-center rounded bg-white/10 hover:bg-white/20 flex-shrink-0"
            aria-label="Toggle menu"
            onClick={toggleMobileMenu}
          >
            ☰
          </button>

          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-wide cursor-pointer select-none whitespace-nowrap"
            onClick={handleLogoClick}
          >
            <span className="text-[#e50914]">SAWANT</span>
            <span className={isLight ? "text-black" : "text-white"}>FLIX</span>
          </h1>

          {/* Desktop menu */}
          <ul className="hidden md:flex items-center gap-6 text-sm font-medium ml-6">
            {[
              { to: "/", label: "Home" },
              { to: "/tv", label: "TV Shows" },
              { to: "/movies", label: "Movies" },
              { to: "/new", label: "New & Popular" },
              { to: "/my-list", label: "My List" },
            ].map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "text-red-500 font-bold" : "hover:text-red-500"
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: search + lang + theme + auth/profile */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Mobile search icon */}
          <button
            className="md:hidden h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 flex-shrink-0 transition"
            aria-label="Search"
            onClick={toggleMobileSearch}
          >
            <FiSearch
              className={`w-5 h-5 ${
                isLight ? "text-gray-700" : "text-white"
              }`}
            />
          </button>

          {/* ✅ Desktop search (Netflix-like red focus) */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:flex items-center relative group"
          >
            <FiSearch
              className={`absolute left-3 w-5 h-5 pointer-events-none transition-colors
                ${isLight ? "text-gray-600" : "text-gray-400"}
                group-focus-within:text-[#e50914]`}
            />
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`pl-10 pr-3 py-1.5 rounded-md text-sm transition-all w-48 lg:w-64 min-w-0 outline-none
                border focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/70
                focus:shadow-[0_0_0_3px_rgba(229,9,20,0.25)]
                ${
                  isLight
                    ? "bg-gray-200 text-black placeholder-gray-600 border-gray-300"
                    : "bg-gray-800 text-white placeholder-gray-400 border-gray-700"
                }`}
              placeholder="Search..."
              autoComplete="off"
              inputMode="search"
              enterKeyHint="search"
            />
          </form>

          {/* Language (hide on very small screens) */}
          <select
            value={language}
            onChange={handleLanguageChange}
            className={`hidden sm:block px-2 py-1 rounded-md text-sm focus:outline-none border flex-shrink-0 ${
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

          {/* 🌗 Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded bg-white/10 hover:bg-white/20"
            aria-label="Toggle theme"
            title={isLight ? "Enable Dark Mode" : "Enable Light Mode"}
          >
            {isLight ? "🌙" : "☀️"}
          </button>

          {/* Auth buttons / Profile */}
          {!user ? (
            <div className="flex items-center gap-2">
              <button
                className="px-3 sm:px-4 py-1.5 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                onClick={() => onOpenAuth("signin")}
              >
                Sign In
              </button>
              <button
                className="hidden sm:inline-block px-4 py-1.5 rounded-md border border-gray-500 text-sm hover:bg-gray-700 hover:text-white transition"
                onClick={() => onOpenAuth("signup")}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="relative">
              <img
                src={getUserAvatar()}
                alt="profile"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-md cursor-pointer object-cover"
                onClick={() => setOpenDropdown((o) => !o)}
              />

              {openDropdown && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border overflow-hidden ${
                    isLight
                      ? "bg-white text-black border-gray-300"
                      : "bg-gray-900 text-white border-gray-700"
                  }`}
                >
                  <div className="px-4 py-3 text-sm border-b border-gray-600 truncate">
                    {user.displayName || user.email || user.phoneNumber}
                  </div>

                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition">
                    👤 Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition">
                    📺 Account
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition"
                    onClick={() => navigate("/account/payment")}
                  >
                    💳 Payment
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition">
                    ❓ Help Center
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition"
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

      {/* ✅ Mobile search bar (Netflix-like red focus) */}
      <div
        className={`md:hidden border-t border-white/10 transition-all duration-300 overflow-hidden ${
          mobileSearchOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container py-2">
          <form onSubmit={handleSubmit} className="relative flex items-center group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-[#e50914]" />
            <input
              autoFocus={mobileSearchOpen}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`flex-1 pl-10 pr-3 py-2 rounded-md text-sm transition-all outline-none
                border focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/70
                focus:shadow-[0_0_0_3px_rgba(229,9,20,0.25)]
                ${
                  isLight
                    ? "bg-gray-200 text-black placeholder-gray-600 border-gray-300"
                    : "bg-gray-800 text-white placeholder-gray-400 border-gray-700"
                }`}
              placeholder="Search..."
              autoComplete="off"
              inputMode="search"
              enterKeyHint="search"
            />
          </form>
        </div>
      </div>

      {/* Mobile menu (animated slide-down) */}
      <div
        className={`md:hidden border-t border-white/10 transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container py-3">
          <ul className="flex flex-col gap-2 text-sm">
            {[
              { to: "/", label: "Home" },
              { to: "/tv", label: "TV Shows" },
              { to: "/movies", label: "Movies" },
              { to: "/new", label: "New & Popular" },
              { to: "/my-list", label: "My List" },
            ].map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-2 py-2 rounded ${
                      isActive ? "text-red-500 font-bold" : "hover:bg-white/10"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}

            {/* Language in mobile menu */}
            <li className="pt-2">
              <select
                value={language}
                onChange={handleLanguageChange}
                className={`w-full px-2 py-2 rounded-md text-sm focus:outline-none border ${
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
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
