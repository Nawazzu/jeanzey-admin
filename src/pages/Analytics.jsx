/*
  Analytics.jsx — Map Removed, Animated Charts + Filters + Expand-In-Page
*/

import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Currency formatter
const formatCurrency = (v) => `${currency}${Number(v).toLocaleString()}`;

const TIMEFRAMES = {
  TODAY: "Today",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

const Analytics = ({ token }) => {
  const [allOrders, setAllOrders] = useState([]); // full fetched orders
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [realtimeRecent, setRealtimeRecent] = useState([]);
  const pollingRef = useRef(null);
  const navigate = useNavigate();

  // UI state
  const [timeframe, setTimeframe] = useState(TIMEFRAMES.WEEKLY);
  const [expandedChart, setExpandedChart] = useState(null); // "sales" | "payments" | "products" | null

  const glassToast = (message, type = "info") =>
    toast[type](message, {
      style: {
        background: "rgba(15,15,15,0.75)",
        color: "#fff",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "16px",
        fontFamily: "Poppins, sans-serif",
        padding: "12px 16px",
      },
      autoClose: 2000,
      position: "top-right",
    });

  const fetchAll = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [pRes, oRes] = await Promise.all([
        axios.get(`${backendUrl}/api/product/list`),
        axios.post(`${backendUrl}/api/order/list`, {}, { headers: { token } }),
      ]);

      const fetchedProducts = pRes.data.products || [];
      const fetchedOrders = oRes.data.orders || [];

      setProducts(fetchedProducts);
      setAllOrders(
        fetchedOrders.sort((a, b) => new Date(b.date) - new Date(a.date))
      );

      computeStats(fetchedProducts, fetchedOrders);
    } catch (err) {
      console.error(err);
      glassToast("Failed to fetch analytics data", "error");
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (productList, orderList) => {
    const totalProducts = productList.length;
    const totalOrders = orderList.length;
    const delivered = orderList.filter((o) => o.status === "Delivered").length;
    const pending = orderList.filter((o) => o.status !== "Delivered").length;
    const cancelled = orderList.filter((o) =>
      o.items.some((i) => i.status === "Cancelled")
    ).length;
    const totalSales = orderList
      .filter((o) => o.payment)
      .reduce((s, o) => s + (o.amount || 0), 0);

    setStats({ totalProducts, totalOrders, delivered, pending, cancelled, totalSales });
  };

  useEffect(() => {
    if (token) fetchAll();

    // Poll for realtime widget
    if (token) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await axios.post(
            `${backendUrl}/api/order/list`,
            {},
            { headers: { token } }
          );
          setRealtimeRecent((res.data.orders || []).slice(0, 6));
        } catch (e) {
          // ignore polling errors
        }
      }, 10000);
    }

    return () => clearInterval(pollingRef.current);
  }, [token]);

  // ----- Timeframe filtering helper -----
  const filterByTimeframe = (orders, tf) => {
    if (!tf) return orders;
    const now = new Date();
    let from;
    if (tf === TIMEFRAMES.TODAY) {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight today
    } else if (tf === TIMEFRAMES.WEEKLY) {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (tf === TIMEFRAMES.MONTHLY) {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      return orders;
    }
    return orders.filter((o) => new Date(o.date) >= from);
  };

  // filteredOrders used by charts & computed data
  const filteredOrders = useMemo(() => filterByTimeframe(allOrders, timeframe), [allOrders, timeframe]);

  // Line Chart Data (animated)
  const salesTrend = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const d = new Date(o.date);
      const key = `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!map[key]) map[key] = 0;
      if (o.payment) map[key] += o.amount || 0;
    });
    // sort dates chronologically
    const entries = Object.keys(map)
      .map((k) => ({ date: k, sales: Math.round(map[k]) }))
      .sort((a, b) => {
        const [ad, am] = a.date.split("/").map(Number);
        const [bd, bm] = b.date.split("/").map(Number);
        // naive but ok for short windows
        return new Date(am, ad) - new Date(bm, bd);
      });
    return entries;
  }, [filteredOrders]);

  // Pie Data
  const paymentBreakdown = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const key = o.paymentMethod || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Top Products
  const topProducts = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) =>
      (o.items || []).forEach((i) => {
        const name = i.name || "Unknown";
        map[name] = (map[name] || 0) + (i.quantity || 1);
      })
    );
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredOrders]);

  // helper to toggle expand-in-page for a chart
  const toggleExpand = (chartKey) => {
    setExpandedChart((prev) => (prev === chartKey ? null : chartKey));
    // scroll the chart into view when expanding
    setTimeout(() => {
      const el = document.getElementById(`chart-${chartKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please login to view analytics.</p>
      </div>
    );
  }

  // small helpers for animation props reused
  const lineProps = { animationDuration: 1000, isAnimationActive: true };
  const barProps = { animationDuration: 1000, isAnimationActive: true };
  const pieProps = { startAngle: 90, endAngle: -270 }; // spins in

  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-10 pt-16">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Analytics</h1>

        <div className="flex gap-2 items-center">
          {/* Timeframe Buttons */}
          <div className="flex items-center gap-2 mr-4">
            {Object.values(TIMEFRAMES).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  timeframe === tf ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAll}
            className="px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border border-black"
            title="Refresh data"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-black-100 rounded border hover:bg-gray-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-black text-white rounded-xl">
          <p className="text-sm">Total Products</p>
          <h2 className="text-2xl font-bold">{products.length}</h2>
        </div>
        <div className="p-5 bg-gray-100 rounded-xl">
          <p className="text-sm">Total Orders ({timeframe})</p>
          <h2 className="text-2xl font-bold">{filteredOrders.length}</h2>
        </div>
        <div className="p-5 bg-black text-white rounded-xl">
          <p className="text-sm">Total Sales</p>
          <h2 className="text-2xl font-bold">{formatCurrency(filteredOrders.reduce((s, o) => s + (o.payment ? (o.amount || 0) : 0), 0))}</h2>
        </div>
        <div className="p-5 bg-gray-100 rounded-xl">
          <p className="text-sm">Delivered</p>
          <h2 className="text-2xl font-bold">{filteredOrders.filter((o) => o.status === "Delivered").length}</h2>
        </div>
      </div>

      {/* Sales Trend (Expandable) */}
      <div
        id="chart-sales"
        className={`mb-6 p-6 bg-gray-50 rounded-xl border shadow transition-all ${expandedChart === "sales" ? "lg:col-span-2" : ""}`}
      >
        <div className="flex justify-between items-start mb-4 gap-4">
          <h3 className="text-lg font-semibold">Sales Trend ({timeframe})</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleExpand("sales")}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
            >
              {expandedChart === "sales" ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        <div className={expandedChart === "sales" ? "h-[520px]" : "h-56"}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `${currency}${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line
                {...lineProps}
                type="monotone"
                dataKey="sales"
                stroke="#0f172a"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods (Expandable) & Top Products (Expandable) side-by-side */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8`}>
        {/* Payment Methods */}
        <div
          id="chart-payments"
          className={`p-6 bg-gray-50 border rounded-xl shadow transition-all ${expandedChart === "payments" ? "h-[520px]" : ""}`}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Payment Methods ({timeframe})</h3>
            <div>
              <button
                onClick={() => toggleExpand("payments")}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
              >
                {expandedChart === "payments" ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          <div className={expandedChart === "payments" ? "h-[420px]" : "h-56 flex items-center"}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={expandedChart === "payments" ? 80 : 40}
                  outerRadius={expandedChart === "payments" ? 140 : 70}
                  {...pieProps}
                >
                  {paymentBreakdown.map((_, i) => (
                    <Cell key={i} fill={["#0ea5a4", "#60a5fa", "#f97316", "#a78bfa"][i % 4]} />
                  ))}
                </Pie>
                <Legend verticalAlign={expandedChart === "payments" ? "bottom" : "bottom"} />
                <Tooltip formatter={(v) => `${v} orders`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div
          id="chart-products"
          className={`p-6 bg-gray-50 border rounded-xl shadow transition-all ${expandedChart === "products" ? "h-[520px]" : ""}`}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Top Products ({timeframe})</h3>
            <div>
              <button
                onClick={() => toggleExpand("products")}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
              >
                {expandedChart === "products" ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          <div className={expandedChart === "products" ? "h-[420px]" : "h-56"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 6, right: 12, left: 8, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={180} />
                <Tooltip formatter={(v) => `${v} units`} />
                <Bar {...barProps} dataKey="count" radius={[6, 6, 6, 6]} fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Realtime Activity */}
      <div className="p-6 bg-gray-50 border rounded-xl shadow mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Realtime Orders Activity</h3>
          <div className="text-sm text-gray-500">Auto updates every 10s</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Latest orders</p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {realtimeRecent.map((o, i) => (
                <div
                  key={i}
                  className="p-3 bg-white border rounded flex items-start justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {o.address?.firstName} {o.address?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {o.items?.length} items • {currency}
                      {o.amount}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      o.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : o.status === "Cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              ))}
              {realtimeRecent.length === 0 && <p className="text-sm text-gray-500">No recent orders</p>}
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Quick Stats</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border rounded text-center">
                <p className="text-xs text-gray-500">Delivered</p>
                <h2 className="text-xl font-bold text-green-600">{filteredOrders.filter((o) => o.status === "Delivered").length}</h2>
              </div>
              <div className="p-3 bg-white border rounded text-center">
                <p className="text-xs text-gray-500">Pending</p>
                <h2 className="text-xl font-bold text-yellow-500">{filteredOrders.filter((o) => o.status !== "Delivered").length}</h2>
              </div>
              <div className="p-3 bg-white border rounded text-center">
                <p className="text-xs text-gray-500">Cancelled</p>
                <h2 className="text-xl font-bold text-red-500">{filteredOrders.filter((o) => o.items.some((i) => i.status === "Cancelled")).length}</h2>
              </div>
              <div className="p-3 bg-white border rounded text-center">
                <p className="text-xs text-gray-500">Orders</p>
                <h2 className="text-xl font-bold">{filteredOrders.length}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
