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
          <Navbar setToken={setToken} />
          <hr className="border-gray-200" />

          <div className="flex w-full">

            {/* ── Sidebar ──
                mobile  : 0 width (sidebar renders as bottom tab bar)
                tablet  : 56px icon-only rail
                desktop : 18% full sidebar
            */}
            <div className="
              w-0
              md:w-[56px]
              lg:w-[18%]
              sticky top-0 self-start h-screen
              flex-shrink-0
            ">
              <Sidebar />
            </div>

            {/* ── Main content ──
                mobile  : full width, padding-bottom for bottom tab bar
                tablet  : remaining width after 56px rail
                desktop : remaining width after 18% sidebar
            */}
            <div className="
              flex-1 min-w-0
              overflow-y-auto h-screen
              px-3 sm:px-6 lg:px-10
              py-6 lg:py-12
              pt-16 sm:pt-20
              pb-24 md:pb-6
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
    </div>
  );
};

export default App;