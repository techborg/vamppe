import { useState, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { ImageIcon, XIcon } from './Icons';

export default function CreatePost({ onPost }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      if (image) fd.append('image', image);
      const res = await api.post('/posts/create', fd);
      onPost(res.data);
      setContent('');
      setImage(null);
      setPreview('');
      setFocused(false);
    } finally {
      setLoading(false);
    }
  };

  const maxChars = 500;
  const pct = Math.min((content.length / maxChars) * 100, 100);
  const overLimit = content.length > maxChars;
  const canPost = (content.trim() || image) && !loading && !overLimit;

  return (
    <div className={`px-5 py-4 border-b transition-all duration-200 ${focused ? 'bg-white/[0.015]' : ''}`}
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar src={user?.profilePicture} size={10} />
          <div className="flex-1 min-w-0">
            <textarea
              className="w-full bg-transparent text-[15px] placeholder-gray-700 text-gray-100 resize-none focus:outline-none leading-relaxed transition-all"
              style={{ minHeight: focused ? 88 : 44 }}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
            />

            {preview && (
              <div className="relative mt-2 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <img src={preview} alt="" className="w-full max-h-64 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setPreview(''); }}
                  className="absolute top-2 right-2 rounded-xl p-1.5 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {(focused || content || image) && (
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="text-gray-600 hover:text-pulse-400 p-1.5 rounded-xl transition-all hover:bg-pulse-500/8"
                  title="Attach image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

                <div className="flex items-center gap-3">
                  {content.length > 0 && (
                    <div className="relative w-6 h-6">
                      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                        <circle
                          cx="12" cy="12" r="9" fill="none"
                          stroke={overLimit ? '#ef4444' : pct > 85 ? '#eab308' : '#f97316'}
                          strokeWidth="2.5"
                          strokeDasharray={`${(pct / 100) * 56.5} 56.5`}
                          className="transition-all"
                        />
                      </svg>
                      {overLimit && (
                        <span className="absolute inset-0 flex items-center justify-center text-red-400 text-[9px] font-bold">
                          {maxChars - content.length}
                        </span>
                      )}
                    </div>
                  )}
                  <button type="submit" disabled={!canPost} className="btn-primary py-2 px-5">
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Posting…
                      </span>
                    ) : 'Post'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
