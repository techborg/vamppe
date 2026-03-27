import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { HomeIcon, ExploreIcon, BellIcon, ChatIcon, UserIcon, LogoutIcon, PlusIcon } from './Icons';

const SettingsIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const BookmarkNavIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);
import VamppeLogo from './VamppeLogo';
import VerifiedBadge from './VerifiedBadge';
import api from '../utils/api';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications')
      .then((r) => setUnread(r.data.filter((n) => !n.read).length))
      .catch(() => {});
  }, []);

  const navItems = [
    { to: '/home',                  label: 'Home',     Icon: HomeIcon },
    { to: '/explore',               label: 'Discover', Icon: ExploreIcon },
    { to: '/notifications',         label: 'Activity', Icon: BellIcon, badge: unread },
    { to: '/chat',                  label: 'Messages', Icon: ChatIcon },
    { to: `/${user?.username}`,  label: 'Profile',  Icon: UserIcon },
    { to: '/bookmarks',          label: 'Bookmarks', Icon: BookmarkNavIcon },
    { to: '/settings',           label: 'Settings', Icon: SettingsIcon },
  ];

  const AdminIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  return (
    <aside className="w-60 px-3 py-5 flex flex-col h-screen sticky top-0 gap-1">
      {/* Brand */}
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2.5 px-2.5 py-2 mb-4 rounded-2xl hover:bg-white/[0.04] transition-all w-fit group"
      >
        <VamppeLogo size={32} />
        <span className="font-bold text-lg tracking-tight hidden xl:block text-white group-hover:text-pulse-400 transition-colors">
          Vamppe
        </span>
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ to, label, Icon, badge }) => (
          <NavLink key={to} to={to} className="block">
            {({ isActive }) => (
              <div className={isActive ? 'nav-item-active' : 'nav-item'}>
                <div className="relative flex-shrink-0">
                  <Icon filled={isActive} className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="badge absolute -top-1.5 -right-1.5">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[15px] hidden xl:block">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* New post CTA */}
      <div className="mt-4 hidden xl:block">
        <button
          onClick={() => navigate('/home')}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Post
        </button>
      </div>
      <div className="mt-4 xl:hidden">
        <button
          onClick={() => navigate('/home')}
          className="btn-primary p-2.5 flex items-center justify-center"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Admin link */}
      {user?.isAdmin && (
        <div className="mt-2">
          <NavLink to="/admin">
            {({ isActive }) => (
              <div className={isActive ? 'nav-item-active' : 'nav-item'}>
                <AdminIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[15px] hidden xl:block">Admin</span>
              </div>
            )}
          </NavLink>
        </div>
      )}

      {/* User card */}
      <div className="mt-auto">
        <div
          className="flex items-center gap-2.5 p-2.5 rounded-2xl cursor-pointer transition-all group"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; }}
          onClick={() => navigate(`/${user?.username}`)}
        >
          <Avatar src={user?.profilePicture} size={9} />
          <div className="flex-1 min-w-0 hidden xl:block">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm truncate text-white">{user?.username}</p>
              {user?.verified && <VerifiedBadge type={user?.verifiedType || 'blue'} size={12} />}
            </div>
            <p className="text-gray-600 text-xs truncate">@{user?.username}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); logout(); }}
            className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/8 hidden xl:block"
            title="Sign out"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
