const SIZES = {
  5:  'w-5 h-5 text-[9px]',
  7:  'w-7 h-7 text-[11px]',
  8:  'w-8 h-8 text-xs',
  9:  'w-9 h-9 text-xs',
  10: 'w-10 h-10 text-sm',
  12: 'w-12 h-12 text-sm',
  14: 'w-14 h-14 text-base',
  16: 'w-16 h-16 text-lg',
  20: 'w-20 h-20 text-xl',
};

export default function Avatar({ src, size = 10, className = '', style = {}, onClick, ring = false }) {
  const sz = SIZES[size] || `w-${size} h-${size} text-sm`;
  const base = `${sz} rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center font-bold select-none transition-all`;
  const ringStyle = ring ? 'avatar-ring' : '';
  const clickable = onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : '';

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={style}
        className={`${base} ${ringStyle} ${clickable} object-cover ${className}`}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={`${base} ${ringStyle} ${clickable} ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(255,255,255,0.08)', ...style }}
      onClick={onClick}
    >
      <span className="text-white/80">?</span>
    </div>
  );
}
