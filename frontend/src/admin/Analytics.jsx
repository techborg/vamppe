import { useEffect, useState, useRef } from 'react';
import api from '../utils/api';

const RANGES = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function StatCard({ label, value, sub, color = '#f97316' }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

function BarChart({ data, xKey, yKey, color = '#f97316', height = 120 }) {
  if (!data?.length) return <div className="text-gray-600 text-sm py-8 text-center">No data</div>;
  const max = Math.max(...data.map((d) => d[yKey]), 1);
  return (
    <div className="flex items-end gap-px w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height }}>
          <div className="w-full rounded-t transition-all"
            style={{ height: `${Math.max(2, (d[yKey] / max) * (height - 20))}px`, background: `linear-gradient(to top, ${color}, ${color}88)`, minWidth: 2 }} />
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
            <div className="rounded-lg px-2 py-1 text-xs font-semibold text-white whitespace-nowrap"
              style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)' }}>
              {d[yKey]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function XAxisLabels({ data, xKey, maxLabels = 7 }) {
  if (!data?.length) return null;
  const step = Math.ceil(data.length / maxLabels);
  return (
    <div className="flex w-full mt-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 text-center">
          {i % step === 0 && (
            <span className="text-[10px] text-gray-600">
              {String(d[xKey]).length === 10
                ? new Date(d[xKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : d[xKey]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function DeviceChart({ data }) {
  if (!data?.length) return <div className="text-gray-600 text-sm py-4 text-center">No data</div>;
  const total = data.reduce((s, d) => s + d.count, 0);
  const COLORS = { desktop: '#f97316', mobile: '#8b5cf6', tablet: '#34d399' };
  const ICONS  = { desktop: '🖥', mobile: '📱', tablet: '📟' };
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => {
        const pct = total ? Math.round((d.count / total) * 100) : 0;
        const color = COLORS[d.device] || '#6b7280';
        return (
          <div key={d.device} className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{ICONS[d.device] || '?'}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-gray-300 capitalize">{d.device}</span>
                <span className="text-xs text-gray-500">{d.count} ({pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── World Map Heatmap ─────────────────────────────────────────────────────────
// Equirectangular projection: lon → x, lat → y
const MAP_W = 800;
const MAP_H = 400;

function latLonToXY(lat, lon) {
  const x = ((lon + 180) / 360) * MAP_W;
  const y = ((90 - lat) / 180) * MAP_H;
  return [x, y];
}

// Simplified world country paths (major landmasses as rough polygons)
// Using a minimal SVG world map path data
const WORLD_PATH = "M 72 140 L 78 135 L 85 132 L 92 130 L 100 128 L 108 127 L 115 128 L 120 132 L 118 138 L 112 142 L 105 145 L 98 146 L 90 145 L 82 143 Z M 130 120 L 138 115 L 148 112 L 158 110 L 168 109 L 178 110 L 185 114 L 190 120 L 188 128 L 182 134 L 174 138 L 165 140 L 156 139 L 148 136 L 140 130 L 133 124 Z M 200 100 L 215 95 L 230 92 L 245 91 L 258 93 L 268 98 L 274 106 L 272 115 L 265 122 L 255 127 L 243 129 L 231 128 L 220 124 L 210 118 L 203 110 Z M 290 130 L 300 125 L 312 122 L 324 121 L 335 123 L 343 128 L 347 136 L 344 144 L 337 150 L 327 154 L 316 155 L 305 153 L 296 148 L 291 140 Z M 355 145 L 368 140 L 382 137 L 396 136 L 408 138 L 417 143 L 421 151 L 418 160 L 410 167 L 399 171 L 387 172 L 375 170 L 364 165 L 357 157 Z M 430 155 L 445 150 L 460 147 L 474 146 L 486 148 L 495 154 L 499 163 L 496 172 L 488 179 L 477 183 L 465 184 L 453 182 L 442 177 L 434 169 Z M 510 160 L 525 155 L 540 152 L 554 151 L 566 153 L 575 159 L 579 168 L 576 177 L 568 184 L 557 188 L 545 189 L 533 187 L 522 182 L 514 174 Z M 590 170 L 605 165 L 618 162 L 630 161 L 640 163 L 648 169 L 651 178 L 648 187 L 640 194 L 629 198 L 617 199 L 605 197 L 594 192 L 587 184 Z M 660 175 L 672 170 L 684 167 L 695 166 L 704 168 L 711 174 L 714 183 L 711 192 L 703 199 L 692 203 L 680 204 L 668 202 L 657 197 L 651 189 Z M 720 180 L 732 175 L 744 172 L 755 171 L 764 173 L 771 179 L 774 188 L 771 197 L 763 204 L 752 208 L 740 209 L 728 207 L 717 202 L 711 194 Z";

function WorldHeatmap({ points }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef();

  if (!points?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <span className="text-4xl mb-3">🌍</span>
        <p className="text-sm">No geo data yet — visits will appear here once tracked</p>
      </div>
    );
  }

  const maxCount = Math.max(...points.map((p) => p.count), 1);

  return (
    <div className="relative w-full" style={{ background: '#0d0d14', borderRadius: 12, overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full"
        style={{ display: 'block' }}
      >
        {/* Ocean background */}
        <rect width={MAP_W} height={MAP_H} fill="#0d1117" />

        {/* Grid lines */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const [, y] = latLonToXY(lat, 0);
          return <line key={lat} x1={0} y1={y} x2={MAP_W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />;
        })}
        {[-120, -60, 0, 60, 120].map((lon) => {
          const [x] = latLonToXY(0, lon);
          return <line key={lon} x1={x} y1={0} x2={x} y2={MAP_H} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />;
        })}

        {/* Continent outlines — simplified rects as landmass hints */}
        {[
          // North America
          { x: 30, y: 60, w: 160, h: 130, rx: 8 },
          // South America
          { x: 110, y: 200, w: 90, h: 120, rx: 8 },
          // Europe
          { x: 330, y: 55, w: 80, h: 80, rx: 6 },
          // Africa
          { x: 330, y: 145, w: 100, h: 140, rx: 8 },
          // Asia
          { x: 415, y: 45, w: 240, h: 150, rx: 8 },
          // Australia
          { x: 590, y: 230, w: 100, h: 70, rx: 8 },
          // Greenland
          { x: 175, y: 30, w: 60, h: 50, rx: 6 },
        ].map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx}
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
        ))}

        {/* Heatmap glow blobs */}
        {points.map((p, i) => {
          const [x, y] = latLonToXY(p.lat, p.lon);
          const intensity = p.count / maxCount;
          const r = Math.max(8, intensity * 40);
          return (
            <circle key={`glow-${i}`} cx={x} cy={y} r={r}
              fill={`rgba(249,115,22,${intensity * 0.35})`}
              style={{ filter: 'blur(8px)' }} />
          );
        })}

        {/* Dot markers */}
        {points.map((p, i) => {
          const [x, y] = latLonToXY(p.lat, p.lon);
          const intensity = p.count / maxCount;
          const r = Math.max(3, intensity * 10);
          const color = intensity > 0.6 ? '#f97316' : intensity > 0.3 ? '#fb923c' : '#8b5cf6';
          return (
            <circle key={`dot-${i}`} cx={x} cy={y} r={r}
              fill={color}
              fillOpacity={0.85}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={0.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const svg = svgRef.current;
                const rect = svg.getBoundingClientRect();
                const scaleX = rect.width / MAP_W;
                const scaleY = rect.height / MAP_H;
                setTooltip({ x: x * scaleX + rect.left, y: y * scaleY + rect.top, p });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* Axis labels */}
        <text x={4} y={MAP_H / 2 + 4} fill="rgba(255,255,255,0.2)" fontSize={8}>0°</text>
        <text x={MAP_W / 2 - 4} y={MAP_H - 4} fill="rgba(255,255,255,0.2)" fontSize={8}>0°</text>
      </svg>

      {/* Tooltip portal-style (fixed) */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl px-3 py-2 text-xs text-white shadow-2xl"
          style={{
            left: tooltip.x + 12, top: tooltip.y - 40,
            background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.15)',
            transform: 'translateY(-50%)',
          }}>
          <p className="font-semibold">{tooltip.p.city ? `${tooltip.p.city}, ` : ''}{tooltip.p.country}</p>
          <p style={{ color: '#f97316' }}>{tooltip.p.count} visit{tooltip.p.count !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] text-gray-500">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#8b5cf6' }} /> Low
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#fb923c' }} /> Med
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#f97316' }} /> High
      </div>
    </div>
  );
}

// Country list
function GeoTable({ data }) {
  if (!data?.length) return <div className="text-gray-600 text-sm py-6 text-center">No country data yet</div>;
  const max = data[0]?.count || 1;
  return (
    <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
      {data.map((c, i) => {
        const pct = Math.round((c.count / max) * 100);
        return (
          <div key={c.countryCode} className="flex items-center gap-3 px-1 py-1.5 rounded-lg transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            <span className="text-gray-600 text-xs w-4 text-right font-mono">{i + 1}</span>
            <span className="text-base leading-none">
              {/* Country flag emoji from countryCode */}
              {c.countryCode
                ? String.fromCodePoint(...[...c.countryCode.toUpperCase()].map((ch) => 0x1F1E6 - 65 + ch.charCodeAt(0)))
                : '🌐'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-0.5">
                <span className="text-sm text-gray-200 truncate">{c.country || 'Unknown'}</span>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{c.count}</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(to right, #f97316, #8b5cf6)' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?days=${days}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const avgDaily = data?.dailyViews?.length
    ? Math.round(data.totalViews / data.dailyViews.length) : 0;
  const peakHour = data?.hourlyActivity?.reduce((a, b) => b.count > a.count ? b : a, { hour: 0, count: 0 });
  const topCountry = data?.geoBreakdown?.[0];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">Visitor activity, traffic and geo insights</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setDays(r.days)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: days === r.days ? 'rgba(255,255,255,0.08)' : 'transparent', color: days === r.days ? '#fff' : '#6b7280' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Views"     value={data?.totalViews?.toLocaleString()}     sub={`last ${days} days`} />
            <StatCard label="Unique Visitors" value={data?.uniqueVisitors?.toLocaleString()} sub="by IP" color="#8b5cf6" />
            <StatCard label="Avg / Day"       value={avgDaily?.toLocaleString()}              sub="page views" color="#34d399" />
            <StatCard label="Top Country"
              value={topCountry ? (
                topCountry.countryCode
                  ? String.fromCodePoint(...[...topCountry.countryCode.toUpperCase()].map((ch) => 0x1F1E6 - 65 + ch.charCodeAt(0)))
                  : '🌐'
              ) : '—'}
              sub={topCountry ? `${topCountry.country} · ${topCountry.count} visits` : 'no data'}
              color="#f97316" />
          </div>

          {/* World heatmap */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-white">Visitor World Map</h2>
                <p className="text-gray-600 text-xs mt-0.5">Geographic distribution of visitors</p>
              </div>
              <span className="text-xs text-gray-600 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {data?.geoPoints?.length || 0} locations
              </span>
            </div>
            <WorldHeatmap points={data?.geoPoints} />
          </div>

          {/* Geo table + device */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl p-6" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-bold text-white mb-1">Top Countries</h2>
              <p className="text-gray-600 text-xs mb-4">Visitors by country</p>
              <GeoTable data={data?.geoBreakdown} />
            </div>
            <div className="rounded-2xl p-6" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-bold text-white mb-1">Devices</h2>
              <p className="text-gray-600 text-xs mb-4">Visitor device types</p>
              <DeviceChart data={data?.deviceBreakdown} />
            </div>
          </div>

          {/* Daily traffic */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-white">Daily Traffic</h2>
                <p className="text-gray-600 text-xs mt-0.5">Page views per day</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#f97316' }} /> Views</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#8b5cf6' }} /> Unique</span>
              </div>
            </div>
            <div className="relative">
              <BarChart data={data?.dailyViews} xKey="date" yKey="views" color="#f97316" height={140} />
              <div className="absolute inset-0 pointer-events-none">
                <BarChart data={data?.dailyViews} xKey="date" yKey="unique" color="#8b5cf6" height={140} />
              </div>
            </div>
            <XAxisLabels data={data?.dailyViews} xKey="date" />
          </div>

          {/* Hourly + top pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl p-6" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-bold text-white mb-1">Hourly Activity</h2>
              <p className="text-gray-600 text-xs mb-5">When visitors are most active</p>
              <BarChart data={data?.hourlyActivity} xKey="hour" yKey="count" color="#8b5cf6" height={100} />
              <div className="flex justify-between mt-1 text-[10px] text-gray-600">
                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h2 className="font-bold text-white">Top Pages</h2>
                <p className="text-gray-600 text-xs mt-0.5">Most visited endpoints</p>
              </div>
              {!data?.topPages?.length ? (
                <div className="py-10 text-center text-gray-600 text-sm">No data yet</div>
              ) : data.topPages.map((p, i) => {
                const pct = Math.round((p.views / (data.topPages[0]?.views || 1)) * 100);
                return (
                  <div key={p.path} className="flex items-center gap-3 px-5 py-2.5 transition-colors"
                    style={{ borderBottom: i < data.topPages.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                    <span className="text-gray-600 text-xs w-4 text-right font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 font-mono truncate">{p.path}</p>
                      <div className="h-1 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(to right, #f97316, #8b5cf6)' }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white flex-shrink-0">{p.views.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
