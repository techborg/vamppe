import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import socket from '../utils/socket';
import SEOHead from '../components/SEOHead';

const TYPE = {
  like:    { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.2)',   color: '#fb7185', emoji: '♥',  label: 'liked your post' },
  comment: { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.2)',  color: '#a78bfa', emoji: '💬', label: 'replied to your post' },
  follow:  { bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)',  color: '#fb923c', emoji: '✦',  label: 'started following you' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications').then((r) => { setNotifications(r.data); setLoading(false); });
    api.put('/notifications/read');
    socket.on('receive_notification', (d) => setNotifications((p) => [d.notification, ...p]));
    return () => socket.off('receive_notification');
  }, []);

  return (
    <div>
      <SEOHead title="Notifications" description="Stay up to date with your latest activity on Vamppe." url="/notifications" noIndex />
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b px-5 py-3.5 flex items-center justify-between"
        style={{ background: 'rgba(10,10,15,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="font-bold text-base">Activity</h1>
        {notifications.filter((n) => !n.read).length > 0 && (
          <span className="badge">{notifications.filter((n) => !n.read).length}</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-8 py-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(255,255,255,0.07)' }}>
            🔔
          </div>
          <p className="font-semibold text-white mb-1">All quiet here</p>
          <p className="text-gray-600 text-sm">Likes, replies, and follows will appear here.</p>
        </div>
      ) : (
        <div>
          {notifications.map((n, i) => {
            const style = TYPE[n.type] || TYPE.like;
            return (
              <div
                key={n._id}
                onClick={() => navigate(n.fromUser?.username ? `/${n.fromUser.username}` : `/profile/${n.fromUser?._id}`)}
                className="flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-all animate-fade-in"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: !n.read ? 'rgba(249,115,22,0.025)' : '',
                  animationDelay: `${i * 30}ms`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = !n.read ? 'rgba(249,115,22,0.025)' : ''}
              >
                {/* Type badge */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <span style={{ color: style.color, fontSize: 13 }}>{style.emoji}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar src={n.fromUser?.profilePicture} size={8} />
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.6)' }} />
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <span className="font-semibold text-white">{n.fromUser?.username}</span>
                    {' '}{style.label}
                  </p>
                  {n.postId?.content && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      "{n.postId.content}"
                    </p>
                  )}
                  <p className="text-gray-700 text-xs mt-1">{format(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
