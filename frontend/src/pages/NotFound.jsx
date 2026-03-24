import { useNavigate } from 'react-router-dom';
import VamppeLogo from '../components/VamppeLogo';
import SEOHead from '../components/SEOHead';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      <SEOHead title="404 — Page not found" noIndex />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
      <div className="relative z-10 animate-scale-in">
        <VamppeLogo size={48} className="justify-center mb-6 opacity-50" />
        <p className="text-8xl font-black mb-3 text-gradient">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-600 text-sm mb-8">This page doesn't exist or was moved.</p>
        <button onClick={() => navigate('/home')} className="btn-primary px-8 py-2.5 text-sm">
          Back to home
        </button>
      </div>
    </div>
  );
}
