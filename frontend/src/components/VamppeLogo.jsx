/**
 * VamppeLogo — reusable brand mark for Vamppe
 *
 * The mark is a stylized "V" with two descending fang-like strokes
 * that converge at a sharp point, then split back up — evoking both
 * the letter V and a signal/pulse waveform. The background is a
 * deep rounded square with an orange→violet gradient.
 *
 * Props:
 *   size  — pixel size of the square (default 40)
 *   text  — show "Vamppe" wordmark next to the mark (default false)
 *   className — extra classes on the wrapper
 */
export default function VamppeLogo({ size = 40, text = false, className = '' }) {
  const r = Math.round(size * 0.26); // corner radius scales with size
  const id = `vg-${size}`; // unique gradient id per size

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Vamppe logo"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f97316" />
            <stop offset="55%"  stopColor="#c026d3" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          {/* Subtle inner glow */}
          <radialGradient id={`${id}-glow`} cx="50%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background square */}
        <rect width="48" height="48" rx={r} fill={`url(#${id})`} />
        {/* Inner glow overlay */}
        <rect width="48" height="48" rx={r} fill={`url(#${id}-glow)`} />

        {/*
          The mark: two fang strokes forming a "V"
          Left stroke  — comes from top-left, angles down to the center tip
          Right stroke — comes from top-right, angles down to the center tip
          Then two small upward ticks at the bottom of each fang (the "bite" detail)
        */}
        <g stroke="white" strokeLinecap="round" strokeLinejoin="round">
          {/* Main V shape */}
          <polyline
            points="10,11 24,37 38,11"
            strokeWidth="4.2"
            fill="none"
          />
          {/* Left fang inner detail — small downward serif */}
          <line x1="10" y1="11" x2="10" y2="18" strokeWidth="4.2" />
          {/* Right fang inner detail */}
          <line x1="38" y1="11" x2="38" y2="18" strokeWidth="4.2" />
          {/* Center dot — the tip accent */}
          <circle cx="24" cy="37" r="1.6" fill="white" stroke="none" />
        </g>
      </svg>

      {/* Optional wordmark */}
      {text && (
        <span
          className="font-bold tracking-tight text-white select-none"
          style={{ fontSize: size * 0.42, lineHeight: 1 }}
        >
          vamppe
        </span>
      )}
    </div>
  );
}
