import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import api from '../utils/api';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { SendIcon, BackIcon } from '../components/Icons';
import SEOHead from '../components/SEOHead';

export default function Chat() {
  const { userId } = useParams();
  const { user, onlineUsers } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    api.get('/messages/conversations').then((r) => setConversations(r.data));
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoadingMsgs(true);
    setMessages([]);
    Promise.all([api.get(`/users/profile/${userId}`), api.get(`/messages/history/${userId}`)]).then(([u, m]) => {
      setActiveUser(u.data);
      setMessages(m.data);
    }).finally(() => setLoadingMsgs(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [userId]);

  useEffect(() => {
    socket.on('receive_message', (msg) => {
      const sid = msg.senderId?._id || msg.senderId;
      if (sid === userId || msg.receiverId === userId) {
        setMessages((p) => [...p, msg]);
      }
    });
    socket.on('typing_start', ({ senderId }) => {
      if (senderId === userId) setIsTyping(true);
    });
    socket.on('typing_stop', ({ senderId }) => {
      if (senderId === userId) setIsTyping(false);
    });
    return () => {
      socket.off('receive_message');
      socket.off('typing_start');
      socket.off('typing_stop');
    };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    socket.emit('typing_stop', { receiverId: userId });
    clearTimeout(typingTimeoutRef.current);
    const res = await api.post('/messages/send', { receiverId: userId, message: text });
    setMessages((p) => [...p, res.data]);
    setText('');
    setConversations((prev) => {
      const exists = prev.find((c) => c.user?._id === userId);
      if (exists) return prev.map((c) => c.user?._id === userId ? { ...c, lastMessage: res.data } : c);
      return [{ user: activeUser, lastMessage: res.data }, ...prev];
    });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!userId) return;
    socket.emit('typing_start', { receiverId: userId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: userId });
    }, 1500);
  };

  const isOnline = (id) => onlineUsers?.includes(id);

  const grouped = messages.map((m, i) => {
    const isMine = (m.senderId?._id || m.senderId) === user._id;
    const prevSame = i > 0 && (messages[i - 1].senderId?._id || messages[i - 1].senderId) === (m.senderId?._id || m.senderId);
    const nextSame = i < messages.length - 1 && (messages[i + 1].senderId?._id || messages[i + 1].senderId) === (m.senderId?._id || m.senderId);
    return { ...m, isMine, prevSame, nextSame };
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <SEOHead title="Messages" description="Chat in real time with your connections on Vamppe." url="/chat" noIndex />
      {/* Conversations panel */}
      <div className="w-72 border-r flex flex-col flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-3.5 border-b sticky top-0 z-10 backdrop-blur-xl"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.85)' }}>
          <h2 className="font-bold text-base">Messages</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversations.length === 0 && (
            <div className="p-6 text-center text-gray-700 text-sm">No conversations yet</div>
          )}
          {conversations.map((c) => {
            const active = userId === c.user?._id;
            return (
              <div
                key={c.user?._id}
                onClick={() => navigate(`/chat/${c.user?._id}`)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b"
                style={{
                  borderColor: 'rgba(255,255,255,0.04)',
                  background: active ? 'rgba(249,115,22,0.07)' : '',
                  borderLeft: active ? '2px solid #f97316' : '2px solid transparent',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={c.user?.profilePicture} size={10} />
                  {isOnline(c.user?._id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2"
                      style={{ borderColor: '#0a0a0f' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-sm truncate text-white">{c.user?.username}</p>
                    {c.lastMessage?.createdAt && (
                      <p className="text-gray-700 text-[11px] flex-shrink-0">{format(c.lastMessage.createdAt)}</p>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs truncate mt-0.5">{c.lastMessage?.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!userId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(255,255,255,0.07)' }}>
              💬
            </div>
            <p className="font-semibold text-white mb-1">Your messages</p>
            <p className="text-gray-600 text-sm">Select a conversation or find someone to chat with.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b flex items-center gap-3 sticky top-0 z-10 backdrop-blur-xl"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.85)' }}>
              <button onClick={() => navigate('/chat')}
                className="p-1.5 rounded-xl transition-all text-gray-500 hover:text-white lg:hidden"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <BackIcon className="w-4 h-4" />
              </button>
              <div className="relative cursor-pointer" onClick={() => navigate(activeUser?.username ? `/${activeUser.username}` : `/profile/${userId}`)}>
                <Avatar src={activeUser?.profilePicture} size={9} />
                {isOnline(userId) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2"
                    style={{ borderColor: '#0a0a0f' }} />
                )}
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => navigate(activeUser?.username ? `/${activeUser.username}` : `/profile/${userId}`)}>
                <p className="font-semibold text-sm hover:text-pulse-400 transition-colors">{activeUser?.username}</p>
                <p className="text-xs">
                  {isOnline(userId)
                    ? <span className="text-emerald-400">● Active now</span>
                    : <span className="text-gray-600">● Offline</span>}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <Avatar src={activeUser?.profilePicture} size={16} className="mb-3" />
                  <p className="font-semibold">{activeUser?.username}</p>
                  <p className="text-gray-600 text-sm mt-1">Say hello 👋</p>
                </div>
              ) : (
                grouped.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${m.isMine ? 'justify-end' : 'justify-start'} ${m.prevSame ? 'mt-0.5' : 'mt-3'} animate-fade-in`}
                  >
                    {!m.isMine && (
                      <div className="w-7 flex-shrink-0">
                        {!m.nextSame && <Avatar src={activeUser?.profilePicture} size={7} />}
                      </div>
                    )}

                    <div className="max-w-[68%] group">
                      <div
                        className="px-3.5 py-2.5 text-sm leading-relaxed"
                        style={m.isMine ? {
                          background: 'linear-gradient(135deg, #f97316, #e8650a)',
                          color: 'white',
                          borderRadius: m.prevSame ? '18px 18px 6px 18px' : '18px 18px 6px 18px',
                          boxShadow: '0 2px 8px rgba(249,115,22,0.2)',
                        } : {
                          background: 'rgba(255,255,255,0.06)',
                          color: '#e5e7eb',
                          borderRadius: m.prevSame ? '18px 18px 18px 6px' : '18px 18px 18px 6px',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        {m.message}
                      </div>
                      {!m.nextSame && (
                        <p className={`text-[11px] text-gray-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${m.isMine ? 'text-right' : 'text-left'}`}>
                          {format(m.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 mt-3 animate-fade-in">
                  <div className="w-7 flex-shrink-0">
                    <Avatar src={activeUser?.profilePicture} size={7} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-4 py-3 border-t flex items-center gap-2.5"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <input
                ref={inputRef}
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(249,115,22,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.07)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = ''; }}
                placeholder={`Message ${activeUser?.username || ''}…`}
                value={text}
                onChange={handleTyping}
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-30"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
