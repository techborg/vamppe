import { useEffect, useState } from 'react';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { SparkleIcon } from '../components/Icons';
import SEOHead from '../components/SEOHead';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = async (p = 1) => {
    const res = await api.get(`/posts/feed?page=${p}&limit=10`);
    const data = res.data;
    if (Array.isArray(data)) {
      setPosts(data);
    } else {
      setPosts((prev) => p === 1 ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(data.page);
    }
  };

  useEffect(() => {
    fetchFeed(1).finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchFeed(page + 1);
    setLoadingMore(false);
  };

  const handlePost = (p) => setPosts((prev) => [p, ...prev]);
  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));
  const handleUpdate = (u) => setPosts((prev) => prev.map((p) => (p._id === u._id ? u : p)));

  return (
    <div>
      <SEOHead title="Home" description="Your personalised Vamppe feed — posts from people you follow." url="/home" />
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b px-5 py-3.5 flex items-center justify-between"
        style={{ background: 'rgba(10,10,15,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="font-bold text-base">Home</h1>
        <SparkleIcon className="w-4 h-4 text-pulse-400" />
      </div>

      <CreatePost onPost={handlePost} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-8 py-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(255,255,255,0.07)' }}>
            ✦
          </div>
          <p className="font-semibold text-white mb-1">Your feed is empty</p>
          <p className="text-gray-600 text-sm">Follow people to see their posts here.</p>
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
