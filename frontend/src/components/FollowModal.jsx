import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon } from './Icons';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function FollowModal({ userId, type, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/users/profile/${userId}`).then((r) => {
      const list = type === 'followers' ? r.data.followers : r.data.following;
      setUsers(list || []);
      setLoading(false);
    });
  }, [userId, type]);

  const handleFollow = async (id) => {
    await api.post(`/users/follow/${id}`);
    setFollowed((p) => new Set([...p, id]));
  };

  const handleUserClick = (u) => {
    onClose();
    navigate(`/${u.username}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="font-bold text-lg text-white">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all text-gray-500 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-600 text-sm">
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            users.map((u, i) => {
              const isMe = u._id === user._id;
              const isFollowing = followed.has(u._id);
              return (
                <div
                  key={u._id}
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all border-b animate-fade-in"
                  style={{ borderColor: 'rgba(255,255,255,0.04)', animationDelay: `${i * 25}ms` }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                  onClick={() => handleUserClick(u)}
                >
                  <Avatar src={u.profilePicture} size={10} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-white truncate">{u.username}</p>
                      {u.verified && <VerifiedBadge type={u.verifiedType || 'blue'} size={12} />}
                    </div>
                    <p className="text-gray-600 text-xs truncate">@{u.username}</p>
                  </div>
                  {!isMe && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFollow(u._id); }}
                      className={`text-xs flex-shrink-0 ${isFollowing ? 'btn-following' : 'btn-follow'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
