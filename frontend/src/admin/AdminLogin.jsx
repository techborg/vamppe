import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VamppeLogo from '../components/VamppeLogo';
import api from '../utils/api';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.isAdmin) navigate('/admin', { replace: true });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      if (!res.data.user?.isAdmin) {
        setError('Access denied. This account does not have admin privileges.');
        setLoading(false);
        return;
      }
      login(res.data.token, res.data.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#07070c' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <VamppeLogo size={48} />
          <div className="text-center">
            <p className="font-black text-xl text-white tracking-tight">Vamppe</p>
            <p className="text-xs font-semibold tracking-widest uppercase mt-0.5" style={{ color: '#f97316' }}>
              Admin Portal
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-7"
          style={{ background: '#0f0f16', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h1 className="text-lg font-bold text-white mb-1">Sign in to Admin</h1>
          <p className="text-gray-600 text-sm mb-6">Admin accounts only</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                placeholder="admin@vamppe.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all mt-1 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          <a href="/login" className="hover:text-gray-500 transition-colors">← Back to Vamppe</a>
        </p>
      </div>
    </div>
  );
}
