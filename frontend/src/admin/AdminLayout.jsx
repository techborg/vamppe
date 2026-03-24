import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Outlet } from 'react-router-dom';
import VamppeLogo from '../components/VamppeLogo';

const NAV = [
  { to: '/admin',                        label: 'Overview',     icon: '◈',  end: true },
  { to: '/admin/users',                  label: 'Users',        icon: '👥' },
  { to: '/admin/posts',                  label: 'Posts',        icon: '📝' },
  { to: '/admin/verification-requests',  label: 'Verify Reqs',  icon: '✦'  },
  { to: '/admin/analytics',              label: 'Analytics',    icon: '📊' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex" style={{ background: '#07070c' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r py-5 px-3"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0a0a0f' }}>
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2.5 px-2 mb-6">
          <VamppeLogo size={28} />
          <div>
            <p className="font-bold text-sm text-white leading-tight">Vamppe</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#f97316' }}>Admin</p>
          </div>
        </button>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${isActive ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
                  style={{ background: isActive ? 'rgba(249,115,22,0.1)' : '' }}>
                  <span className="text-base w-5 text-center">{icon}</span>
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => navigate('/home')} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-300 transition-colors w-full rounded-xl hover:bg-white/4">
            ← Back to app
          </button>
          <button onClick={() => { logout(); navigate('/admin/login'); }} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-red-400 transition-colors w-full rounded-xl hover:bg-red-400/8 mt-0.5">
            ⏻ Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
