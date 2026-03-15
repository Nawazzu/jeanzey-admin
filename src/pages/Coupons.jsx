// admin/src/pages/Coupons.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Plus, Tag, Calendar, RotateCcw, Trash2, ToggleLeft, ToggleRight, X, Sparkles, CheckCircle2, Clock } from 'lucide-react';

const Coupons = ({ token }) => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    description: ''
  });

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
      progressStyle: { background: "#fff" },
      icon: false,
      autoClose: 2000,
      position: "top-right",
    });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/coupon/list`, {
        headers: { token }
      });
      if (response.data.success) {
        setCoupons(response.data.coupons);
      }
    } catch (error) {
      glassToast(error.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.value || !formData.validFrom || !formData.validUntil) {
      return glassToast('Please fill all required fields', 'error');
    }
    try {
      const response = await axios.post(
        `${backendUrl}/api/coupon/create`,
        formData,
        { headers: { token } }
      );
      if (response.data.success) {
        glassToast('Coupon created successfully!', 'success');
        setShowForm(false);
        setFormData({
          code: '', type: 'percentage', value: '', minOrderAmount: '',
          maxDiscount: '', usageLimit: '', validFrom: '', validUntil: '', description: ''
        });
        fetchCoupons();
      } else {
        glassToast(response.data.message, 'error');
      }
    } catch (error) {
      glassToast(error.message, 'error');
    }
  };

  const toggleCouponStatus = async (id, currentStatus) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/coupon/update`,
        { id, isActive: !currentStatus },
        { headers: { token } }
      );
      if (response.data.success) {
        glassToast('Coupon status updated', 'success');
        fetchCoupons();
      }
    } catch (error) {
      glassToast(error.message, 'error');
    }
  };

  const reactivateCoupon = async (id) => {
    setReactivatingId(id);
    try {
      const newValidUntil = new Date();
      newValidUntil.setDate(newValidUntil.getDate() + 30);
      const formatted = newValidUntil.toISOString().split('T')[0];

      const response = await axios.post(
        `${backendUrl}/api/coupon/update`,
        { id, isActive: true, validUntil: formatted },
        { headers: { token } }
      );

      if (response.data.success) {
        glassToast('✓ Coupon reactivated for 30 days!', 'success');
        setCoupons(prev =>
          prev.map(c =>
            c._id === id
              ? { ...c, isActive: true, validUntil: newValidUntil.toISOString() }
              : c
          )
        );
        await fetchCoupons();
      } else {
        glassToast(response.data.message || 'Failed to reactivate', 'error');
      }
    } catch (error) {
      glassToast(error.response?.data?.message || error.message, 'error');
    } finally {
      setReactivatingId(null);
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/coupon/delete`,
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        glassToast('Coupon deleted', 'success');
        fetchCoupons();
      }
    } catch (error) {
      glassToast(error.message, 'error');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const now = new Date();
  const activeCoupons = coupons.filter(c => c.isActive && new Date(c.validUntil) >= now);
  const inactiveCoupons = coupons.filter(c => !c.isActive || new Date(c.validUntil) < now);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-gray-900 font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        .coupon-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .coupon-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.09);
        }
        .coupon-card.active-card {
          border-top: 3px solid #111;
        }
        .coupon-card.inactive-card {
          border-top: 3px solid #d1d5db;
        }
        .dot-divider {
          border-top: 2px dashed #e5e7eb;
        }
        .hole-left {
          position: absolute;
          left: -11px; top: 50%;
          transform: translateY(-50%);
          width: 22px; height: 22px;
          background: #f9f9f9;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          z-index: 2;
        }
        .hole-right {
          position: absolute;
          right: -11px; top: 50%;
          transform: translateY(-50%);
          width: 22px; height: 22px;
          background: #f9f9f9;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          z-index: 2;
        }
        .form-slide {
          animation: formSlide 0.25s ease;
        }
        @keyframes formSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .section-eyebrow {
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 500;
        }
        .display-font {
          font-family: 'Playfair Display', serif;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 pt-14">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
          <div>
            <p className="section-eyebrow mb-3">Admin Panel</p>
            <h1 className="text-4xl sm:text-5xl font-light leading-none display-font">
              Coupon <span className="italic">Management</span>
            </h1>
            <div className="flex items-center gap-3 mt-5">
              <span className="flex items-center gap-2 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-pulse" />
                {activeCoupons.length} Active
              </span>
              <span className="flex items-center gap-2 bg-white border border-gray-200 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full">
                {inactiveCoupons.length} Inactive / Expired
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-200 text-sm tracking-wide shadow-md"
          >
            {showForm ? <><X size={15} /> Cancel</> : <><Sparkles size={15} /> New Coupon</>}
          </button>
        </div>

        {/* ── Create Form ── */}
        {showForm && (
          <div className="form-slide bg-white border border-gray-200 rounded-2xl p-8 mb-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Tag size={14} className="text-white" />
              </div>
              <h3 className="text-xl font-medium display-font italic">Create New Coupon</h3>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="section-eyebrow">Coupon Code *</label>
                <input type="text" value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., SAVE20"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm tracking-widest font-semibold placeholder:tracking-normal placeholder:font-normal"
                  required />
              </div>

              <div className="space-y-1.5">
                <label className="section-eyebrow">Discount Type *</label>
                <select value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="section-eyebrow">Discount Value * {formData.type === 'percentage' ? '(%)' : '(₹)'}</label>
                <input type="number" value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder={formData.type === 'percentage' ? '20' : '100'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm"
                  required />
              </div>

              <div className="space-y-1.5">
                <label className="section-eyebrow">Min Order Amount (₹)</label>
                <input type="number" value={formData.minOrderAmount}
                  onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                  placeholder="500"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm" />
              </div>

              {formData.type === 'percentage' && (
                <div className="space-y-1.5">
                  <label className="section-eyebrow">Max Discount Cap (₹)</label>
                  <input type="number" value={formData.maxDiscount}
                    onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                    placeholder="200"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="section-eyebrow">Usage Limit</label>
                <input type="number" value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="section-eyebrow">Valid From *</label>
                <input type="date" value={formData.validFrom}
                  onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm"
                  required />
              </div>

              <div className="space-y-1.5">
                <label className="section-eyebrow">Valid Until *</label>
                <input type="date" value={formData.validUntil}
                  onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm"
                  required />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="section-eyebrow">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Get 20% off on all products"
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm resize-none" />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="px-8 py-2.5 bg-black text-white rounded-full text-sm border border-black hover:bg-white hover:text-black active:bg-white active:text-black transition-all">
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Active Coupons ── */}
        {activeCoupons.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <p className="section-eyebrow">Active Coupons</p>
              <CheckCircle2 size={14} className="text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeCoupons.map(coupon => (
                <CouponCard
                  key={coupon._id}
                  coupon={coupon}
                  isExpired={false}
                  isReactivating={reactivatingId === coupon._id}
                  onToggle={toggleCouponStatus}
                  onDelete={deleteCoupon}
                  onReactivate={reactivateCoupon}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Inactive / Expired ── */}
        {inactiveCoupons.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <p className="section-eyebrow">Inactive &amp; Expired</p>
              <Clock size={14} className="text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {inactiveCoupons.map(coupon => {
                const isExpired = new Date(coupon.validUntil) < now;
                return (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    isExpired={isExpired}
                    isReactivating={reactivatingId === coupon._id}
                    onToggle={toggleCouponStatus}
                    onDelete={deleteCoupon}
                    onReactivate={reactivateCoupon}
                    formatDate={formatDate}
                  />
                );
              })}
            </div>
          </section>
        )}

        {coupons.length === 0 && (
          <div className="text-center py-32">
            <Tag size={36} className="mx-auto mb-4 text-gray-300" />
            <p className="text-2xl font-light text-gray-400 display-font italic">No coupons yet</p>
            <p className="text-sm text-gray-400 mt-2">Create your first coupon to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Coupon Card ──
const CouponCard = ({ coupon, isExpired, isReactivating, onToggle, onDelete, onReactivate, formatDate }) => {
  const isActive = coupon.isActive && !isExpired;
  const usagePct = coupon.usageLimit
    ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.usageLimit) * 100))
    : null;

  return (
    <div className={`coupon-card ${isActive ? 'active-card' : 'inactive-card'} bg-white border border-gray-200 rounded-2xl shadow-sm relative overflow-hidden`}>
      <div className="hole-left" />
      <div className="hole-right" />

      {/* Code + Discount strip */}
      <div className="px-6 pt-6 pb-4 dot-divider">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: isActive ? '#6b7280' : '#9ca3af', fontWeight: 500 }}>
              {isExpired ? 'Expired' : isActive ? 'Active' : 'Inactive'}
            </p>
            <h3 className="text-xl font-bold tracking-widest mt-1 truncate"
              style={{ color: isActive ? '#111' : '#9ca3af', fontFamily: "'DM Sans', sans-serif" }}>
              {coupon.code}
            </h3>
            {coupon.description && (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed italic line-clamp-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {coupon.description}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold leading-none"
              style={{ color: isActive ? '#111' : '#9ca3af', fontFamily: "'Playfair Display', serif" }}>
              {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {coupon.type === 'percentage' ? 'percent off' : 'flat off'}
            </p>
          </div>
        </div>
      </div>

      {/* Details strip */}
      <div className="px-6 py-4 space-y-3.5">
        <div className="space-y-2">
          {coupon.minOrderAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Min order</span>
              <span className="font-medium text-gray-700">₹{coupon.minOrderAmount}</span>
            </div>
          )}
          {coupon.maxDiscount && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Max discount</span>
              <span className="font-medium text-gray-700">₹{coupon.maxDiscount}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1"><Calendar size={11} /> Validity</span>
            <span className="font-medium text-gray-700">
              {formatDate(coupon.validFrom)} – {formatDate(coupon.validUntil)}
            </span>
          </div>
          {coupon.usageLimit && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Usage</span>
              <span className="font-medium text-gray-700">{coupon.usedCount || 0} / {coupon.usageLimit}</span>
            </div>
          )}
        </div>

        {/* Usage progress bar */}
        {usagePct !== null && (
          <div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePct}%`,
                  background: usagePct > 80 ? '#ef4444' : isActive ? '#111' : '#d1d5db'
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {isExpired ? (
            <button
              onClick={() => onReactivate(coupon._id)}
              disabled={isReactivating}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 bg-black text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw size={13} className={isReactivating ? 'spin' : ''} />
              {isReactivating ? 'Reactivating…' : 'Reactivate (+30 days)'}
            </button>
          ) : (
            <button
              onClick={() => onToggle(coupon._id, coupon.isActive)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                coupon.isActive
                  ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'bg-black border-black text-white hover:bg-gray-800'
              }`}
            >
              {coupon.isActive
                ? <><ToggleRight size={14} /> Deactivate</>
                : <><ToggleLeft size={14} /> Activate</>
              }
            </button>
          )}

          <button
            onClick={() => onDelete(coupon._id)}
            className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all duration-200"
            title="Delete coupon"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Coupons;