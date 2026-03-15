import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Coupons from './pages/Coupons';
import Complaints from "./pages/Complaints";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "₹";

const App = () => {
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );

  useEffect(() => {
    localStorage.setItem("token", token);
  }, [token]);

  return (
    <div className="bg-white min-h-screen text-black font-['Outfit']">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastStyle={{
          background: "#fff",
          color: "#000",
          border: "1px solid #000",
          borderRadius: "10px",
          fontFamily: "Outfit",
          fontWeight: "500",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
        bodyStyle={{
          fontSize: "15px",
          letterSpacing: "0.3px",
        }}
      />

      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          {/* Fixed navbar — sits above everything */}
          <Navbar setToken={setToken} />

          {/* This spacer pushes content below the fixed navbar */}
          <div className="h-[56px] sm:h-[72px]" />

          <div className="flex w-full">

            {/* ── Sidebar ──
                mobile  : 0 width (Sidebar renders as fixed bottom tab bar)
                tablet  : 56px icon-only rail
                desktop : 18% full sidebar
                position: fixed on md+ so it never scrolls with content
            */}
            {/* Sidebar wrapper — always rendered so mobile bottom tab bar shows */}
            <div className="
              md:w-[56px]
              lg:w-[18%]
              md:fixed
              md:top-[56px] md:sm:top-[72px]
              md:left-0
              md:bottom-0
              flex-shrink-0
              z-40
            ">
              <Sidebar />
            </div>

            {/* ── Offset spacer so content doesn't hide under fixed sidebar on md+ ── */}
            <div className="hidden md:block md:w-[56px] lg:w-[18%] flex-shrink-0" />

            {/* ── Main content ──
                pb-28 on mobile  → clears the ~70px fixed bottom tab bar
                md:pb-6          → normal on tablet/desktop
            */}
            <div className="
              flex-1 min-w-0
              px-3 sm:px-6 lg:px-10
              pt-4 sm:pt-6
              pb-28 md:pb-6
              text-gray-700 text-base
            ">
              <Routes>
                <Route path="/dashboard"  element={<Dashboard  token={token} />} />
                <Route path="/add"        element={<Add        token={token} />} />
                <Route path="/list"       element={<List       token={token} />} />
                <Route path="/orders"     element={<Orders     token={token} />} />
                <Route path="/analytics"  element={<Analytics  token={token} />} />
                <Route path="/coupons"    element={<Coupons    token={token} />} />
                <Route path="/complaints" element={<Complaints token={token} />} />
              </Routes>
            </div>

          </div>
        </>
      )}

      {/* Safe-area inset for notched iPhones — prevents tab bar being cut off */}
      <style>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .md\\:hidden.fixed.bottom-0 {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
};

export default App;