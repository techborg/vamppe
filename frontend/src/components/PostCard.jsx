import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { HeartIcon, CommentIcon, TrashIcon } from './Icons';
import VerifiedBadge from './VerifiedBadge';

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const liked = post.likes.includes(user._id);

  const handleLike = async () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 350);
    const res = await api.post(`/posts/like/${post._id}`);
    onUpdate({ ...post, likes: res.data.likes });
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
        <Avatar
          src={post.userId?.profilePicture}
          size={10}
          onClick={() => navigate(post.userId?.username ? `/${post.userId.username}` : `/profile/${post.userId?._id}`)}
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <button
                className="font-semibold text-sm text-white hover:text-pulse-400 transition-colors"
                onClick={() => navigate(post.userId?.username ? `/${post.userId.username}` : `/profile/${post.userId?._id}`)}
              >
                {post.userId?.username}
              </button>
              {post.userId?.verified && <VerifiedBadge type={post.userId?.verifiedType || 'blue'} size={13} />}
              <span className="text-gray-700 text-xs">·</span>
              <span className="text-gray-600 text-xs">{format(post.createdAt)}</span>
            </div>
            {post.userId?._id === user._id && (
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover/post:opacity-100 text-gray-700 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-400/8 flex-shrink-0"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content */}
          {post.content && (
            <p className="text-[15px] leading-relaxed text-gray-200 whitespace-pre-wrap break-words mb-3">
              {post.content}
            </p>
          )}

          {/* Image */}
          {post.image && (
            <div className="mb-3 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <img src={post.image} alt="" className="w-full max-h-[420px] object-cover" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 -ml-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className={`post-action ${showComments ? 'text-violet-400' : ''}`}
            >
              <CommentIcon className="w-4 h-4" />
              {post.comments.length > 0 && <span>{post.comments.length}</span>}
            </button>

            <button
              onClick={handleLike}
              className={`post-action ${liked ? 'text-rose-400' : ''}`}
            >
              <span className={likeAnim ? 'animate-pulse-once inline-flex' : 'inline-flex'}>
                <HeartIcon filled={liked} className="w-4 h-4" />
              </span>
              {post.likes.length > 0 && (
                <span className={liked ? 'text-rose-400' : ''}>{post.likes.length}</span>
              )}
            </button>
          </div>

          {/* Comments drawer */}
          {showComments && (
            <div className="mt-3 pt-3 animate-slide-up" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex flex-col gap-2 mb-3">
                {post.comments.length === 0 && (
                  <p className="text-gray-700 text-xs">No replies yet</p>
                )}
                {post.comments.map((c) => (
                  <div key={c._id} className="flex gap-2.5 group/comment">
                    <Avatar
                      src={c.userId?.profilePicture}
                      size={7}
                      onClick={() => navigate(c.userId?.username ? `/${c.userId.username}` : `/profile/${c.userId?._id}`)}
                    />
                    <div className="flex-1 rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="font-semibold text-xs text-gray-300 hover:text-pulse-400 transition-colors"
                          onClick={() => navigate(c.userId?.username ? `/${c.userId.username}` : `/profile/${c.userId?._id}`)}
                        >
                          {c.userId?.username}
                        </button>
                        {c.userId?.verified && <VerifiedBadge type={c.userId?.verifiedType || 'blue'} size={11} />}
                        {c.userId?._id === user._id && (
                          <button
                            onClick={async () => {
                              await api.delete(`/posts/comment/${post._id}/${c._id}`);
                              onUpdate({ ...post, comments: post.comments.filter((x) => x._id !== c._id) });
                            }}
                            className="opacity-0 group-hover/comment:opacity-100 text-gray-700 hover:text-red-400 transition-all p-0.5 rounded"
                          >
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
                <input
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(249,115,22,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.07)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = ''; }}
                  placeholder="Add a reply…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="btn-primary py-2 px-4 text-xs"
                >
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
