import React from "react";
import { NavLink } from "react-router-dom";
import dashboard_icon from "../assets/dashboard_icon.png";
import add_icon from "../assets/add_icon.png";
import order_icon from "../assets/order_icon.png";
import list_icon from "../assets/list_icon.png";
import analytics_icon from "../assets/analytics_icon.png";
import tag_icon from "../assets/tag_icon.png";
import comp_icon from "../assets/comp_icon.png";

const navItems = [
  { to: "/dashboard",  icon: dashboard_icon,  label: "Dashboard"  },
  { to: "/add",        icon: add_icon,         label: "Add Items"  },
  { to: "/list",       icon: list_icon,        label: "List Items" },
  { to: "/orders",     icon: order_icon,       label: "Orders"     },
  { to: "/analytics",  icon: analytics_icon,   label: "Analytics"  },
  { to: "/coupons",    icon: tag_icon,         label: "Coupons"    },
  { to: "/complaints", icon: comp_icon,        label: "Complaints" },
];

const Sidebar = () => {
  return (
    <>
      {/* ─────────────────────────────────────────
          DESKTOP (lg+): Full sidebar — icon + label
          TABLET  (md):  Icon-only slim rail
          MOBILE  (<md): Hidden — bottom tab bar used instead
      ───────────────────────────────────────── */}
      <div className="hidden md:flex flex-col glass-card min-h-screen border-r border-[#e0d2d8]/50
        backdrop-blur-md bg-white/60 shadow-md w-full">
        <div className="flex flex-col gap-3 pt-28 px-2 lg:pl-[18%] lg:pr-0">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-l-lg border border-r-0 
                transition-all duration-300 group
                ${isActive
                  ? "border-black bg-gray-100 text-black"
                  : "border-gray-200 hover:border-black hover:bg-gray-50 text-gray-700"
                }`
              }
            >
              <img
                className="w-5 h-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition"
                src={icon}
                alt={label}
              />
              <p className="hidden lg:block font-light tracking-wide text-sm whitespace-nowrap">
                {label}
              </p>
            </NavLink>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────
          MOBILE (<md): Fixed bottom tab bar
          ✅ env(safe-area-inset-bottom) handles notched iPhones
             so the bar never gets cut off by the home indicator
      ───────────────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50
          bg-white/95 backdrop-blur-lg border-t border-gray-200
          shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200
                ${isActive ? "bg-black" : "hover:bg-gray-100"}`
              }
            >
              {({ isActive }) => (
                <>
                  <img
                    src={icon}
                    alt={label}
                    className="w-5 h-5 flex-shrink-0 transition-all duration-200"
                    style={{
                      filter: isActive ? "invert(1)" : "none",
                      opacity: isActive ? 1 : 0.55,
                    }}
                  />
                  <span
                    className="text-[9px] font-medium tracking-wide leading-none transition-colors duration-200"
                    style={{ color: isActive ? "#fff" : "#9ca3af" }}
                  >
                    {label.split(" ")[0]}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;