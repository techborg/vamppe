import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import VamppeLogo from '../components/VamppeLogo';
import SEOHead from '../components/SEOHead';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <SEOHead title="Create account" description="Join Vamppe — the modern social platform." url="/register" noIndex />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.09) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[300px] h-[200px] rounded-full blur-[70px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        <div className="glass rounded-3xl p-8">
          <div className="flex justify-center mb-7">
            <VamppeLogo size={44} />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-1">Join Vamppe</h1>
          <p className="text-gray-600 text-sm text-center mb-7">It only takes a moment</p>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm mb-5 animate-slide-up"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input className="input-field" placeholder="Username"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <input className="input-field" type="email" placeholder="Email address"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="input-field" type="password" placeholder="Password (min 6 chars)"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="submit" disabled={loading} className="btn-primary py-3 mt-1 text-base w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already on Vamppe?{' '}
            <Link to="/login" className="text-pulse-400 hover:text-pulse-500 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
