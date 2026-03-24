import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';

export default function RightPanel() {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [followed, setFollowed] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/suggestions').then((r) => setSuggestions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get(`/users/search?q=${query}`).then((r) => setResults(r.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleFollow = async (id) => {
    await api.post(`/users/follow/${id}`);
    setFollowed((p) => new Set([...p, id]));
    setSuggestions((s) => s.filter((u) => u._id !== id));
  };

  const displayed = query ? results : suggestions;

  return (
    <aside className="w-[300px] px-4 py-5 hidden lg:flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <div className="relative">
        <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <circle cx="11" cy="11" r="7.5" /><path d="M21 21l-3.5-3.5" />
        </svg>
        <input
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(249,115,22,0.4)'; e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.07)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.boxShadow = ''; }}
          placeholder="Search people…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* People card */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2.5 flex items-center justify-between border-b border-white/[0.05]">
          <h3 className="font-semibold text-sm text-gray-200">
            {query ? 'Results' : 'Who to follow'}
          </h3>
          {!query && suggestions.length > 0 && (
            <span className="text-[11px] text-gray-600 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              {suggestions.length} suggested
            </span>
          )}
        </div>

        {displayed.length === 0 && (
          <p className="text-gray-600 text-sm px-4 py-4">
            {query ? 'No one found' : 'Check back later'}
          </p>
        )}

        {displayed.slice(0, 5).map((u) => (
          <div
            key={u._id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = ''}
            onClick={() => navigate(`/${u.username}`)}
          >
            <Avatar src={u.profilePicture} size={9} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate text-white">{u.username}</p>
                {u.verified && <VerifiedBadge type={u.verifiedType || 'blue'} size={12} />}
              </div>
              <p className="text-gray-600 text-xs truncate">
                {u.followers?.length || 0} followers
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleFollow(u._id); }}
              className={`text-xs flex-shrink-0 ${followed.has(u._id) ? 'btn-following' : 'btn-follow'}`}
            >
              {followed.has(u._id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>

      {/* Trending topics placeholder */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2.5 border-b border-white/[0.05]">
          <h3 className="font-semibold text-sm text-gray-200">Trending</h3>
        </div>
        {['design', 'javascript', 'webdev', 'react', 'opensource'].map((tag, i) => (
          <div key={tag} className="px-4 py-2.5 cursor-pointer transition-colors"
            style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            <p className="text-xs text-gray-600">Trending</p>
            <p className="text-sm font-semibold text-gray-200">#{tag}</p>
          </div>
        ))}
      </div>

      <p className="text-gray-700 text-xs mt-auto">Vamppe · Made with ❤️</p>
    </aside>
  );
}
