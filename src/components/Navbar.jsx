import React from "react";

const Navbar = ({ setToken }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex items-center justify-between 
      px-4 sm:px-[4%] py-3 sm:py-5 
      border-b border-gray-200/80 bg-white/95 backdrop-blur-lg shadow-sm">

      {/* Logo / Title */}
      <div className="flex items-baseline gap-2 sm:gap-3">
        <h1 className="font-['Playfair_Display'] text-xl sm:text-3xl font-bold tracking-[0.15em] text-black">
          JEANZEY
        </h1>
        {/* ✅ Always visible on all screen sizes */}
        <span className="font-['Playfair_Display'] text-[10px] sm:text-base font-light tracking-[0.1em] text-gray-500 italic">
          Admin
        </span>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => setToken("")}
        className="group relative px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium tracking-wide
        bg-black text-white border-2 border-black
        hover:bg-white hover:text-black
        transition-all duration-300 ease-out
        shadow-[0_4px_14px_0_rgba(0,0,0,0.1)]
        active:scale-95"
      >
        <span className="relative z-10 font-['Outfit']">Logout</span>
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </button>
    </div>
  );
};

export default Navbar;