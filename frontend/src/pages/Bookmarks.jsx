import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import SEOHead from '../components/SEOHead';
import { BackIcon } from '../components/Icons';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookmarks').then((r) => setPosts(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <SEOHead title="Bookmarks" url="/bookmarks" />
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b px-4 py-3 flex items-center gap-4"
        style={{ background: 'rgba(10,10,15,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-gray-500 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <BackIcon className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-sm">Bookmarks</p>
          <p className="text-gray-600 text-xs">Saved posts</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <p className="text-4xl mb-4">🔖</p>
          <p className="font-semibold text-white mb-1">No bookmarks yet</p>
          <p className="text-gray-600 text-sm">Save posts to read them later.</p>
        </div>
      ) : (
        posts.map((p) => (
          <PostCard key={p._id} post={p} bookmarked
            onDelete={(id) => setPosts((prev) => prev.filter((x) => x._id !== id))}
            onUpdate={(u) => setPosts((prev) => prev.map((x) => x._id === u._id ? u : x))} />
        ))
      )}
    </div>
  );
}
