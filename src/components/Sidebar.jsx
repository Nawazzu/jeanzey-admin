import React from "react";
import { NavLink } from "react-router-dom";
import dashboard_icon from "../assets/dashboard_icon.png";
import add_icon from "../assets/add_icon.png";
import order_icon from "../assets/order_icon.png";
import list_icon from "../assets/list_icon.png";
import analytics_icon from "../assets/analytics_icon.png"; // <-- ADD YOUR ICON HERE
import tag_icon from "../assets/tag_icon.png";
import  comp_icon from "../assets/comp_icon.png";

const Sidebar = () => {
  return (
    <div className="glass-card min-h-screen border-r border-[#e0d2d8]/50 
      backdrop-blur-md bg-white/60 shadow-md">

      <div className="flex flex-col gap-4 pt-28 pl-[20%] text-[15px]">

        {/* Dashboard */}
        <NavLink
          className="flex items-center gap-3 px-4 py-2 rounded-l-lg border border-gray-200 border-r-0 
          hover:border-black hover:bg-gray-50 transition-all duration-300 group"
          to="/dashboard"
        >
          <img className="w-5 h-5 opacity-80 group-hover:opacity-100 transition"
            src={dashboard_icon} alt="Dashboard" />
          <p className="hidden md:block font-light tracking-wide text-gray-700 group-hover:text-black">
            Dashboard
          </p>
        </NavLink>

        {/* Add Items */}
        <NavLink
          className="flex items-center gap-3 px-4 py-2 rounded-l-lg border border-gray-200 border-r-0 
          hover:border-black hover:bg-gray-50 transition-all duration-300 group"
          to="/add"
        >
          <img className="w-5 h-5 opacity-80 group-hover:opacity-100 transition"
            src={add_icon} alt="Add" />
          <p className="hidden md:block font-light tracking-wide text-gray-700 group-hover:text-black">
            Add Items
          </p>
        </NavLink>

        {/* List Items */}
        <NavLink
          className="flex items-center gap-3 px-4 py-2 rounded-l-lg border border-gray-200 border-r-0 
          hover:border-black hover:bg-gray-50 transition-all duration-300 group"
          to="/list"
        >
          <img className="w-5 h-5 opacity-80 group-hover:opacity-100 transition"
            src={list_icon} alt="List" />
          <p className="hidden md:block font-light tracking-wide text-gray-700 group-hover:text-black">
            List Items
          </p>
        </NavLink>

        {/* Orders */}
        <NavLink
          className="flex items-center gap-3 px-4 py-2 rounded-l-lg border border-gray-200 border-r-0 
          hover:border-black hover:bg-gray-50 transition-all duration-300 group"
          to="/orders"
        >
          <img className="w-5 h-5 opacity-80 group-hover:opacity-100 transition"
            src={order_icon} alt="Orders" />
          <p className="hidden md:block font-light tracking-wide text-gray-700 group-hover:text-black">
            Orders
          </p>
        </NavLink>

        {/* ⭐ NEW: Analytics */}
        <NavLink
          className="flex items-center gap-3 px-4 py-2 rounded-l-lg border border-gray-200 border-r-0 
          hover:border-black hover:bg-gray-50 transition-all duration-300 group"
          to="/analytics"
        >
          <img className="w-5 h-5 opacity-80 group-hover:opacity-100 transition"
            src={analytics_icon} alt="Analytics" />
          <p className="hidden md:block font-light tracking-wide text-gray-700 group-hover:text-black">
            Analytics
          </p>
        </NavLink>

          <NavLink
          className="flex items-center gap-3 px-4 py-2 rounded-l-lg border border-gray-200 border-r-0 
          hover:border-black hover:bg-gray-50 transition-all duration-300 group"
          to="/Coupons"
        >
          <img className="w-5 h-5 opacity-80 group-hover:opacity-100 transition"
            src={tag_icon} alt="Coupons" />
          <p className="hidden md:block font-light tracking-wide text-gray-700 group-hover:text-black">
            Coupons
          </p>
        </NavLink>

            <NavLink
          className="flex items-center gap-3 px-4 py-2 rounded-l-lg border border-gray-200 border-r-0 
          hover:border-black hover:bg-gray-50 transition-all duration-300 group"
          to="/Complaints"
        >
          <img className="w-5 h-5 opacity-80 group-hover:opacity-100 transition"
            src={comp_icon} alt="Complaints" />
          <p className="hidden md:block font-light tracking-wide text-gray-700 group-hover:text-black">
            Complaints
          </p>
        </NavLink>

      </div>
    </div>
  );
};

export default Sidebar;
