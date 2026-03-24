import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import api, { BASE_URL } from '../utils/api';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const navigate = useNavigate();

  const fetchPosts = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20 });
    if (q) params.set('q', q);
    const res = await api.get(`/admin/posts?${params}`);
    setPosts((prev) => p === 1 ? res.data.posts : [...prev, ...res.data.posts]);
    setTotal(res.data.total);
    setPage(res.data.page);
    setHasMore(res.data.hasMore);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts('', 1); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchPosts(query, 1); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const deletePost = async (id) => {
    await api.delete(`/admin/posts/${id}`);
    setPosts((prev) => prev.filter((p) => p._id !== id));
    setTotal((t) => t - 1);
    setConfirm(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Posts</h1>
          <p className="text-gray-600 text-sm mt-0.5">{total} total posts</p>
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
            placeholder="Search post content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-gray-600 text-sm">No posts found</div>
        ) : (
          posts.map((p) => (
            <div key={p._id} className="rounded-2xl p-4 transition-all"
              style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
              <div className="flex items-start justify-between gap-4">
                {/* Author */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <Avatar src={p.userId?.profilePicture} size={8}
                    onClick={() => navigate(p.userId?.username ? `/${p.userId.username}` : `/profile/${p.userId?._id}`)} />
                  <div>
                    <div className="flex items-center gap-1">
                      <button className="font-semibold text-sm text-white hover:text-pulse-400 transition-colors"
                        onClick={() => navigate(p.userId?.username ? `/${p.userId.username}` : `/profile/${p.userId?._id}`)}>
                        {p.userId?.username}
                      </button>
                      {p.userId?.verified && <VerifiedBadge type={p.userId?.verifiedType || 'blue'} size={11} />}
                    </div>
                    <p className="text-gray-600 text-xs">{format(p.createdAt)}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                  <span>♥ {p.likes?.length || 0}</span>
                  <span>💬 {p.comments?.length || 0}</span>
                  <button
                    onClick={() => setConfirm(p._id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors hover:bg-red-400/8"
                    title="Delete post"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              {p.content && (
                <p className="text-gray-300 text-sm mt-3 leading-relaxed line-clamp-3">{p.content}</p>
              )}
              {p.image && (
                <img
                  src={p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`}
                  alt=""
                  className="mt-3 rounded-xl max-h-40 object-cover"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={() => fetchPosts(query, page + 1)} className="btn-ghost text-sm px-6 py-2">
            Load more
          </button>
        </div>
      )}

      {/* Delete confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirm(null)}>
          <div className="rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg mb-2">Delete post?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove the post. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
              <button onClick={() => deletePost(confirm)}
                className="text-sm font-semibold py-2 px-4 rounded-xl transition-all"
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
