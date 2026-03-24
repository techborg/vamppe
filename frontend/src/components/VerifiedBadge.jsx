import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

/**
 * VerifiedBadge — badge with portal tooltip shown next to verified usernames.
 *
 * Types:
 *   blue   — Verified
 *   gold   — Creator
 *   purple — Official
 *   red    — Staff
 */

const BADGE = {
  blue: {
    bg: '#3b82f6',
    label: 'Verified',
    desc: 'This account is verified',
    icon: (
      <path d="M6 10.5l2.8 2.8 5.2-5.6"
        stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  gold: {
    bg: '#f59e0b',
    label: 'Creator',
    desc: 'Notable creator account',
    icon: (
      <path d="M6 10.5l2.8 2.8 5.2-5.6"
        stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  purple: {
    bg: '#8b5cf6',
    label: 'Official',
    desc: 'Official organisation or brand',
    icon: (
      <>
         <path d="M6 10.5l2.8 2.8 5.2-5.6"
        stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  red: {
    bg: null,
    label: 'Staff',
    desc: 'Vamppe staff member',
    icon: (
       <path d="M6 10.5l2.8 2.8 5.2-5.6"
        stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
};

function Tooltip({ anchorRef, badge, isRed, visible }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!visible || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({
      top: r.top + window.scrollY - 8,
      left: r.left + r.width / 2 + window.scrollX,
    });
  }, [visible]);

  if (!visible) return null;

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        transform: 'translate(-50%, -100%)',
        zIndex: 99999,
        background: '#1a1a26',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: '6px 10px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: isRed ? '#f97316' : badge.bg }}>
        {badge.label}
      </span>
      <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>{badge.desc}</span>
      {/* Arrow */}
      <span style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid #1a1a26',
      }} />
    </div>,
    document.body
  );
}

export default function VerifiedBadge({ type = 'blue', size = 14, className = '' }) {
  const badge = BADGE[type] || BADGE.blue;
  const isRed = type === 'red';
  const uid = useId().replace(/:/g, '');
  const gradientId = `vbg-${type}-${uid}`;
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  return (
    <span
      ref={ref}
      className={`relative inline-flex items-center flex-shrink-0 ${className}`}
      style={{ verticalAlign: 'middle', cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={badge.label}
      >
        {isRed && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        )}
        <circle cx="10" cy="10" r="10" fill={isRed ? `url(#${gradientId})` : badge.bg} />
        {badge.icon}
      </svg>

      <Tooltip anchorRef={ref} badge={badge} isRed={isRed} visible={hovered} />
    </span>
  );
}
