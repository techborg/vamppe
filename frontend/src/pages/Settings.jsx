import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import SEOHead from '../components/SEOHead';
import { BackIcon } from '../components/Icons';

// ── Section icons ─────────────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const SECTIONS = [
  { id: 'profile',       label: 'Profile',       icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  { id: 'account',       label: 'Account',       icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'privacy',       label: 'Privacy',       icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4' },
  { id: 'notifications', label: 'Notifications', icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0' },
  { id: 'appearance',    label: 'Appearance',    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2' },
  { id: 'danger',        label: 'Danger Zone',   icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
];

// ── Reusable primitives ───────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all';
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
const focusBorder = 'rgba(249,115,22,0.45)';

function Input({ label, hint, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      <input className={inputCls} style={inputStyle}
        onFocus={(e) => e.target.style.borderColor = focusBorder}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        {...props} />
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {desc && <p className="text-xs text-gray-600 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className="relative flex-shrink-0 w-10 h-5.5 rounded-full transition-all duration-200"
        style={{ background: value ? '#f97316' : 'rgba(255,255,255,0.12)', width: 40, height: 22 }}>
        <span className="absolute top-0.5 rounded-full bg-white transition-all duration-200 shadow"
          style={{ width: 18, height: 18, left: value ? 20 : 2 }} />
      </button>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {title && (
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</p>
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function SaveBar({ saving, onSave, dirty }) {
  if (!dirty) return null;
  return (
    <div className="flex justify-end mt-5">
      <button onClick={onSave} disabled={saving}
        className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
        {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const colors = { success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' }, error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171' } };
  const c = colors[type] || colors.success;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold animate-slide-up"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, backdropFilter: 'blur(12px)' }}>
      {msg}
    </div>
  );
}

// ── Section: Profile ──────────────────────────────────────────────────────────
function ProfileSection({ data, onSaved, showToast }) {
  const [form, setForm] = useState({ displayName: data.displayName || '', bio: data.bio || '', website: data.website || '', location: data.location || '' });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/settings', form);
      onSaved(res.data);
      setDirty(false);
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      <SectionCard title="Public info">
        <div className="flex flex-col gap-4">
          <Input label="Display name" placeholder="Your name" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bio</label>
            <textarea className={inputCls + ' resize-none'} style={inputStyle} rows={3}
              onFocus={(e) => e.target.style.borderColor = focusBorder}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              placeholder="Tell the world about yourself…"
              value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
          <Input label="Website" placeholder="https://yoursite.com" value={form.website} onChange={(e) => set('website', e.target.value)} />
          <Input label="Location" placeholder="City, Country" value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>
      </SectionCard>
      <SaveBar saving={saving} onSave={save} dirty={dirty} />
    </>
  );
}

// ── Section: Account ──────────────────────────────────────────────────────────
function AccountSection({ data, onSaved, showToast }) {
  const [uForm, setUForm] = useState({ username: data.username || '', email: data.email || '' });
  const [pForm, setPForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [uDirty, setUDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveAccount = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/settings', uForm);
      onSaved(res.data);
      setUDirty(false);
      showToast('Account updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pForm.newPassword !== pForm.confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    if (pForm.newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setSaving(true);
    try {
      await api.patch('/users/settings', { currentPassword: pForm.currentPassword, newPassword: pForm.newPassword });
      setPForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      <SectionCard title="Login details">
        <div className="flex flex-col gap-4">
          <Input label="Username" placeholder="username"
            value={uForm.username}
            onChange={(e) => { setUForm((f) => ({ ...f, username: e.target.value })); setUDirty(true); }}
            hint="Letters, numbers, and underscores only" />
          <Input label="Email address" type="email" placeholder="you@example.com"
            value={uForm.email}
            onChange={(e) => { setUForm((f) => ({ ...f, email: e.target.value })); setUDirty(true); }} />
        </div>
        <SaveBar saving={saving} onSave={saveAccount} dirty={uDirty} />
      </SectionCard>

      <SectionCard title="Change password">
        <div className="flex flex-col gap-4">
          <Input label="Current password" type="password" placeholder="••••••••"
            value={pForm.currentPassword} onChange={(e) => setPForm((f) => ({ ...f, currentPassword: e.target.value }))} />
          <Input label="New password" type="password" placeholder="Min 6 characters"
            value={pForm.newPassword} onChange={(e) => setPForm((f) => ({ ...f, newPassword: e.target.value }))} />
          <Input label="Confirm new password" type="password" placeholder="Repeat new password"
            value={pForm.confirmPassword} onChange={(e) => setPForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
        </div>
        <SaveBar saving={saving} onSave={savePassword} dirty={!!pForm.currentPassword} />
      </SectionCard>
    </>
  );
}

// ── Section: Privacy ──────────────────────────────────────────────────────────
function PrivacySection({ data, onSaved, showToast }) {
  const [s, setS] = useState(data.settings || {});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setS((p) => ({ ...p, [k]: v })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/settings', { settings: s });
      onSaved(res.data);
      setDirty(false);
      showToast('Privacy settings saved', 'success');
    } catch (err) {
      showToast('Failed to save', 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      <SectionCard title="Account privacy">
        <Toggle label="Private account" desc="Only approved followers can see your posts"
          value={!!s.privateAccount} onChange={(v) => set('privateAccount', v)} />
        <Toggle label="Show online status" desc="Let others see when you're active"
          value={s.showOnlineStatus !== false} onChange={(v) => set('showOnlineStatus', v)} />
      </SectionCard>

      <SectionCard title="Messages">
        <div className="flex flex-col gap-1.5 py-2">
          <p className="text-sm font-medium text-gray-200 mb-2">Who can send you messages</p>
          {[['everyone', 'Everyone'], ['following', 'People I follow'], ['none', 'No one']].map(([val, label]) => (
            <label key={val} className="flex items-center gap-3 cursor-pointer py-1.5">
              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{ borderColor: s.allowMessagesFrom === val ? '#f97316' : 'rgba(255,255,255,0.2)', background: s.allowMessagesFrom === val ? '#f97316' : 'transparent' }}
                onClick={() => set('allowMessagesFrom', val)}>
                {s.allowMessagesFrom === val && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </SectionCard>
      <SaveBar saving={saving} onSave={save} dirty={dirty} />
    </>
  );
}

// ── Section: Notifications ────────────────────────────────────────────────────
function NotificationsSection({ data, onSaved, showToast }) {
  const [s, setS] = useState(data.settings || {});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setS((p) => ({ ...p, [k]: v })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/settings', { settings: s });
      onSaved(res.data);
      setDirty(false);
      showToast('Notification preferences saved', 'success');
    } catch (err) {
      showToast('Failed to save', 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      <SectionCard title="Activity notifications">
        <Toggle label="Likes" desc="When someone likes your post"
          value={s.notifyLikes !== false} onChange={(v) => set('notifyLikes', v)} />
        <Toggle label="Comments" desc="When someone replies to your post"
          value={s.notifyComments !== false} onChange={(v) => set('notifyComments', v)} />
        <Toggle label="New followers" desc="When someone follows you"
          value={s.notifyFollows !== false} onChange={(v) => set('notifyFollows', v)} />
        <Toggle label="Messages" desc="When you receive a new message"
          value={s.notifyMessages !== false} onChange={(v) => set('notifyMessages', v)} />
      </SectionCard>
      <SaveBar saving={saving} onSave={save} dirty={dirty} />
    </>
  );
}

// ── Section: Appearance ───────────────────────────────────────────────────────
const ACCENTS = [
  { value: 'orange', label: 'Orange',  color: '#f97316' },
  { value: 'violet', label: 'Violet',  color: '#8b5cf6' },
  { value: 'rose',   label: 'Rose',    color: '#f43f5e' },
  { value: 'cyan',   label: 'Cyan',    color: '#06b6d4' },
  { value: 'green',  label: 'Green',   color: '#22c55e' },
];

function AppearanceSection({ data, onSaved, showToast }) {
  const [s, setS] = useState(data.settings || {});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/settings', { settings: s });
      onSaved(res.data);
      setDirty(false);
      showToast('Appearance saved', 'success');
    } catch (err) {
      showToast('Failed to save', 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      <SectionCard title="Accent color">
        <p className="text-xs text-gray-600 mb-4">Choose your preferred accent color (applies on next login)</p>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map((a) => (
            <button key={a.value} onClick={() => { setS((p) => ({ ...p, accentColor: a.value })); setDirty(true); }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
              style={{
                background: s.accentColor === a.value ? `${a.color}15` : 'rgba(255,255,255,0.03)',
                border: `2px solid ${s.accentColor === a.value ? a.color : 'rgba(255,255,255,0.08)'}`,
              }}>
              <span className="w-7 h-7 rounded-full" style={{ background: a.color }} />
              <span className="text-xs font-semibold" style={{ color: s.accentColor === a.value ? a.color : '#6b7280' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>
      <SaveBar saving={saving} onSave={save} dirty={dirty} />
    </>
  );
}

// ── Section: Danger Zone ──────────────────────────────────────────────────────
function DangerSection({ showToast }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    if (!password) { showToast('Enter your password to confirm', 'error'); return; }
    setDeleting(true);
    try {
      await api.delete('/users/account', { data: { password } });
      logout();
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete account', 'error');
    } finally { setDeleting(false); }
  };

  return (
    <SectionCard title="Danger zone">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl p-4 flex items-start justify-between gap-4"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div>
            <p className="text-sm font-semibold text-red-400">Delete account</p>
            <p className="text-xs text-gray-600 mt-0.5">Permanently delete your account and all your data. This cannot be undone.</p>
          </div>
          <button onClick={() => setConfirm(true)}
            className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}>
            Delete account
          </button>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
            style={{ background: '#0f0f16', border: '1px solid rgba(239,68,68,0.25)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-white text-lg mb-1">Delete your account?</h3>
            <p className="text-gray-500 text-sm mb-5">All your posts, messages, and data will be permanently removed. Enter your password to confirm.</p>
            <input className={inputCls + ' mb-4'} style={inputStyle} type="password" placeholder="Your password"
              onFocus={(e) => e.target.style.borderColor = 'rgba(239,68,68,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
              <button onClick={deleteAccount} disabled={deleting}
                className="text-sm font-semibold py-2 px-5 rounded-xl transition-all flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {deleting && <span className="w-3.5 h-3.5 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" />}
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ── Main Settings page ────────────────────────────────────────────────────────
export default function Settings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('profile');
  const [data, setData] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  useEffect(() => {
    api.get('/users/settings').then((r) => setData(r.data)).catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const handleSaved = (updated) => {
    setData((d) => ({ ...d, ...updated }));
    updateUser({ ...user, ...updated });
  };

  const activeSection = SECTIONS.find((s) => s.id === active);

  return (
    <div className="animate-fade-in min-h-screen">
      <SEOHead title="Settings" noIndex />

      {/* Sticky header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b px-4 py-3 flex items-center gap-4"
        style={{ background: 'rgba(10,10,15,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl transition-all text-gray-500 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
          <BackIcon className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-sm">Settings</p>
          <p className="text-gray-600 text-xs">{activeSection?.label}</p>
        </div>
      </div>

      <div className="flex max-w-4xl mx-auto">
        {/* Sidebar nav */}
        <nav className="w-52 flex-shrink-0 sticky top-14 h-fit py-6 px-3">
          {/* User card */}
          <div className="flex items-center gap-2.5 px-3 py-3 mb-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Avatar src={user?.profilePicture} size={9} />
            <div className="min-w-0">
              <p className="font-semibold text-xs text-white truncate">{user?.displayName || user?.username}</p>
              <p className="text-gray-600 text-[11px] truncate">@{user?.username}</p>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            {SECTIONS.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left w-full"
                style={{
                  background: active === id ? (id === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)') : 'transparent',
                  color: active === id ? (id === 'danger' ? '#f87171' : '#fb923c') : id === 'danger' ? '#ef4444' : '#9ca3af',
                  fontWeight: active === id ? 600 : 400,
                }}>
                <Icon d={icon} className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 py-6 px-5 min-w-0">
          {!data ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {active === 'profile'       && <ProfileSection       data={data} onSaved={handleSaved} showToast={showToast} />}
              {active === 'account'       && <AccountSection       data={data} onSaved={handleSaved} showToast={showToast} />}
              {active === 'privacy'       && <PrivacySection       data={data} onSaved={handleSaved} showToast={showToast} />}
              {active === 'notifications' && <NotificationsSection data={data} onSaved={handleSaved} showToast={showToast} />}
              {active === 'appearance'    && <AppearanceSection    data={data} onSaved={handleSaved} showToast={showToast} />}
              {active === 'danger'        && <DangerSection        showToast={showToast} />}
            </>
          )}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
