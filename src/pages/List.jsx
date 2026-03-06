import axios from "axios";
import React, { useEffect, useState } from "react";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { RotateCw, Package } from "lucide-react";

const SIZED_CATEGORIES = ["Shirt", "Jeans", "Combo", "Tshirt"];

// Must match Add.jsx and frontend size keys
const SIZE_KEYS = {
  Shirt:  ["S", "M", "L", "XL"],
  Tshirt: ["S", "M", "L", "XL"],
  Combo:  ["S", "M", "L", "XL"],
  Jeans:  ["28", "30", "32", "34"],
};

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [editingStock, setEditingStock] = useState(null);
  const [draftStock, setDraftStock] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setList(response.data.products.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // ✅ Open stock editor — populate draft with current stock
  const openStockEditor = (item) => {
    const isSized = SIZED_CATEGORIES.includes(item.category);
    if (isSized) {
      const keys = SIZE_KEYS[item.category] || ["S", "M", "L", "XL"];
      const existing = (typeof item.stock === 'object' && item.stock !== null) ? item.stock : {};
      const draft = {};
      keys.forEach(k => { draft[k] = existing[k] ?? 0; });
      setDraftStock(draft);
    } else {
      setDraftStock({ simple: typeof item.stock === 'number' ? item.stock : 0 });
    }
    setEditingStock(item._id);
  };

  // ✅ Save stock to backend
  const saveStock = async (item) => {
    setUpdatingId(item._id);
    try {
      const isSized = SIZED_CATEGORIES.includes(item.category);
      let stockPayload;
      if (isSized) {
        const keys = SIZE_KEYS[item.category] || ["S", "M", "L", "XL"];
        stockPayload = {};
        keys.forEach(k => { stockPayload[k] = Number(draftStock[k]) || 0; });
      } else {
        stockPayload = Number(draftStock.simple) || 0;
      }

      const response = await axios.post(
        backendUrl + "/api/product/update-stock",
        { productId: item._id, stock: stockPayload },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Stock updated!");
        setEditingStock(null);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // ✅ Get stock display label for the list view
  const getStockDisplay = (item) => {
    const isSized = SIZED_CATEGORIES.includes(item.category);
    if (isSized && typeof item.stock === 'object' && item.stock !== null) {
      const entries = Object.entries(item.stock);
      const total = entries.reduce((s, [, v]) => s + (Number(v) || 0), 0);
      if (total === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700 border-red-300" };
      const low = entries.some(([, v]) => Number(v) > 0 && Number(v) <= 3);
      if (low) return { label: `⚠ Low (${total} left)`, color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
      return { label: `In Stock (${total})`, color: "bg-green-100 text-green-700 border-green-300" };
    } else {
      const qty = Number(item.stock) || 0;
      if (qty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700 border-red-300" };
      if (qty <= 5) return { label: `⚠ Low (${qty} left)`, color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
      return { label: `In Stock (${qty})`, color: "bg-green-100 text-green-700 border-green-300" };
    }
  };

  // Derived stats
  const totalProducts = list.length;
  const outOfStock = list.filter(item => {
    const isSized = SIZED_CATEGORIES.includes(item.category);
    const total = isSized && typeof item.stock === 'object' && item.stock !== null
      ? Object.values(item.stock).reduce((s, v) => s + (Number(v) || 0), 0)
      : Number(item.stock) || 0;
    return total === 0;
  }).length;
  const lowStock = list.filter(item => {
    const s = getStockDisplay(item);
    return s.label.startsWith("⚠");
  }).length;

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-gray-900 px-4 sm:px-8 md:px-12 pt-16 pb-16">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold mb-1">Admin Panel</p>
            <h2 className="text-3xl font-bold text-black tracking-tight">All Products</h2>
          </div>
          <button
            onClick={fetchList}
            className="flex items-center gap-2 border border-black bg-white px-5 py-2.5 rounded-full
            text-xs font-semibold text-black hover:bg-black hover:text-white transition-all duration-300
            w-full sm:w-auto justify-center tracking-widest uppercase"
            title="Refresh Products"
          >
            <RotateCw size={13} />
            Refresh
          </button>
        </div>

        {/* ── STAT STRIP ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: totalProducts, accent: "black" },
            { label: "Low Stock", value: lowStock, accent: "#b45309" },
            { label: "Out of Stock", value: outOfStock, accent: "#dc2626" },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-200 px-4 py-4 sm:py-5 text-center shadow-sm"
            >
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: accent }}>{value}</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── TABLE CARD ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Column Headers — desktop only */}
          <div className="hidden md:grid grid-cols-[72px_1fr_120px_90px_180px_56px] items-center
            px-6 py-3 bg-gray-50 border-b border-gray-200">
            {["Image", "Name", "Category", "Price", "Stock", ""].map((h, i) => (
              <span key={i} className={`text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 ${i === 5 ? "text-center" : ""}`}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
                <Package size={44} strokeWidth={1} />
                <p className="text-sm tracking-widest uppercase font-medium">No products yet</p>
              </div>
            ) : (
              list.map((item, index) => {
                const isSized = SIZED_CATEGORIES.includes(item.category);
                const stockDisplay = getStockDisplay(item);
                const isEditing = editingStock === item._id;

                return (
                  <div key={index}>

                    {/* ── PRODUCT ROW ── */}
                    <div
                      className={`grid grid-cols-1 md:grid-cols-[72px_1fr_120px_90px_180px_56px]
                        items-center gap-4 px-6 py-4 transition-colors duration-150
                        ${isEditing ? "bg-gray-50" : "hover:bg-gray-50/70"}`}
                    >

                      {/* Image */}
                      <div className="flex justify-center md:justify-start">
                        <img
                          className="w-14 h-14 object-cover rounded-xl border border-gray-100 shadow-sm"
                          src={item.image[0]}
                          alt={item.name}
                        />
                      </div>

                      {/* Name */}
                      <div className="text-center md:text-left">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                          {item.name}
                        </p>
                        {/* Mobile: show category + price inline */}
                        <div className="flex items-center justify-center md:hidden gap-2 mt-1">
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                          <span className="text-xs font-bold text-gray-800">{currency}{item.price}</span>
                        </div>
                      </div>

                      {/* Category — desktop */}
                      <div className="hidden md:block">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
                          {item.category}
                        </span>
                      </div>

                      {/* Price — desktop */}
                      <p className="hidden md:block text-sm font-bold text-gray-900">
                        {currency}{item.price}
                      </p>

                      {/* Stock + Edit button */}
                      <div className="flex flex-col items-center md:items-start gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide ${stockDisplay.color}`}>
                          {stockDisplay.label}
                        </span>
                        <button
                          onClick={() => isEditing ? setEditingStock(null) : openStockEditor(item)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border tracking-widest uppercase transition-all duration-200 ${
                            isEditing
                              ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                              : "bg-black text-white border-black hover:bg-white hover:text-black"
                          }`}
                        >
                          {isEditing ? "✕ Close" : "Edit Stock"}
                        </button>
                      </div>

                      {/* Delete */}
                      <div className="flex justify-center md:justify-center">
                        <button
                          onClick={() => removeProduct(item._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full
                          text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 text-sm font-bold"
                          title="Remove Product"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* ── STOCK EDITOR ── */}
                    {isEditing && (
                      <div className="mx-4 md:mx-6 mb-4 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">

                        {/* Editor header */}
                        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                          <Package size={14} className="text-gray-400" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                            Update Stock
                          </span>
                          <span className="text-xs text-gray-500 ml-1">— {item.name}</span>
                        </div>

                        {isSized ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                            {(SIZE_KEYS[item.category] || ["S", "M", "L", "XL"]).map((s) => (
                              <div key={s} className="flex flex-col items-center gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                  {s}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={draftStock[s] ?? 0}
                                  onChange={(e) =>
                                    setDraftStock((prev) => ({ ...prev, [s]: e.target.value }))
                                  }
                                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold
                                  text-center focus:outline-none focus:border-black bg-white transition-colors"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mb-5">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                              Total Quantity
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={draftStock.simple ?? 0}
                              onChange={(e) => setDraftStock({ simple: e.target.value })}
                              className="w-full sm:w-44 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold
                              focus:outline-none focus:border-black bg-white transition-colors"
                            />
                          </div>
                        )}

                        <button
                          onClick={() => saveStock(item)}
                          disabled={updatingId === item._id}
                          className="px-7 py-2.5 bg-black text-white text-xs font-bold rounded-full uppercase tracking-widest
                          hover:bg-white hover:text-black border-2 border-black transition-all duration-200 disabled:opacity-40"
                        >
                          {updatingId === item._id ? "Saving..." : "Save Stock"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Table footer */}
          {list.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                {list.length} product{list.length !== 1 ? "s" : ""} total
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default List;