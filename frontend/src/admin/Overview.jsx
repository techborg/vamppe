import { useEffect, useState } from 'react';
import api from '../utils/api';

const StatCard = ({ label, value, sub, color = '#f97316' }) => (
  <div className="rounded-2xl p-5 flex flex-col gap-1"
    style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
    <p className="text-3xl font-black text-white">{value ?? '—'}</p>
    {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
  </div>
);

export default function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Overview</h1>
        <p className="text-gray-600 text-sm mt-1">Platform health at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total Users"     value={stats?.users}         sub={`+${stats?.newUsersToday ?? 0} today`} />
        <StatCard label="Total Posts"     value={stats?.posts}         sub={`+${stats?.newPostsToday ?? 0} today`} color="#a78bfa" />
        <StatCard label="Messages Sent"   value={stats?.messages}      color="#34d399" />
        <StatCard label="Verified Users"  value={stats?.verifiedUsers} sub="with badge" color="#f97316" />
        <StatCard label="New Users Today" value={stats?.newUsersToday} color="#fb923c" />
        <StatCard label="New Posts Today" value={stats?.newPostsToday} color="#a78bfa" />
      </div>

      <div className="rounded-2xl p-6" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="font-bold text-white mb-1">Quick actions</h2>
        <p className="text-gray-600 text-sm mb-4">Common admin tasks</p>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/users" className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(249,115,22,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(249,115,22,0.15)'}>
            Manage users →
          </a>
          <a href="/admin/posts" className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}>
            Moderate posts →
          </a>
        </div>
      </div>
    </div>
  );
}
