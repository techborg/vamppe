import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import SEOHead from '../components/SEOHead';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (q = '', p = 1) => {
    const params = new URLSearchParams({ page: p, limit: 10 });
    if (q.trim()) params.set('q', q.trim());
    const res = await api.get(`/posts/explore?${params}`);
    const data = res.data;
    if (Array.isArray(data)) {
      setPosts(data);
    } else {
      setPosts((prev) => p === 1 ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(data.page);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts('', 1).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setPage(1);
      fetchPosts(query, 1).finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPosts(query, page + 1);
    setLoadingMore(false);
  };

  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));
  const handleUpdate = (u) => setPosts((prev) => prev.map((p) => (p._id === u._id ? u : p)));

  return (
    <div>
      <SEOHead title="Discover" description="Explore trending posts and find new people on Vamppe." url="/explore" />
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b px-5 py-3.5"
        style={{ background: 'rgba(10,10,15,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-base">Discover</h1>
          <p className="text-gray-600 text-xs">Everything happening right now</p>
        </div>
        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <circle cx="11" cy="11" r="7.5" /><path d="M21 21l-3.5-3.5" />
          </svg>
          <input
            className="w-full rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(249,115,22,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.07)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = ''; }}
            placeholder="Search posts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-8 py-16 text-center animate-fade-in">
          <p className="font-semibold text-white mb-1">{query ? 'No results found' : 'Nothing here yet'}</p>
          <p className="text-gray-600 text-sm">{query ? 'Try a different search.' : 'Be the first to post something.'}</p>
        </div>
      ) : (
        <>
          {posts.map((p) => (
            <PostCard key={p._id} post={p} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
          {hasMore && (
            <div className="flex justify-center py-6">
              <button onClick={loadMore} disabled={loadingMore} className="btn-ghost text-sm px-6 py-2">
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
                    Loading…
                  </span>
                ) : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
