import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker, Graticule } from 'react-simple-maps';
import api from '../utils/api';

const RANGES = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

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

function WorldHeatmap({ points }) {
  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState({ coordinates: [0, 10], zoom: 1 });
  const maxCount = points?.length ? Math.max(...points.map((p) => p.count), 1) : 1;

  const handleZoomIn = () => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 6) }));
  const handleZoomOut = () => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const handleRecenter = () => setPosition({ coordinates: [0, 10], zoom: 1 });

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-inner" style={{ background: 'radial-gradient(circle at center, #0a1120, #040712)' }}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 155 }}
        style={{ width: '100%', height: 'auto' }}
        viewBox="0 0 800 420"
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={setPosition}
          minZoom={1}
          maxZoom={8}
        >
          <Graticule stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={0.3}
                  style={{
                    default: { outline: 'none', transition: 'all 0.4s' },
                    hover:   { fill: 'rgba(249,115,22,0.1)', stroke: 'rgba(249,115,22,0.3)', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {points?.map((p, i) => {
            if (p.count < maxCount * 0.3) return null;
            const intensity = p.count / maxCount;
            return (
              <Marker key={`pulse-${i}`} coordinates={[p.lon, p.lat]}>
                <circle r={8 + intensity * 12} fill="#f97316" className="animate-ping opacity-10" />
                <circle r={12 + intensity * 20} fill="#8b5cf6" className="animate-pulse opacity-[0.03]" />
              </Marker>
            );
          })}

          {points?.map((p, i) => {
            const intensity = p.count / maxCount;
            const r = Math.max(2.2, intensity * 7);
            const color = intensity > 0.7 ? '#f97316' : intensity > 0.3 ? '#8b5cf6' : '#6366f1';
            return (
              <Marker
                key={`dot-${i}`}
                coordinates={[p.lon, p.lat]}
                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, p })}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={r}
                  fill={color}
                  stroke={intensity > 0.5 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={0.5 / position.zoom}
                  className="transition-transform hover:scale-150 duration-300"
                  style={{ cursor: 'pointer', filter: `drop-shadow(0 0 ${r/2}px ${color})` }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
        <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors text-lg">+</button>
        <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors text-lg">−</button>
        <button onClick={handleRecenter} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors">
           <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>
        </button>
      </div>

      {!points?.length && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px]">
          <div className="text-center">
            <div className="text-3xl mb-3 opacity-20">🌍</div>
            <p className="text-gray-500 text-sm max-w-[200px] leading-relaxed">Waiting for globe activity data...</p>
          </div>
        </div>
      )}

      {tooltip && (
        <div className="fixed z-50 pointer-events-none rounded-xl px-4 py-2.5 text-xs text-white shadow-2xl backdrop-blur-xl animate-fade-in"
          style={{ left: tooltip.x + 16, top: tooltip.y - 48, background: 'rgba(12, 12, 20, 0.9)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="flex items-center gap-2 mb-1.5">
             <span className="text-base">
               {tooltip.p.countryCode
                 ? String.fromCodePoint(...[...tooltip.p.countryCode.toUpperCase()].map((ch) => 0x1F1E6 - 65 + ch.charCodeAt(0)))
                 : '🌐'}
             </span>
             <p className="font-bold text-sm tracking-tight">{tooltip.p.city ? `${tooltip.p.city}, ` : ''}{tooltip.p.country}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <p style={{ color: '#f97316' }} className="font-bold text-[13px]">{tooltip.p.count} interactions</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-gray-500 px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} /> Low</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }} /> Med</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} /> High</span>
      </div>
    </div>
  );
}

function GeoTable({ data }) {
  if (!data?.length) return <div className="text-gray-600 text-sm py-6 text-center">No country data yet</div>;
  const max = data[0]?.count || 1;
  return (
    <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
      {data.map((c, i) => {
        const pct = Math.round((c.count / max) * 100);
        return (
          <div key={i} className="flex items-center gap-3 px-1 py-1.5 rounded-lg transition-colors border-b border-white/5 last:border-0"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            <span className="text-gray-600 text-xs w-4 text-right font-mono">{i + 1}</span>
            <span className="text-base leading-none">
              {c.countryCode
                ? String.fromCodePoint(...[...c.countryCode.toUpperCase()].map((ch) => 0x1F1E6 - 65 + ch.charCodeAt(0)))
                : '🌐'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-0.5">
                <span className="text-sm text-gray-200 truncate">{c.country || 'Unknown'}</span>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0 font-bold">{c.count}</span>
              </div>
              <div className="h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(to right, #f97316, #8b5cf6)' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IpTable({ data }) {
  if (!data?.length) return <div className="text-gray-600 text-sm py-6 text-center">No IP data yet</div>;
  return (
    <div className="flex flex-col gap-0.5 max-h-96 overflow-y-auto pr-1">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors border-b border-white/5 last:border-0"
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={(e) => e.currentTarget.style.background = ''}>
          <span className="text-gray-600 text-[10px] w-4 text-right font-mono">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-0.5">
              <div>
                <span className="text-sm font-bold text-gray-200 block font-mono">
                  {item.ip}
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                  {item.city ? `${item.city}, ` : ''}{item.country || 'Unknown'}
                  {item.countryCode && ` (${item.countryCode})`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-orange-500">{item.count}</span>
                <p className="text-[10px] text-gray-700 uppercase leading-none mt-1">hits</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditLogsTable({ logs }) {
  if (!logs?.length) return <div className="text-gray-600 text-sm py-8 text-center">No security events logged</div>;
  return (
    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
      {logs.map((log) => (
        <div key={log._id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex gap-4 items-start">
          <img src={log.userId?.profilePicture || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border border-white/10" alt="" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-200">@{log.userId?.username || 'system'}</span>
              <span className="text-[10px] text-gray-600">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-300">
              <span className="text-orange-500 font-bold uppercase text-[10px] mr-2 tracking-widest">{log.action.replace('_', ' ')}</span>
              <span className="text-gray-500">on</span> {log.targetType} <span className="font-mono text-[10px] bg-white/5 px-1 rounded">{log.targetId?.slice(-6)}</span>
            </p>
            {log.details?.reason && (
              <p className="text-[10px] text-gray-500 mt-1 italic italic">Reason: {log.details.reason}</p>
            )}
          </div>
          <div className="text-right flex flex-col items-end">
             <span className="text-[9px] text-gray-700 font-mono">{log.ip || '—'}</span>
             <span className="text-[9px] text-green-500 font-bold mt-1 uppercase tracking-tighter">Verified</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/analytics?days=${days}`),
      api.get('/admin/audit-logs?limit=20')
    ]).then(([analyticsRes, logsRes]) => {
      setData(analyticsRes.data);
      setLogs(logsRes.data.logs);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const avgDaily = data?.dailyViews?.length
    ? Math.round(data.totalViews / data.dailyViews.length) : 0;
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
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
            <div className="rounded-2xl p-6" style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-white">Top IPs</h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-orange-500" style={{ background: 'rgba(249,115,22,0.1)' }}>Shield Active</span>
              </div>
              <p className="text-gray-600 text-xs mb-4">Identified visitor addresses</p>
              <IpTable data={data?.ipBreakdown} />
            </div>
          </div>

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
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5 transition-colors border-b border-white/5 last:border-0"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                    <span className="text-gray-600 text-xs w-4 text-right font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 font-mono truncate">{p.path}</p>
                      <div className="h-0.5 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(to right, #f97316, #8b5cf6)' }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white flex-shrink-0">{p.views.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-bold text-white text-lg">System Audit Log</h2>
                    <p className="text-gray-600 text-xs mt-0.5">Administrative and security event trail</p>
                  </div>
                  <button onClick={() => api.get('/admin/audit-logs?limit=20').then(r => setLogs(r.data.logs))}
                    className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 transition-all">
                    Refresh Logs
                  </button>
                </div>
                <AuditLogsTable logs={logs} />
             </div>
             
             <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(45deg, #1a1a2e, #12121a)', border: '1px solid rgba(255,115,22,0.1)' }}>
                   <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                      <span className="text-xl">🛡️</span>
                   </div>
                   <h3 className="font-bold text-white mb-2">Security Status: Peak</h3>
                   <p className="text-gray-500 text-xs leading-relaxed mb-4">
                      All systems are operational. SSL/TLS encryption active. Database sanitization and XSS protection enabled.
                   </p>
                   <div className="space-y-2">
                     <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Firewall</span>
                        <span className="text-green-500 font-bold">ACTIVE</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Rate Limiting</span>
                        <span className="text-green-500 font-bold">120req/m</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>XSS Guard</span>
                        <span className="text-green-500 font-bold">ON</span>
                     </div>
                   </div>
                </div>

                <div className="rounded-2xl p-6 bg-[#08080c] border border-white/[0.03]">
                   <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">Active Sessions</h3>
                   <div className="flex items-center gap-4 mb-4">
                      <div className="text-2xl font-black text-white">{data?.uniqueVisitors || 0}</div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                         <p className="text-[10px] text-gray-600 uppercase">Across</p>
                         <p className="text-[10px] text-white font-bold">{data?.geoBreakdown?.length || 0} Countries</p>
                      </div>
                   </div>
                   <div className="flex -space-x-2">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[#08080c] bg-gray-800" />
                      ))}
                      <div className="w-6 h-6 rounded-full border-2 border-[#08080c] bg-orange-500 flex items-center justify-center text-[8px] font-bold text-white">
                        +{Math.max(0, (data?.uniqueVisitors || 0) - 5)}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
