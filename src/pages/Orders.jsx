import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { Zap, RotateCw } from "lucide-react";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState("All");

  // 🔍 Search + debounce
  const [searchTerm, setSearchTerm] = useState("");
  const debounceRef = useRef(null);

  // Format date
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day}/${month}/${year} at ${hours}:${minutes} ${ampm}`;
  };

  // Toast styling
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

  // Fetch all orders (without toast on initial load)
  const fetchAllOrders = async (showToast = false) => {
    if (!token) return;
    try {
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        const sortedOrders = response.data.orders.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
        
        // Only show toast when explicitly refreshing
        if (showToast) {
          glassToast("Orders page refreshed", "success");
        }
      } else {
        glassToast(response.data.message, "error");
      }
    } catch (err) {
      glassToast(err.message, "error");
    }
  };

  // Refresh handler for button
  const handleRefresh = async () => {
    await fetchAllOrders(true);
  };

  // Update status
  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { token } }
      );
      if (response.data.success) {
        glassToast("Status updated successfully", "success");
        await fetchAllOrders(false);
      }
    } catch (error) {
      glassToast(error.response?.data?.message || error.message, "error");
    }
  };

  // Filter logic
  useEffect(() => {
    if (searchTerm.trim() !== "") return;

    if (filter === "All") setFilteredOrders(orders);
    else if (filter === "Cancelled")
      setFilteredOrders(
        orders.filter((o) => o.items.some((i) => i.status === "Cancelled"))
      );
    else if (filter === "Active")
      setFilteredOrders(
        orders.filter((o) =>
          o.items.some(
            (i) => i.status !== "Cancelled" && i.status !== "Delivered"
          )
        )
      );
    else if (filter === "Delivered")
      setFilteredOrders(
        orders.filter((o) =>
          o.items
            .filter((i) => i.status !== "Cancelled")
            .every((i) => i.status === "Delivered")
        )
      );
    else if (filter === "Priority")
      setFilteredOrders(
        orders.filter((o) => o.priorityDelivery === true)
      );
  }, [filter, orders, searchTerm]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (searchTerm.trim() === "") {
        if (filter === "All") setFilteredOrders(orders);
        return;
      }

      const term = searchTerm.toLowerCase();

      const result = orders.filter((order) => {
        return (
          order._id.toLowerCase().includes(term) ||
          order.address.firstName.toLowerCase().includes(term) ||
          order.address.lastName.toLowerCase().includes(term) ||
          order.address.phone.toLowerCase().includes(term) ||
          order.address.city.toLowerCase().includes(term) ||
          order.address.state.toLowerCase().includes(term) ||
          order.address.country.toLowerCase().includes(term)
        );
      });

      setFilteredOrders(result);
    }, 300);
  }, [searchTerm, orders]);

  useEffect(() => {
    fetchAllOrders(false);
  }, [token]);

  // Highlight text
  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(
      regex,
      `<mark style="background:#ffe58f; padding:2px 4px; border-radius:4px;">$1</mark>`
    );
  };

  // CSV Export
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      glassToast("No orders available to export", "error");
      return;
    }

    const csvHeader = [
      "Order ID",
      "Customer Name",
      "Phone",
      "City",
      "State",
      "Country",
      "Payment",
      "Subtotal",
      "Shipping",
      "Priority Fee",
      "Total",
      "Date",
      "Status",
    ];

    const rows = filteredOrders.map((order) => {
      const customerName = `${order.address.firstName} ${order.address.lastName}`;
      const paymentStatus = order.payment ? "Paid" : "Pending";
      const shipping = order.items.some((i) => i.status !== "Cancelled") ? 50 : 0;
      const priorityFee = order.priorityDelivery
        ? order.priorityDeliveryFee || 100
        : 0;

      const subtotal = order.items
        .filter((i) => i.status !== "Cancelled")
        .reduce((sum, i) => sum + i.price * i.quantity, 0);

      const total = subtotal + shipping + priorityFee;

      return [
        order._id,
        customerName,
        order.address.phone,
        order.address.city,
        order.address.state,
        order.address.country,
        paymentStatus,
        subtotal,
        shipping,
        priorityFee,
        total,
        formatDateTime(order.date),
        order.status,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [csvHeader, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "orders_export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-3 sm:px-5 md:px-8 py-8 pt-20">

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">

        {/* TITLE WITH REFRESH BUTTON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h3 className="text-2xl sm:text-3xl font-semibold border-b border-gray-300 pb-3 tracking-wide uppercase">
            Orders ({filteredOrders.length})
          </h3>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 border border-black bg-white px-4 py-2 rounded-full 
            text-sm font-medium text-black hover:bg-black hover:text-white transition-all duration-300 w-full sm:w-auto justify-center"
            title="Refresh Orders"
          >
            <RotateCw size={18} />
            Refresh
          </button>
        </div>

        {/* INLINE SEARCH + FILTERS + EXPORT */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

          {/* SEARCH BAR - LEFT INLINE */}
          <input
            type="text"
            placeholder="Search Order ID / Name / Phone / City"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg shadow-sm 
                       focus:ring-2 focus:ring-black focus:outline-none text-sm"
          />

          {/* FILTER BUTTONS */}
          {["All", "Active", "Priority", "Cancelled", "Delivered"].map(
            (filterOption) => (
              <button
                key={filterOption}
                onClick={() => {
                  setSearchTerm("");
                  setFilter(filterOption);
                }}
                className={`px-3 sm:px-4 py-2 text-sm font-medium rounded transition-all duration-300 ${
                  filter === filterOption
                    ? filterOption === "Priority"
                      ? "bg-yellow-500 text-white shadow-lg"
                      : "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filterOption === "Priority" ? "⚡ Priority" : filterOption}
              </button>
            )
          )}

          {/* EXPORT ORDERS BUTTON */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-black 
                       bg-black text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            Export Orders
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.map((order, index) => {
          const isPriority = order.priorityDelivery === true;

          const cancelledItems = order.items.filter(
            (item) => item.status === "Cancelled"
          );
          const activeItems = order.items.filter(
            (item) => item.status !== "Cancelled"
          );
          const hasCancelledItems = cancelledItems.length > 0;
          const hasActiveItems = activeItems.length > 0;

          const dynamicSubtotal = activeItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          const shippingFee = hasActiveItems ? 50 : 0;
          const priorityCharge =
            isPriority && hasActiveItems
              ? order.priorityDeliveryFee || 100
              : 0;

          const dynamicTotal =
            dynamicSubtotal + shippingFee + priorityCharge;

          return (
            <div
              key={index}
              className={`border-2 rounded-xl p-5 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 ${
                isPriority
                  ? "border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-4 border-b border-gray-300 gap-3">

                {/* 🔍 ORDER ID WITH HIGHLIGHT */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p
                    className="font-mono text-sm font-medium text-gray-900 break-all"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(order._id),
                    }}
                  ></p>

                  {/* cancellation badges */}
                  {hasCancelledItems && hasActiveItems && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-orange-100 border border-orange-400 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ⚠️ Partial Cancellation: {cancelledItems.length} of{" "}
                      {order.items.length} items cancelled
                    </div>
                  )}
                  {hasCancelledItems && !hasActiveItems && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-red-100 border border-red-400 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ❌ Fully Cancelled: All {order.items.length} items cancelled
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:items-end gap-2 text-center sm:text-right">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(order.date)}
                    </p>
                  </div>

                  {isPriority && (
                    <div className="flex items-center justify-center sm:justify-end gap-1 bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md animate-pulse">
                      <Zap size={14} fill="white" />
                      PRIORITY DELIVERY - 24 HRS
                    </div>
                  )}
                </div>
              </div>

              {/* ITEMS WITH CANCELLATION REASON */}
              <div className="space-y-4 mb-6">
                {order.items.map((item, itemIndex) => {
                  const isCancelled = item.status === "Cancelled";
                  return (
                    <div
                      key={itemIndex}
                      className={`grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 items-start p-4 rounded-lg border-2 ${
                        isCancelled
                          ? "bg-red-50 border-red-300"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <img
                        className={`w-16 h-16 object-cover rounded-md border-2 ${
                          isCancelled
                            ? "border-red-200 opacity-60"
                            : "border-gray-300"
                        }`}
                        src={item.image?.[0] || assets.parcel_icon}
                        alt={item.name}
                      />

                      <div className="w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900 break-words">
                            {item.name}
                          </p>
                          {isCancelled && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                              CANCELLED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Qty:{" "}
                          <span className="font-medium">{item.quantity}</span> •
                          Size:{" "}
                          <span className="font-medium">
                            {item.size || "Regular"}
                          </span>
                        </p>
                        <p className="text-base font-bold text-gray-900 mb-2">
                          {currency}
                          {item.price * item.quantity}
                        </p>
                        
                        {/* ✅ CANCELLATION REASON DISPLAY */}
                        {isCancelled && item.cancellationReason && (
                          <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-600 rounded-md shadow-sm">
                            <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                              <span>❌</span> Cancellation Reason:
                            </p>
                            <p className="text-sm text-red-900 font-medium leading-relaxed">
                              {item.cancellationReason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1.5 text-xs font-bold rounded ${
                            isCancelled
                              ? "bg-red-600 text-white"
                              : item.status === "Delivered"
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {item.status || order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg border-2 border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    Customer
                  </p>
                  <p className="font-bold text-gray-900 text-base">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 font-medium break-words">
                    {order.address.phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    Delivery Address
                  </p>
                  <p className="text-sm text-gray-800 font-medium">
                    {order.address.street}
                  </p>
                  <p className="text-sm text-gray-700">
                    {order.address.city}, {order.address.state}
                  </p>
                  <p className="text-sm text-gray-700">
                    {order.address.country} - {order.address.zipcode}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    Payment
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {order.paymentMethod}
                  </p>
                  <p
                    className={`text-sm font-bold mt-1 ${
                      order.payment ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {order.payment ? "✓ Paid" : "⏳ Pending"}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="mb-6 p-4 bg-white rounded-lg border-2 border-gray-200">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">
                  Order Breakdown{" "}
                  {hasCancelledItems && (
                    <span className="text-orange-600">
                      (Updated after cancellations)
                    </span>
                  )}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      {currency}
                      {dynamicSubtotal}
                    </span>
                  </div>

                  {hasCancelledItems && (
                    <div className="flex justify-between text-sm text-red-600 bg-red-50 -mx-2 px-2 py-1 rounded">
                      <span>❌ Cancelled Items Value:</span>
                      <span className="font-medium line-through">
                        {currency}
                        {cancelledItems.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping Fee:</span>
                    <span className="font-medium text-gray-900">
                      {currency}
                      {shippingFee}
                    </span>
                  </div>

                  {isPriority && hasActiveItems && (
                    <div className="flex justify-between text-sm bg-yellow-50 -mx-2 px-2 py-1 rounded">
                      <span className="text-gray-900 flex items-center gap-1 font-medium">
                        <Zap
                          size={14}
                          className="text-yellow-600"
                          fill="#ca8a04"
                        />
                        Priority Delivery (24hrs):
                      </span>
                      <span className="font-bold text-yellow-700">
                        {currency}
                        {priorityCharge}
                      </span>
                    </div>
                  )}

                  <hr className="my-2" />

                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-900">Current Total:</span>
                    <span className="text-gray-900">{currency}{dynamicTotal}</span>
                  </div>

                  {hasCancelledItems && (
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>Original Total:</span>
                      <span className="line-through">
                        {currency}
                        {order.amount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update - Only show if there are active items */}
              {hasActiveItems ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t-2 border-gray-300">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                      Update Order Status
                    </p>
                    <select
                      onChange={(event) => statusHandler(event, order._id)}
                      value={order.status}
                      className="px-4 py-2.5 rounded-md text-sm font-bold bg-black text-white border-2 border-gray-800 
                      focus:outline-none focus:ring-2 focus:ring-black cursor-pointer transition-all duration-300 hover:bg-gray-900 min-w-[180px]"
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Packing">Packing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              ) : (
                hasCancelledItems && (
                  <div className="pt-4 border-t-2 border-gray-300">
                    <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-md">
                      <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                        <span className="text-lg">❌</span>
                        All items in this order have been cancelled. No further action required.
                      </p>
                    </div>
                  </div>
                )
              )}

            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl font-light">
              {searchTerm
                ? `No orders found with this search`
                : `No ${filter.toLowerCase()} orders found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;