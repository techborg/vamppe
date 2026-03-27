import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { HeartIcon, CommentIcon, TrashIcon } from './Icons';
import VerifiedBadge from './VerifiedBadge';

const REACTIONS = [
  { key: 'heart', emoji: '❤️' },
  { key: 'fire',  emoji: '🔥' },
  { key: 'laugh', emoji: '😂' },
  { key: 'sad',   emoji: '😢' },
  { key: 'wow',   emoji: '😮' },
  { key: 'angry', emoji: '😡' },
];

const BookmarkIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const ShareIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

function HashtagText({ text, navigate }) {
  if (!text) return null;
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
  return (
    <p className="text-[15px] leading-relaxed text-gray-200 whitespace-pre-wrap break-words mb-3">
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <button key={i} onClick={() => navigate(`/hashtag/${part.slice(1)}`)}
            className="font-semibold transition-colors"
            style={{ color: '#f97316' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fb923c'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#f97316'}>
            {part}
          </button>
        ) : part
      )}
    </p>
  );
}

function PollWidget({ poll, postId, onUpdate }) {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);
  const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  const myVote = poll.options.findIndex((o) => o.votes?.includes(user._id));
  const ended = poll.endsAt && new Date() > new Date(poll.endsAt);

  const vote = async (idx) => {
    if (voting || ended) return;
    setVoting(true);
    try {
      const res = await api.post(`/posts/poll/${postId}/vote`, { optionIndex: idx });
      onUpdate({ poll: res.data.poll });
    } catch (_) {}
    setVoting(false);
  };

  return (
    <div className="mt-3 rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-sm font-semibold text-white mb-1">{poll.question}</p>
      {poll.options.map((opt, i) => {
        const pct = totalVotes ? Math.round((opt.votes?.length || 0) / totalVotes * 100) : 0;
        const isMyVote = myVote === i;
        return (
          <button key={i} onClick={() => vote(i)} disabled={ended}
            className="relative rounded-xl overflow-hidden text-left px-3 py-2.5 transition-all"
            style={{ border: `1px solid ${isMyVote ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
            <div className="absolute inset-0 rounded-xl transition-all"
              style={{ width: `${pct}%`, background: isMyVote ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)' }} />
            <div className="relative flex justify-between items-center">
              <span className="text-sm text-gray-200">{opt.text}</span>
              <span className="text-xs text-gray-500">{pct}%</span>
            </div>
          </button>
        );
      })}
      <p className="text-xs text-gray-600 mt-1">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {ended ? ' · Poll ended' : poll.endsAt ? ` · Ends ${format(poll.endsAt)}` : ''}
      </p>
    </div>
  );
}

export default function PostCard({ post, onDelete, onUpdate, bookmarked: initBookmarked = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [bookmarked, setBookmarked] = useState(initBookmarked);

  const liked = post.likes?.includes(user._id);
  const myReaction = REACTIONS.find((r) => post.reactions?.[r.key]?.includes(user._id));
  const totalReactions = REACTIONS.reduce((s, r) => s + (post.reactions?.[r.key]?.length || 0), 0);

  const handleLike = async () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 350);
    const res = await api.post(`/posts/like/${post._id}`);
    onUpdate({ ...post, likes: res.data.likes });
  };

  const handleReact = async (key) => {
    setShowReactions(false);
    const res = await api.post(`/posts/react/${post._id}`, { reaction: key });
    onUpdate({ ...post, reactions: res.data.reactions });
  };

  const handleBookmark = async () => {
    const res = await api.post(`/bookmarks/${post._id}`);
    setBookmarked(res.data.bookmarked);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await api.post(`/posts/comment/${post._id}`, { text: commentText });
    onUpdate(res.data);
    setCommentText('');
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this post?')) return;
    await api.delete(`/posts/${post._id}`);
    onDelete(post._id);
  };

  return (
    <article className="px-5 py-4 border-b transition-colors animate-fade-in group/post"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.012)'}
      onMouseLeave={(e) => e.currentTarget.style.background = ''}>
      <div className="flex gap-3">
        <Avatar src={post.userId?.profilePicture} size={10}
          onClick={() => navigate(post.userId?.username ? `/${post.userId.username}` : `/profile/${post.userId?._id}`)} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <button className="font-semibold text-sm text-white hover:text-pulse-400 transition-colors"
                onClick={() => navigate(post.userId?.username ? `/${post.userId.username}` : `/profile/${post.userId?._id}`)}>
                {post.userId?.displayName || post.userId?.username}
              </button>
              {post.userId?.verified && <VerifiedBadge type={post.userId?.verifiedType || 'blue'} size={13} />}
              <span className="text-gray-700 text-xs">·</span>
              <span className="text-gray-600 text-xs">{format(post.createdAt)}</span>
            </div>
            {post.userId?._id === user._id && (
              <button onClick={handleDelete}
                className="opacity-0 group-hover/post:opacity-100 text-gray-700 hover:text-red-400 transition-all p-1 rounded-lg flex-shrink-0">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content with hashtags */}
          {post.content && <HashtagText text={post.content} navigate={navigate} />}

          {/* Image */}
          {post.image && (
            <div className="mb-3 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <img src={post.image} alt="" className="w-full max-h-[420px] object-cover cursor-pointer transition-transform active:scale-95"
                onDoubleClick={handleLike}
                onClick={() => window.open(post.image, '_blank')} />
            </div>
          )}

          {/* Poll */}
          {post.poll?.question && (
            <PollWidget poll={post.poll} postId={post._id}
              onUpdate={(u) => onUpdate({ ...post, ...u })} />
          )}

          {/* Reactions summary */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {REACTIONS.filter((r) => (post.reactions?.[r.key]?.length || 0) > 0).slice(0, 3).map((r) => (
                <span key={r.key} className="text-sm">{r.emoji}</span>
              ))}
              <span className="text-xs text-gray-600 ml-1">{totalReactions}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 -ml-2">
            <button onClick={() => setShowComments(!showComments)}
              className={`post-action ${showComments ? 'text-violet-400' : ''}`}>
              <CommentIcon className="w-4 h-4" />
              {post.comments?.length > 0 && <span>{post.comments.length}</span>}
            </button>

            <div className="relative">
              <button onClick={() => setShowReactions(!showReactions)}
                className="post-action text-sm">
                {myReaction ? myReaction.emoji : '😊'}
              </button>
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-2xl z-20 animate-scale-in"
                  style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {REACTIONS.map((r) => (
                    <button key={r.key} onClick={() => handleReact(r.key)}
                      className="text-xl hover:scale-125 transition-transform p-1 rounded-lg"
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bookmark */}
            <button onClick={handleBookmark}
              className={`post-action ml-auto ${bookmarked ? 'text-orange-400' : ''}`}>
              <BookmarkIcon filled={bookmarked} className="w-4 h-4" />
            </button>

            {/* Share */}
            <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/posts/${post._id}`); }}
              className="post-action">
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Comments drawer */}
          {showComments && (
            <div className="mt-3 pt-3 animate-slide-up" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex flex-col gap-2 mb-3">
                {post.comments?.length === 0 && <p className="text-gray-700 text-xs">No replies yet</p>}
                {post.comments?.map((c) => (
                  <div key={c._id} className="flex gap-2.5 group/comment">
                    <Avatar src={c.userId?.profilePicture} size={7}
                      onClick={() => navigate(c.userId?.username ? `/${c.userId.username}` : `/profile/${c.userId?._id}`)} />
                    <div className="flex-1 rounded-2xl px-3 py-2"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <button className="font-semibold text-xs text-gray-300 hover:text-pulse-400 transition-colors"
                          onClick={() => navigate(c.userId?.username ? `/${c.userId.username}` : `/profile/${c.userId?._id}`)}>
                          {c.userId?.username}
                        </button>
                        {c.userId?.verified && <VerifiedBadge type={c.userId?.verifiedType || 'blue'} size={11} />}
                        {c.userId?._id === user._id && (
                          <button onClick={async () => {
                            await api.delete(`/posts/comment/${post._id}/${c._id}`);
                            onUpdate({ ...post, comments: post.comments.filter((x) => x._id !== c._id) });
                          }} className="opacity-0 group-hover/comment:opacity-100 text-gray-700 hover:text-red-400 transition-all p-0.5 rounded">
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleComment} className="flex gap-2">
                <input className="flex-1 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(249,115,22,0.4)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                  placeholder="Add a reply…" value={commentText}
                  onChange={(e) => setCommentText(e.target.value)} />
                <button type="submit" disabled={submitting || !commentText.trim()} className="btn-primary py-2 px-4 text-xs">
                  Reply
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
