import { useState, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { ImageIcon, XIcon } from './Icons';

const PollIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function CreatePost({ onPost }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(24);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setShowPoll(false);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, '']);
  };

  const updateOption = (i, v) => {
    const opts = [...pollOptions];
    opts[i] = v;
    setPollOptions(opts);
  };

  const removeOption = (i) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasPoll = showPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2;
    if (!content.trim() && !image && !hasPoll) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      if (image) fd.append('image', image);
      if (hasPoll) {
        fd.append('pollQuestion', pollQuestion.trim());
        pollOptions.filter((o) => o.trim()).forEach((o) => fd.append('pollOptions[]', o));
        fd.append('pollDuration', pollDuration);
      }
      const res = await api.post('/posts/create', fd);
      onPost(res.data);
      setContent(''); setImage(null); setPreview('');
      setShowPoll(false); setPollQuestion(''); setPollOptions(['', '']);
      setFocused(false);
    } finally {
      setLoading(false);
    }
  };

  const maxChars = 500;
  const pct = Math.min((content.length / maxChars) * 100, 100);
  const overLimit = content.length > maxChars;
  const hasPoll = showPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2;
  const canPost = (content.trim() || image || hasPoll) && !loading && !overLimit;

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

            {/* Image preview */}
            {preview && (
              <div className="relative mt-2 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <img src={preview} alt="" className="w-full max-h-64 object-cover" />
                <button type="button" onClick={() => { setImage(null); setPreview(''); }}
                  className="absolute top-2 right-2 rounded-xl p-1.5"
                  style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Poll builder */}
            {showPoll && (
              <div className="mt-3 rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Poll</p>
                  <button type="button" onClick={() => setShowPoll(false)} className="text-gray-600 hover:text-gray-400 text-sm">✕</button>
                </div>
                <input className="w-full px-3 py-2 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  placeholder="Ask a question…" value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)} />
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="flex-1 px-3 py-2 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      placeholder={`Option ${i + 1}`} value={opt}
                      onChange={(e) => updateOption(i, e.target.value)} />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)} className="text-gray-600 hover:text-red-400 px-2">✕</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button type="button" onClick={addPollOption}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-left">
                    + Add option
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Duration:</span>
                  {[24, 48, 72].map((h) => (
                    <button key={h} type="button" onClick={() => setPollDuration(h)}
                      className="text-xs px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: pollDuration === h ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
                        color: pollDuration === h ? '#f97316' : '#6b7280',
                        border: `1px solid ${pollDuration === h ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(focused || content || image || showPoll) && (
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => fileRef.current.click()}
                    className="text-gray-600 hover:text-pulse-400 p-1.5 rounded-xl transition-all hover:bg-pulse-500/8" title="Attach image">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                  <button type="button" onClick={() => { setShowPoll(!showPoll); setImage(null); setPreview(''); }}
                    className={`p-1.5 rounded-xl transition-all ${showPoll ? 'text-orange-400' : 'text-gray-600 hover:text-pulse-400'}`}
                    title="Add poll">
                    <PollIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {content.length > 0 && (
                    <div className="relative w-6 h-6">
                      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                        <circle cx="12" cy="12" r="9" fill="none"
                          stroke={overLimit ? '#ef4444' : pct > 85 ? '#eab308' : '#f97316'}
                          strokeWidth="2.5"
                          strokeDasharray={`${(pct / 100) * 56.5} 56.5`}
                          className="transition-all" />
                      </svg>
                      {overLimit && (
                        <span className="absolute inset-0 flex items-center justify-center text-red-400 text-[9px] font-bold">
                          {maxChars - content.length}
                        </span>
                      )}
                    </div>
                  )}
                  <button type="submit" disabled={!canPost} className="btn-primary py-2 px-5">
                    {loading
                      ? <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Posting…</span>
                      : 'Post'}
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
