const i = (d, opts = {}) => ({ filled, className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className}
    fill={opts.fill ? (filled ? 'currentColor' : 'none') : 'none'}
    stroke={opts.noStroke ? 'none' : 'currentColor'}
    strokeWidth={opts.sw || 1.8}
    strokeLinecap="round" strokeLinejoin="round"
  >
    {typeof d === 'function' ? d(filled) : <path d={d} />}
  </svg>
);

export const HomeIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {filled
      ? <path fill="currentColor" stroke="none" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      : <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V9.5z" />}
  </svg>
);

export const ExploreIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7.5" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} />
    <path d="M21 21l-3.5-3.5" stroke="currentColor" />
  </svg>
);

export const BellIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export const ChatIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

export const UserIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);

export const LogoutIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const HeartIcon = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

export const CommentIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

export const ImageIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const TrashIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

export const SendIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const CameraIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const XIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const EditIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const CalendarIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const SparkleIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

export const BackIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

export const PlusIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
