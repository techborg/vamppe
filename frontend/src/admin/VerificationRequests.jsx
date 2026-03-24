import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';

const BADGE_TYPES = [
  { value: 'blue',   label: 'Verified', color: '#3b82f6' },
  { value: 'gold',   label: 'Creator',  color: '#f59e0b' },
  { value: 'purple', label: 'Official', color: '#8b5cf6' },
  { value: 'red',    label: 'Staff',    color: '#ef4444' },
];

const CATEGORIES = {
  creator:    { label: 'Creator',    color: '#f59e0b' },
  brand:      { label: 'Brand',      color: '#8b5cf6' },
  journalist: { label: 'Journalist', color: '#3b82f6' },
  athlete:    { label: 'Athlete',    color: '#22c55e' },
  other:      { label: 'Other',      color: '#6b7280' },
};

const STATUS_TABS = ['pending', 'approved', 'rejected'];

function ReviewModal({ user, onClose, onDone }) {
  const [badgeType, setBadgeType] = useState('blue');
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState('approve'); // approve | reject
  const [loading, setLoading] = useState(false);

  const req = user.verificationRequest;

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'approve') {
        await api.post(`/admin/verification-requests/${user._id}/approve`, { badgeType });
      } else {
        await api.post(`/admin/verification-requests/${user._id}/reject`, { reason: rejectReason });
      }
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: '#0f0f16', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white">Review request</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar src={user.profilePicture} size={12} />
            <div>
              <p className="font-semibold text-white">{user.displayName || user.username}</p>
              <p className="text-gray-500 text-xs">@{user.username} · {user.email}</p>
            </div>
          </div>

          {/* Request details */}
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Row label="Full name" value={req.fullName} />
            <Row label="Category" value={
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: `${CATEGORIES[req.category]?.color || '#6b7280'}18`, color: CATEGORIES[req.category]?.color || '#6b7280' }}>
                {CATEGORIES[req.category]?.label || req.category}
              </span>
            } />
            <Row label="Reason" value={req.reason} multiline />
            {req.links && <Row label="Links" value={req.links} multiline />}
            <Row label="Submitted" value={format(req.submittedAt)} />
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {['approve', 'reject'].map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-semibold transition-all capitalize"
                style={{
                  background: mode === m ? (m === 'approve' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : 'transparent',
                  color: mode === m ? (m === 'approve' ? '#22c55e' : '#f87171') : '#6b7280',
                }}>
                {m === 'approve' ? '✓ Approve' : '✕ Reject'}
              </button>
            ))}
          </div>

          {/* Approve — badge picker */}
          {mode === 'approve' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Badge type</p>
              <div className="grid grid-cols-2 gap-2">
                {BADGE_TYPES.map((b) => (
                  <button key={b.value} onClick={() => setBadgeType(b.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: badgeType === b.value ? `${b.color}18` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${badgeType === b.value ? b.color + '40' : 'rgba(255,255,255,0.07)'}`,
                      color: badgeType === b.value ? b.color : '#6b7280',
                    }}>
                    <VerifiedBadge type={b.value} size={14} />
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reject — reason */}
          {mode === 'reject' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejection reason (optional)</p>
              <textarea
                className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                rows={3}
                placeholder="Tell the user why their request was declined…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={onClose} className="btn-ghost text-sm py-2 px-4">Cancel</button>
            <button onClick={submit} disabled={loading}
              className="text-sm font-semibold py-2 px-5 rounded-xl text-white transition-all"
              style={{
                background: mode === 'approve' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${mode === 'approve' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: mode === 'approve' ? '#22c55e' : '#f87171',
              }}>
              {loading
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing…</span>
                : mode === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, multiline }) {
  return (
    <div className={`flex ${multiline ? 'flex-col gap-1' : 'items-center justify-between gap-4'}`}>
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex-shrink-0">{label}</span>
      {typeof value === 'string'
        ? <span className={`text-sm text-gray-300 ${multiline ? '' : 'text-right'}`}>{value}</span>
        : value}
    </div>
  );
}

export default function VerificationRequests() {
  const [tab, setTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const navigate = useNavigate();

  const fetchRequests = async (status) => {
    setLoading(true);
    const res = await api.get(`/admin/verification-requests?status=${status}`);
    setRequests(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(tab); }, [tab]);

  const handleDone = () => {
    setReviewing(null);
    fetchRequests(tab);
  };

  const statusStyle = {
    pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
    approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
    rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Verification Requests</h1>
        <p className="text-gray-600 text-sm mt-0.5">Review and approve badge requests from users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              background: tab === s ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === s ? '#fff' : '#6b7280',
            }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center text-gray-600">No {tab} requests</div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((u) => {
            const req = u.verificationRequest;
            const cat = CATEGORIES[req.category];
            const st = statusStyle[req.status];
            return (
              <div key={u._id} className="rounded-2xl p-4 flex items-center gap-4 transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>

                <Avatar src={u.profilePicture} size={12} onClick={() => navigate(`/${u.username}`)} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{u.displayName || u.username}</p>
                    {u.verified && <VerifiedBadge type={u.verifiedType || 'blue'} size={13} />}
                    <span className="text-gray-600 text-xs">@{u.username}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${cat?.color || '#6b7280'}15`, color: cat?.color || '#6b7280' }}>
                      {cat?.label || req.category}
                    </span>
                    <span className="text-gray-500 text-xs truncate max-w-xs">{req.reason}</span>
                  </div>
                  {req.status === 'rejected' && req.rejectionReason && (
                    <p className="text-xs text-red-400/70 mt-1">Reason: {req.rejectionReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {req.status}
                  </span>
                  <span className="text-gray-600 text-xs">{format(req.submittedAt)}</span>
                  {tab === 'pending' && (
                    <button onClick={() => setReviewing(u)}
                      className="btn-ghost text-xs py-1.5 px-3">
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewing && (
        <ReviewModal user={reviewing} onClose={() => setReviewing(null)} onDone={handleDone} />
      )}
    </div>
  );
}
