import { useEffect, useState, useRef } from 'react';
import api, { BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

function StoryViewer({ groups, startIndex, onClose }) {
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef();

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  useEffect(() => {
    if (!story) return;
    api.post(`/stories/${story._id}/view`).catch(() => {});
    setProgress(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { advance(); return 0; }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [story?._id]);

  const advance = () => {
    if (storyIdx < group.stories.length - 1) setStoryIdx((i) => i + 1);
    else if (groupIdx < groups.length - 1) { setGroupIdx((i) => i + 1); setStoryIdx(0); }
    else onClose();
  };

  const retreat = () => {
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (groupIdx > 0) { setGroupIdx((i) => i - 1); setStoryIdx(0); }
  };

  if (!story) return null;
  const imgSrc = story.image.startsWith('http') ? story.image : `${BASE_URL}${story.image}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div className="relative w-full max-w-sm h-full max-h-[90vh] rounded-2xl overflow-hidden"
        style={{ background: '#000' }}>
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.3)' }}>
              <div className="h-full rounded-full transition-none"
                style={{
                  background: 'white',
                  width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 z-10 flex items-center gap-2">
          <Avatar src={group.user.profilePicture} size={8} />
          <span className="text-white text-sm font-semibold">{group.user.username}</span>
          <span className="text-white/50 text-xs ml-auto">
            {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={onClose} className="text-white/70 hover:text-white ml-2 text-lg">✕</button>
        </div>

        {/* Image */}
        <img src={imgSrc} className="w-full h-full object-cover" alt="" />

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-6 left-4 right-4 z-10">
            <p className="text-white text-sm text-center px-3 py-2 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
              {story.caption}
            </p>
          </div>
        )}

        {/* Tap zones */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={retreat} />
          <div className="w-2/3 h-full cursor-pointer" onClick={advance} />
        </div>
      </div>
    </div>
  );
}

export default function StoriesBar() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/stories/feed').then((r) => setGroups(r.data)).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.post('/stories', fd);
      const r = await api.get('/stories/feed');
      setGroups(r.data);
    } catch (_) {}
    e.target.value = '';
  };

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Add story */}
        <button onClick={() => fileRef.current.click()}
          className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <Avatar src={user?.profilePicture} size={14} />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#f97316' }}>+</div>
          </div>
          <span className="text-[10px] text-gray-500 w-14 text-center truncate">Your story</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        {/* Story groups */}
        {groups.map((g, i) => {
          const hasUnseen = g.stories.some((s) => !s.viewers?.includes(user._id));
          return (
            <button key={g.user._id} onClick={() => setViewing(i)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="p-0.5 rounded-2xl"
                style={{ background: hasUnseen ? 'linear-gradient(135deg, #f97316, #8b5cf6)' : 'rgba(255,255,255,0.1)' }}>
                <div className="p-0.5 rounded-xl" style={{ background: '#0a0a0f' }}>
                  <Avatar src={g.user.profilePicture} size={13} />
                </div>
              </div>
              <span className="text-[10px] text-gray-500 w-14 text-center truncate">{g.user.username}</span>
            </button>
          );
        })}
      </div>

      {viewing !== null && (
        <StoryViewer groups={groups} startIndex={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
}
