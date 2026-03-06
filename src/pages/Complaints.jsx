// admin/src/pages/Complaints.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import {
  AlertCircle, RotateCcw, CreditCard, ChevronDown,
  MessageSquare, Clock, CheckCircle2, XCircle, Eye,
  TrendingUp, Filter, Package
} from 'lucide-react';

const TYPE_CONFIG = {
  complaint: { label: 'Complaint', icon: AlertCircle, dot: '#f97316' },
  return:    { label: 'Return',    icon: RotateCcw,   dot: '#3b82f6' },
  refund:    { label: 'Refund',    icon: CreditCard,  dot: '#22c55e' },
};

const STATUS_CONFIG = {
  open:      { label: 'Open',      icon: Clock,        bar: '#fbbf24' },
  in_review: { label: 'In Review', icon: Eye,          bar: '#60a5fa' },
  resolved:  { label: 'Resolved',  icon: CheckCircle2, bar: '#4ade80' },
  rejected:  { label: 'Rejected',  icon: XCircle,      bar: '#f87171' },
};

// Animated counter hook
const useCount = (target, duration = 800) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
};

// Stat card with animated number
const StatCard = ({ label, value, color, isActive, onClick }) => {
  const animated = useCount(value);
  return (
    <button
      type="button"
      onClick={onClick}
      className="stat-card group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden"
      style={{
        background: isActive ? '#111' : '#fff',
        borderColor: isActive ? '#111' : '#e5e7eb',
        boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
        style={{ width: isActive ? '100%' : '0%', background: color }}
      />
      <span className="text-xs font-semibold tracking-widest uppercase mb-3"
        style={{ color: isActive ? '#9ca3af' : '#9ca3af' }}>
        {label}
      </span>
      <span className="text-4xl font-bold tabular-nums leading-none"
        style={{ color: isActive ? '#fff' : '#111', fontFamily: "'Playfair Display', serif" }}>
        {animated}
      </span>
    </button>
  );
};

const Complaints = ({ token }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef(null);

  const glassToast = (message, type = 'info') =>
    toast[type](message, {
      style: {
        background: 'rgba(15,15,15,0.85)', color: '#fff',
        backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '14px', fontFamily: "'DM Sans', sans-serif", padding: '12px 18px',
      },
      progressStyle: { background: '#fff' },
      icon: false, autoClose: 2200, position: 'top-right',
    });

  useEffect(() => {
    fetchComplaints();
    setTimeout(() => setMounted(true), 50);
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/complaint/list`, {},
        { headers: { token } }
      );
      if (res.data.success) {
        setComplaints(res.data.complaints);
        const notes = {};
        res.data.complaints.forEach(c => { notes[c._id] = c.adminNote || ''; });
        setAdminNotes(notes);
      }
    } catch (err) {
      glassToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (complaintId, status) => {
    setUpdatingId(complaintId);
    try {
      const res = await axios.post(
        `${backendUrl}/api/complaint/update-status`,
        { complaintId, status, adminNote: adminNotes[complaintId] || '' },
        { headers: { token } }
      );
      if (res.data.success) {
        glassToast(`Marked as ${STATUS_CONFIG[status].label}`, 'success');
        fetchComplaints();
      } else {
        glassToast(res.data.message, 'error');
      }
    } catch (err) {
      glassToast(err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const filtered = complaints.filter(c => {
    const statusOk = filterStatus === 'all' || c.status === filterStatus;
    const typeOk = filterType === 'all' || c.type === filterType;
    return statusOk && typeOk;
  });

  const counts = { open: 0, in_review: 0, resolved: 0, rejected: 0 };
  complaints.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  // Resolution rate
  const totalDone = counts.resolved + counts.rejected;
  const resolutionRate = complaints.length > 0
    ? Math.round((totalDone / complaints.length) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: '#f6f6f4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        .complaint-row {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .complaint-row:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.09);
          border-color: #d1d5db;
        }
        .stat-card:hover { transform: translateY(-2px); }

        .expand-body {
          animation: expandIn 0.25s ease forwards;
        }
        @keyframes expandIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .page-enter {
          animation: pageEnter 0.5s ease forwards;
        }
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .status-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .status-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.06);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .status-btn:not(:disabled):hover::after { opacity: 1; }
        .status-btn:not(:disabled):hover { transform: translateY(-1px); }

        .filter-chip {
          transition: all 0.2s ease;
        }
        .filter-chip:hover { border-color: #111; }

        .progress-bar {
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .type-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        textarea {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        textarea:focus {
          outline: none;
          border-color: #111 !important;
          box-shadow: 0 0 0 3px rgba(17,17,17,0.06);
        }

        /* Responsive table-like row */
        .complaint-meta {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .complaint-meta {
            grid-template-columns: auto 1fr;
          }
          .complaint-meta .chevron { display: none; }
        }
      `}</style>

      <div className={`max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 py-8 pt-12 ${mounted ? 'page-enter' : 'opacity-0'}`}>

        {/* ── Header ── */}
        <div className="mb-10">
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, marginBottom: '10px' }}>
            Admin Panel
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.1, color: '#111' }}>
              Customer <em>Requests</em>
            </h1>

            {/* Resolution rate badge */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm self-start sm:self-auto">
              <TrendingUp size={16} className="text-gray-400" />
              <div>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Resolution Rate</p>
                <p className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {resolutionRate}%
                </p>
              </div>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-gray-900 rounded-full progress-bar"
                  style={{ width: mounted ? `${resolutionRate}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <StatCard
              key={key}
              label={cfg.label}
              value={counts[key]}
              color={cfg.bar}
              isActive={filterStatus === key}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            />
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-gray-200 rounded-2xl px-4 sm:px-6 py-3 shadow-sm">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
            Filter
          </span>

          {/* Type chips */}
          <div className="flex flex-wrap gap-2 ml-1">
            {['all', 'complaint', 'return', 'refund'].map(t => {
              const cfg = TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className="filter-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                  style={{
                    background: filterType === t ? '#111' : '#fafaf8',
                    color: filterType === t ? '#fff' : '#374151',
                    borderColor: filterType === t ? '#111' : '#e5e7eb',
                  }}
                >
                  {t !== 'all' && (
                    <span className="type-dot" style={{ background: cfg.dot }} />
                  )}
                  {t === 'all' ? 'All Types' : cfg.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-gray-200 hidden sm:block" />

          {/* Status chips */}
          <div className="flex flex-wrap gap-2">
            {['all', ...Object.keys(STATUS_CONFIG)].map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s === 'all' ? 'all' : (filterStatus === s ? 'all' : s))}
                  className="filter-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                  style={{
                    background: filterStatus === s ? '#111' : '#fafaf8',
                    color: filterStatus === s ? '#fff' : '#374151',
                    borderColor: filterStatus === s ? '#111' : '#e5e7eb',
                  }}
                >
                  {s !== 'all' && (
                    <span className="type-dot" style={{ background: cfg.bar }} />
                  )}
                  {s === 'all' ? 'All Statuses' : cfg.label}
                </button>
              );
            })}
          </div>

          <span className="ml-auto text-xs text-gray-400 font-medium flex-shrink-0">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3" ref={listRef}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-2/5" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-3/5" />
                  </div>
                  <div className="w-16 h-6 rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-28 bg-white border border-gray-200 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-300" />
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#9ca3af', fontWeight: 400 }}>
              No requests found
            </p>
            <p className="text-xs text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3" ref={listRef}>
            {filtered.map((complaint, idx) => {
              const typeCfg = TYPE_CONFIG[complaint.type] || TYPE_CONFIG.complaint;
              const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.open;
              const TypeIcon = typeCfg.icon;
              const StatusIcon = statusCfg.icon;
              const isExpanded = expandedId === complaint._id;
              const isUpdating = updatingId === complaint._id;

              return (
                <div
                  key={complaint._id}
                  className="complaint-row bg-white border border-gray-100 rounded-2xl overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* ── Row Header ── */}
                  <div
                    className="complaint-meta px-4 sm:px-6 py-4 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : complaint._id)}
                  >
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {complaint.itemImage ? (
                        <img
                          src={complaint.itemImage}
                          alt={complaint.itemName}
                          className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl object-cover border border-gray-100"
                          style={{ width: 48, height: 48 }}
                        />
                      ) : (
                        <div className="flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100"
                          style={{ width: 48, height: 48 }}>
                          <Package size={18} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Type pill */}
                        <span
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{ background: '#fafaf8', borderColor: '#e5e7eb', color: '#374151' }}
                        >
                          <span className="type-dot" style={{ background: typeCfg.dot }} />
                          {typeCfg.label}
                        </span>
                        {/* Status pill */}
                        <span
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{ background: '#fafaf8', borderColor: '#e5e7eb', color: '#374151' }}
                        >
                          <span className="type-dot" style={{ background: statusCfg.bar }} />
                          {statusCfg.label}
                        </span>
                        {/* Order ref — hidden on xs */}
                        <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                          #{complaint.orderId?.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                        {complaint.itemName || 'Unknown Item'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {formatDate(complaint.createdAt)}
                        {complaint.itemPrice > 0 && (
                          <span className="ml-2 text-gray-500 font-medium">₹{complaint.itemPrice}</span>
                        )}
                      </p>
                    </div>

                    {/* Chevron */}
                    <div className="chevron flex-shrink-0 flex items-center">
                      <div
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-all duration-300"
                        style={{
                          background: isExpanded ? '#111' : '#fafaf8',
                          borderColor: isExpanded ? '#111' : '#e5e7eb',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        <ChevronDown size={14} style={{ color: isExpanded ? '#fff' : '#9ca3af' }} />
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded Panel ── */}
                  {isExpanded && (
                    <div className="expand-body border-t border-gray-100 px-4 sm:px-6 py-6 space-y-6"
                      style={{ background: '#fafaf8' }}>

                      {/* Message block */}
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, marginBottom: 10 }}>
                          Customer Message
                        </p>
                        <div
                          className="relative rounded-xl px-5 py-4 border"
                          style={{ background: '#fff', borderColor: '#e5e7eb' }}
                        >
                          <div
                            className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                            style={{ background: typeCfg.dot }}
                          />
                          <p className="text-sm text-gray-700 leading-relaxed pl-3">
                            {complaint.message}
                          </p>
                        </div>
                      </div>

                      {/* Detail grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Item Price', value: `₹${complaint.itemPrice}` },
                          { label: 'Order Ref', value: `#${complaint.orderId?.slice(-8).toUpperCase()}` },
                          { label: 'Submitted', value: formatDate(complaint.createdAt) },
                          complaint.resolvedAt
                            ? { label: 'Resolved', value: formatDate(complaint.resolvedAt) }
                            : { label: 'User ID', value: complaint.userId?.slice(-10) },
                        ].map((d, i) => (
                          <div
                            key={i}
                            className="rounded-xl px-4 py-3 border"
                            style={{ background: '#fff', borderColor: '#e5e7eb' }}
                          >
                            <p style={{ fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>
                              {d.label}
                            </p>
                            <p className="text-xs font-semibold text-gray-800 font-mono truncate">{d.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Admin response textarea */}
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, marginBottom: 10 }}>
                          Response / Resolution Note
                        </p>
                        <textarea
                          value={adminNotes[complaint._id] || ''}
                          onChange={e => setAdminNotes(prev => ({ ...prev, [complaint._id]: e.target.value }))}
                          placeholder="Write a response visible to the customer after status update…"
                          rows={3}
                          className="w-full px-4 py-3.5 rounded-xl border text-sm resize-none"
                          style={{
                            background: '#fff',
                            borderColor: '#e5e7eb',
                            color: '#111',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        />
                      </div>

                      {/* Status pipeline */}
                      <div>
                        <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600, marginBottom: 12 }}>
                          Update Status
                        </p>

                        {/* Visual pipeline bar */}
                        <div className="flex items-center gap-0 mb-5 overflow-x-auto pb-1">
                          {Object.entries(STATUS_CONFIG).map(([key, cfg], i, arr) => {
                            const isCurrent = complaint.status === key;
                            const statusOrder = ['open', 'in_review', 'resolved', 'rejected'];
                            const currentIdx = statusOrder.indexOf(complaint.status);
                            const thisIdx = statusOrder.indexOf(key);
                            const isPast = thisIdx < currentIdx && complaint.status !== 'rejected';
                            const Icon = cfg.icon;

                            return (
                              <React.Fragment key={key}>
                                <div className="flex flex-col items-center flex-shrink-0">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                                    style={{
                                      background: isCurrent ? '#111' : isPast ? '#f3f4f6' : '#fff',
                                      borderColor: isCurrent ? '#111' : isPast ? '#d1d5db' : '#e5e7eb',
                                    }}
                                  >
                                    <Icon size={13} style={{ color: isCurrent ? '#fff' : '#9ca3af' }} />
                                  </div>
                                  <span className="text-xs mt-1.5 font-medium whitespace-nowrap"
                                    style={{ color: isCurrent ? '#111' : '#9ca3af', fontSize: '0.65rem' }}>
                                    {cfg.label}
                                  </span>
                                </div>
                                {i < arr.length - 1 && (
                                  <div
                                    className="flex-1 h-px mx-1 mb-4 min-w-4"
                                    style={{ background: '#e5e7eb' }}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            const isCurrent = complaint.status === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={isCurrent || isUpdating}
                                onClick={() => updateStatus(complaint._id, key)}
                                className="status-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200"
                                style={{
                                  background: isCurrent ? '#111' : '#fff',
                                  color: isCurrent ? '#fff' : '#374151',
                                  borderColor: isCurrent ? '#111' : '#e5e7eb',
                                  opacity: isUpdating && !isCurrent ? 0.5 : 1,
                                  cursor: isCurrent ? 'default' : 'pointer',
                                }}
                              >
                                <span
                                  className="type-dot"
                                  style={{ background: isCurrent ? '#fff' : cfg.bar }}
                                />
                                <Icon size={12} />
                                {isUpdating && !isCurrent ? 'Saving…' : cfg.label}
                                {isCurrent && (
                                  <span className="ml-1 text-xs opacity-60">✓ Current</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaints;