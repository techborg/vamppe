import { useNavigate } from 'react-router-dom';
import VamppeLogo from '../components/VamppeLogo';
import SEOHead from '../components/SEOHead';

const Feature = ({ icon, title, desc, delay = '0ms' }) => (
  <div className="glass rounded-2xl p-5 flex gap-4 items-start animate-scale-in" style={{ animationDelay: delay }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(255,255,255,0.07)' }}>
      {icon}
    </div>
    <div>
      <p className="font-semibold text-sm text-white mb-1">{title}</p>
      <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <SEOHead
        description="Vamppe is a modern social platform to connect with people, share moments, discover trending content, and chat in real time."
        url="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Vamppe",
          "url": "https://vamppe.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": "https://vamppe.com/explore?q={search_term_string}" },
            "query-input": "required name=search_term_string"
          }
        }}
      />
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-5%] right-[10%] w-[400px] h-[250px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[-5%] w-[300px] h-[200px] rounded-full blur-[70px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(192,38,211,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-7 animate-scale-in">
          <div className="p-4 rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <VamppeLogo size={56} />
          </div>
        </div>

        <h1 className="text-[2.6rem] font-extrabold tracking-tight mb-3 animate-fade-in leading-tight">
          <span className="text-white">Welcome to </span>
          <span className="text-gradient">Vamppe</span>
        </h1>
        <p className="text-gray-500 text-base mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '60ms' }}>
          Share ideas, connect with people, and feel the rhythm of real conversations.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-base relative overflow-hidden transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #c026d3 50%, #8b5cf6 100%)', boxShadow: '0 4px 24px rgba(249,115,22,0.25)' }}
          >
            <span className="relative z-10">Create your account</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-xl font-medium text-gray-300 text-base transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            Sign in
          </button>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3 text-left">
          <Feature icon="✦" title="Real-time feed" desc="See posts from people you follow the moment they happen." delay="120ms" />
          <Feature icon="⚡" title="Instant messaging" desc="Chat with anyone, see who's online, no delays." delay="160ms" />
          <Feature icon="🔔" title="Smart activity" desc="Get notified when someone likes, replies, or follows you." delay="200ms" />
        </div>

        <p className="text-gray-700 text-xs mt-10">By joining, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}
