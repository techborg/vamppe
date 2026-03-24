import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';

const BADGE_TYPES = [
  { value: 'none',   label: 'None',     color: '#6b7280' },
  { value: 'blue',   label: 'Verified', color: '#3b82f6' },
  { value: 'gold',   label: 'Creator',  color: '#f59e0b' },
  { value: 'purple', label: 'Official', color: '#8b5cf6' },
  { value: 'red',    label: 'Staff',    color: '#ef4444' },
];

const RoleBadge = ({ on, label, color }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
    style={{ background: on ? `${color}18` : 'rgba(255,255,255,0.05)', color: on ? color : '#6b7280', border: `1px solid ${on ? color + '30' : 'rgba(255,255,255,0.07)'}` }}>
    {label}
  </span>
);

const Toggle = ({ value, onChange, label, color = '#f97316' }) => (
  <button onClick={() => onChange(!value)}
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
    style={{ background: value ? `${color}18` : 'rgba(255,255,255,0.04)', color: value ? color : '#6b7280', border: `1px solid ${value ? color + '30' : 'rgba(255,255,255,0.08)'}` }}>
    {value ? '✓' : '○'} {label}
  </button>
);

// Badge type picker dropdown — uses fixed positioning to escape table overflow
function BadgePicker({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const cur = BADGE_TYPES.find((b) => b.value === (current || 'none')) || BADGE_TYPES[0];

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
        style={{ background: cur.value !== 'none' ? `${cur.color}18` : 'rgba(255,255,255,0.04)', color: cur.value !== 'none' ? cur.color : '#6b7280', border: `1px solid ${cur.value !== 'none' ? cur.color + '30' : 'rgba(255,255,255,0.08)'}` }}>
        {cur.value !== 'none' && <VerifiedBadge type={cur.value} size={11} />}
        {cur.label} ▾
      </button>
      {open && (
        <div ref={menuRef}
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.12)', minWidth: 140 }}>
          {BADGE_TYPES.map((b) => (
            <button key={b.value}
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={() => { onChange(b.value); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-left"
              style={{ color: b.value !== 'none' ? b.color : '#9ca3af' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}>
              {b.value !== 'none'
                ? <VerifiedBadge type={b.value} size={12} />
                : <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.15)' }} />}
              {b.label}
              {cur.value === b.value && <span className="ml-auto opacity-60">✓</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // userId to delete
  const navigate = useNavigate();

  const fetchUsers = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20 });
    if (q) params.set('q', q);
    const res = await api.get(`/admin/users?${params}`);
    setUsers((prev) => p === 1 ? res.data.users : [...prev, ...res.data.users]);
    setTotal(res.data.total);
    setPage(res.data.page);
    setHasMore(res.data.hasMore);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers('', 1); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(query, 1); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const patch = async (id, updates) => {
    const res = await api.patch(`/admin/users/${id}`, updates);
    setUsers((prev) => prev.map((u) => u._id === id ? res.data : u));
  };

  const deleteUser = async (id) => {
    await api.delete(`/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u._id !== id));
    setTotal((t) => t - 1);
    setConfirm(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="text-gray-600 text-sm mt-0.5">{total} total accounts</p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <circle cx="11" cy="11" r="7.5" /><path d="M21 21l-3.5-3.5" />
          </svg>
          <input
            className="pl-9 pr-4 py-2 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', width: 240 }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Table header */}
        <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"
          style={{ background: '#0f0f16', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span>User</span>
          <span>Email</span>
          <span>Roles</span>
          <span>Actions</span>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-600 text-sm">No users found</div>
        ) : (
          users.map((u) => (
            <div key={u._id}
              className="grid grid-cols-[2fr_2fr_1fr_auto] gap-4 items-center px-5 py-3.5 transition-colors"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: u.banned ? 'rgba(239,68,68,0.04)' : '' }}
              onMouseEnter={(e) => { if (!u.banned) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = u.banned ? 'rgba(239,68,68,0.04)' : ''; }}
            >
              {/* User */}
              <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={u.profilePicture} size={8} onClick={() => navigate(`/${u.username}`)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-white truncate">{u.username}</p>
                    {u.verified && <VerifiedBadge type={u.verifiedType || 'blue'} size={12} />}
                  </div>
                  <p className="text-gray-600 text-xs">{format(u.createdAt)}</p>
                </div>
              </div>

              {/* Email */}
              <p className="text-gray-400 text-sm truncate">{u.email}</p>

              {/* Roles */}
              <div className="flex flex-wrap gap-1.5">
                {u.isAdmin && <RoleBadge on label="Admin" color="#f97316" />}
                {u.verified && <RoleBadge on label={BADGE_TYPES.find(b => b.value === (u.verifiedType || 'blue'))?.label || 'Verified'} color={BADGE_TYPES.find(b => b.value === (u.verifiedType || 'blue'))?.color || '#3b82f6'} />}
                {u.banned && <RoleBadge on label="Banned" color="#f87171" />}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <BadgePicker current={u.verifiedType || (u.verified ? 'blue' : 'none')} onChange={(v) => patch(u._id, { verifiedType: v })} />
                <Toggle value={u.isAdmin} onChange={(v) => patch(u._id, { isAdmin: v })} label="Admin" color="#f97316" />
                <Toggle value={u.banned}  onChange={(v) => patch(u._id, { banned: v })}  label="Ban"   color="#f87171" />
                <button onClick={() => setConfirm(u._id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors hover:bg-red-400/8" title="Delete user">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={() => fetchUsers(query, page + 1)} className="btn-ghost text-sm px-6 py-2">
            Load more
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirm(null)}>
          <div className="rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg mb-2">Delete user?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently delete the user and all their posts. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
              <button onClick={() => deleteUser(confirm)}
                className="text-sm font-semibold py-2 px-4 rounded-xl text-white transition-all"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
