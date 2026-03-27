import { useEffect, useState } from 'react';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import StoriesBar from '../components/StoriesBar';
import { SparkleIcon } from '../components/Icons';
import SEOHead from '../components/SEOHead';

const TABS = ['For You', 'Following', 'Trending'];

export default function Home() {
  const [tab, setTab] = useState('For You');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());

  const fetchFeed = async (p = 1, currentTab = tab) => {
    const endpoint = currentTab === 'Trending'
      ? '/posts/trending?limit=20'
      : `/posts/feed?page=${p}&limit=10`;
    const res = await api.get(endpoint);
    const data = res.data;
    if (Array.isArray(data)) {
      setPosts(p === 1 ? data : (prev) => [...prev, ...data]);
      setHasMore(false);
    } else {
      setPosts((prev) => p === 1 ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore ?? false);
      setPage(data.page ?? p);
    }
  };

  useEffect(() => {
    api.get('/bookmarks/ids').then((r) => setBookmarkIds(new Set(r.data))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    fetchFeed(1, tab).finally(() => setLoading(false));
  }, [tab]);

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
      <SEOHead title="Home" description="Your personalised Vamppe feed." url="/home" />

      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b"
        style={{ background: 'rgba(10,10,15,0.9)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-3.5 flex items-center justify-between">
          <h1 className="font-bold text-base">Home</h1>
          <SparkleIcon className="w-4 h-4 text-pulse-400" />
        </div>
        {/* Feed tabs */}
        <div className="flex px-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-sm font-semibold transition-all relative"
              style={{ color: tab === t ? '#fb923c' : '#6b7280' }}>
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ background: '#f97316' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stories */}
      <StoriesBar />

      {/* Create post (only on For You / Following) */}
      {tab !== 'Trending' && <CreatePost onPost={handlePost} />}

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
          <p className="font-semibold text-white mb-1">
            {tab === 'Trending' ? 'No trending posts yet' : 'Your feed is empty'}
          </p>
          <p className="text-gray-600 text-sm">
            {tab === 'Trending' ? 'Check back soon.' : 'Follow people to see their posts here.'}
          </p>
        </div>
      ) : (
        <>
          {posts.map((p) => (
            <PostCard key={p._id} post={p}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              bookmarked={bookmarkIds.has(p._id)} />
          ))}
          {hasMore && (
            <div className="flex justify-center py-6">
              <button onClick={loadMore} disabled={loadingMore} className="btn-ghost text-sm px-6 py-2">
                {loadingMore
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />Loading…</span>
                  : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
