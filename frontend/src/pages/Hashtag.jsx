import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import SEOHead from '../components/SEOHead';
import { BackIcon } from '../components/Icons';

export default function Hashtag() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetch = async (p = 1) => {
    const res = await api.get(`/posts/hashtag/${tag}?page=${p}`);
    setPosts((prev) => p === 1 ? res.data.posts : [...prev, ...res.data.posts]);
    setTotal(res.data.total);
    setHasMore(res.data.hasMore);
    setPage(res.data.page);
  };

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    fetch(1).finally(() => setLoading(false));
  }, [tag]);

  return (
    <div className="animate-fade-in">
      <SEOHead title={`#${tag}`} url={`/hashtag/${tag}`} />
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b px-4 py-3 flex items-center gap-4"
        style={{ background: 'rgba(10,10,15,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-gray-500 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <BackIcon className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-sm">#{tag}</p>
          <p className="text-gray-600 text-xs">{total} posts</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <p className="text-4xl mb-4">#</p>
          <p className="font-semibold text-white mb-1">No posts for #{tag}</p>
        </div>
      ) : (
        <>
          {posts.map((p) => (
            <PostCard key={p._id} post={p}
              onDelete={(id) => setPosts((prev) => prev.filter((x) => x._id !== id))}
              onUpdate={(u) => setPosts((prev) => prev.map((x) => x._id === u._id ? u : x))} />
          ))}
          {hasMore && (
            <div className="flex justify-center py-6">
              <button onClick={async () => { setLoadingMore(true); await fetch(page + 1); setLoadingMore(false); }}
                disabled={loadingMore} className="btn-ghost text-sm px-6 py-2">
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
