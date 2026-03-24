import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import VamppeLogo from '../components/VamppeLogo';
import SEOHead from '../components/SEOHead';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    api.get(`/auth/verify-email/${token}`)
      .then((res) => {
        login(res.data.token, res.data.user);
        setStatus('success');
        setTimeout(() => navigate('/home'), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SEOHead title="Verify email" noIndex />
      <div className="w-full max-w-sm animate-scale-in">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <VamppeLogo size={44} />
          </div>

          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-400 text-sm">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#22c55e" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-lg mb-1">Email verified</h2>
              <p className="text-gray-500 text-sm">Redirecting you to Vamppe…</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#f87171" strokeWidth={2.2} strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-lg mb-1">Link expired</h2>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <ResendForm />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResendForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/resend-verification', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <p className="text-sm text-green-400">Check your inbox for a new verification link.</p>
  );

  return (
    <form onSubmit={handleResend} className="flex flex-col gap-3">
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <input
        className="input-field text-sm"
        type="email"
        placeholder="Enter your email to resend"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading} className="btn-primary py-2.5 text-sm">
        {loading ? 'Sending…' : 'Resend verification email'}
      </button>
      <Link to="/login" className="text-gray-600 text-xs hover:text-gray-400 transition-colors">
        Back to login
      </Link>
    </form>
  );
}
