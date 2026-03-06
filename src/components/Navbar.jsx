import React from "react";

const Navbar = ({ setToken }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-[4%] py-5 border-b border-gray-200/80 bg-white/95 backdrop-blur-lg shadow-sm">
      {/* Logo / Title */}
      <div className="flex items-baseline gap-3">
        <h1 className="font-['Playfair_Display'] text-3xl font-bold tracking-[0.15em] text-black">
          JEANZEY
        </h1>
        <span className="font-['Playfair_Display'] text-base font-light tracking-[0.1em] text-gray-500 italic">
          Admin Panel
        </span>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => setToken("")}
        className="group relative px-8 py-2.5 rounded-full text-sm font-medium tracking-wide
        bg-black text-white border-2 border-black
        hover:bg-white hover:text-black
        transition-all duration-300 ease-out
        shadow-[0_4px_14px_0_rgba(0,0,0,0.1)]
        hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.15)]
        active:scale-95"
      >
        <span className="relative z-10 font-['Outfit']">Logout</span>
        
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
        bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </button>
    </div>
  );
};

export default Navbar;