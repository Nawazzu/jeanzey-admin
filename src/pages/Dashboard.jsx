// ========== Dashboard.jsx (Fully Responsive) ==========
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { RotateCw } from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    totalSales: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const glassToast = (message, type = "info") =>
    toast[type](message, {
      style: {
        background: "rgba(15,15,15,0.75)",
        color: "#fff",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "16px",
        fontFamily: "Poppins, sans-serif",
        letterSpacing: "0.5px",
        padding: "12px 16px",
      },
      progressStyle: { background: "#fff" },
      icon: false,
      autoClose: 2000,
      position: "top-right",
    });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productRes, orderRes] = await Promise.all([
        axios.get(`${backendUrl}/api/product/list`),
        axios.post(`${backendUrl}/api/order/list`, {}, { headers: { token } }),
      ]);

      if (productRes.data.success && orderRes.data.success) {
        const products = productRes.data.products || [];
        const orders = orderRes.data.orders || [];

        const sortedOrders = [...orders].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        const delivered = sortedOrders.filter((o) => o.status === "Delivered");
        const pending = sortedOrders.filter((o) => o.status !== "Delivered");
        const cancelled = sortedOrders.filter((o) =>
          o.items.some((i) => i.status === "Cancelled")
        );

        // ✅ totalSales: only orders manually marked as Paid (payment === true)
        // — Recalculates from active items only (excludes cancelled)
        // — Subtracts coupon discounts, adds priority fee
        const totalSales = sortedOrders
          .filter((o) => o.payment === true)
          .reduce((sum, o) => {
            const activeItems = o.items.filter((i) => i.status !== "Cancelled");
            if (activeItems.length === 0) return sum;

            const activeSubtotal = activeItems.reduce(
              (s, i) => s + i.price * i.quantity,
              0
            );
            const shippingFee = 50;
            const priorityFee = o.priorityDelivery
              ? o.priorityDeliveryFee || 100
              : 0;
            const couponDiscount = o.couponDiscount || 0;

            return sum + activeSubtotal + shippingFee + priorityFee - couponDiscount;
          }, 0);

        setStats({
          totalProducts: products.length,
          totalOrders: sortedOrders.length,
          deliveredOrders: delivered.length,
          pendingOrders: pending.length,
          cancelledOrders: cancelled.length,
          totalSales,
        });

        setRecentOrders(sortedOrders.slice(0, 5));
        glassToast("Dashboard data refreshed", "success");
      } else {
        glassToast("Failed to fetch dashboard data", "error");
      }
    } catch (error) {
      console.error(error);
      glassToast("Error fetching dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} at ${hours}:${minutes}`;
  };

  const chartData = [
    { name: "Delivered", count: stats.deliveredOrders, color: "#16a34a" },
    { name: "Pending",   count: stats.pendingOrders,   color: "#facc15" },
    { name: "Cancelled", count: stats.cancelledOrders || 0, color: "#dc2626" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10 pt-12 sm:pt-16">

      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold border-b border-gray-300 pb-3 uppercase tracking-wide">
          Admin Dashboard
        </h2>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 border border-black bg-white px-4 py-2 rounded-full 
          text-sm font-medium text-black hover:bg-black hover:text-white transition-all duration-300 w-full sm:w-auto justify-center"
          title="Refresh Dashboard"
        >
          <RotateCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="p-6 bg-black text-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-base sm:text-lg font-medium">Total Products</h3>
          <p className="text-2xl sm:text-3xl font-semibold mt-2">{stats.totalProducts}</p>
        </div>
        <div className="p-6 bg-gray-100 text-gray-900 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-base sm:text-lg font-medium">Total Orders</h3>
          <p className="text-2xl sm:text-3xl font-semibold mt-2">{stats.totalOrders}</p>
        </div>
        <div className="p-6 bg-black text-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-base sm:text-lg font-medium">Delivered Orders</h3>
          <p className="text-2xl sm:text-3xl font-semibold mt-2">{stats.deliveredOrders}</p>
        </div>
        <div className="p-6 bg-gray-100 text-gray-900 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-base sm:text-lg font-medium">Pending Orders</h3>
          <p className="text-2xl sm:text-3xl font-semibold mt-2">{stats.pendingOrders}</p>
        </div>
      </div>

      {/* Total Sales */}
      <div className="mb-10 sm:mb-16 p-6 sm:p-8 bg-black text-white rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-lg sm:text-xl font-medium uppercase tracking-wider">
            Total Sales
          </h3>
          <p className="text-3xl sm:text-4xl font-bold mt-3">
            {currency}
            {stats.totalSales.toLocaleString()}
          </p>
        </div>
        <div className="text-gray-400 text-xs sm:text-sm text-center md:text-right">
          Paid orders only · excludes cancelled items · coupons deducted
        </div>
      </div>

      {/* Orders Overview Bar Chart */}
      <div className="mb-10 sm:mb-16 p-6 sm:p-8 bg-gray-50 border border-gray-200 rounded-2xl shadow-md">
        <h3 className="text-lg sm:text-xl font-semibold mb-6">Orders Overview</h3>
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#374151" />
              <YAxis stroke="#374151" allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#000"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                style={{ cursor: "pointer" }}
              >
                {chartData.map((entry, index) => (
                  <cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-md">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-300 text-gray-700 text-xs sm:text-sm">
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 text-xs sm:text-sm hover:bg-gray-100 transition-all"
                >
                  <td className="py-3 font-medium">
                    {order.address?.firstName} {order.address?.lastName}
                  </td>
                  <td className="py-3">{order.items?.length || 0}</td>
                  <td className="py-3 font-medium">
                    {currency}{order.amount}
                  </td>
                  <td
                    className={`py-3 font-semibold ${
                      order.status === "Delivered"
                        ? "text-green-600"
                        : order.status === "Cancelled"
                        ? "text-red-600"
                        : "text-gray-700"
                    }`}
                  >
                    {order.status}
                  </td>
                  <td className="py-3 text-gray-600">
                    {formatDateTime(order.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentOrders.length === 0 && (
            <p className="text-center text-gray-500 mt-4 text-sm">
              No recent orders available.
            </p>
          )}
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <button
            onClick={() => navigate("/orders")}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-black text-white text-xs sm:text-sm uppercase tracking-widest rounded-full 
            border border-black hover:bg-white hover:text-black 
            transition-all duration-300 shadow-md w-full sm:w-auto"
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;