import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import FollowModal from '../components/FollowModal';
import VerifiedBadge from '../components/VerifiedBadge';
import SEOHead from '../components/SEOHead';
import { BackIcon, CameraIcon, EditIcon, CalendarIcon, ChatIcon } from '../components/Icons';

const CATEGORIES = [
  { value: 'creator',    label: 'Creator / Influencer' },
  { value: 'brand',      label: 'Brand / Business' },
  { value: 'journalist', label: 'Journalist / Media' },
  { value: 'athlete',    label: 'Athlete / Sports' },
  { value: 'other',      label: 'Other' },
];

function VerifyRequestModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ fullName: '', category: 'creator', reason: '', links: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
  const focusBorder = 'rgba(249,115,22,0.45)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users/verification-request', form);
      onSubmit();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: '#0f0f16', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="font-bold text-white">Request verification</h2>
            <p className="text-gray-600 text-xs mt-0.5">Tell us who you are and why you should be verified</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full legal name</label>
            <input className={inputCls} style={inputStyle} placeholder="Your real name"
              onFocus={(e) => e.target.style.borderColor = focusBorder}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
            <select className={inputCls} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = focusBorder}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Why should you be verified?</label>
            <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={4}
              onFocus={(e) => e.target.style.borderColor = focusBorder}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              placeholder="Describe your public presence, work, or why your account should be verified…"
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supporting links <span className="normal-case font-normal text-gray-600">(optional)</span></label>
            <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2}
              onFocus={(e) => e.target.style.borderColor = focusBorder}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              placeholder="Website, social profiles, news articles…"
              value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-ghost text-sm py-2 px-4">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm py-2 px-5">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</span>
                : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LinkIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);
const MapPinIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const HeartIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const ImageIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

function EditModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    displayName: profile.displayName || '',
    username: profile.username || '',
    bio: profile.bio || '',
    website: profile.website || '',
    location: profile.location || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef();
  const coverRef = useRef();

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append('profilePicture', avatarFile);
      if (coverFile) fd.append('coverPicture', coverFile);
      const res = await api.put('/users/profile', fd);
      onSave(res.data);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };
  const focusStyle = 'rgba(249,115,22,0.45)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: '#0f0f16', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white">Edit profile</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 px-4">
              {saving ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</span> : 'Save'}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[75vh]">
          {/* Cover photo */}
          <div className="relative h-32 cursor-pointer group" onClick={() => coverRef.current.click()}
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(139,92,246,0.25))' }}>
            {(coverPreview || profile.coverPicture) && (
              <img src={coverPreview || (profile.coverPicture?.startsWith('http') ? profile.coverPicture : `${BASE_URL}${profile.coverPicture}`)}
                className="w-full h-full object-cover" alt="" />
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <CameraIcon className="w-4 h-4" /> Change cover
              </div>
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} />
          </div>

          {/* Avatar */}
          <div className="px-5 -mt-8 mb-5">
            <div className="relative inline-block cursor-pointer group" onClick={() => avatarRef.current.click()}>
              <Avatar src={avatarPreview || profile.profilePicture} size={16}
                className="border-4" style={{ borderColor: '#0f0f16' }} />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <CameraIcon className="w-4 h-4 text-white" />
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
            </div>
          </div>

          {/* Fields */}
          <div className="px-5 pb-5 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display name</label>
                <input className={inputCls} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = focusStyle}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  placeholder="Your name" value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</label>
                <input className={inputCls} style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = focusStyle}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  placeholder="username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bio</label>
              <textarea className={inputCls + ' resize-none'} style={inputStyle} rows={3}
                onFocus={(e) => e.target.style.borderColor = focusStyle}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                placeholder="Tell the world about yourself…" value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</label>
              <input className={inputCls} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = focusStyle}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                placeholder="https://yoursite.com" value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</label>
              <input className={inputCls} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = focusStyle}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                placeholder="City, Country" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile({ username: usernameProp }) {
  const params = useParams();
  const username = usernameProp || params.username;
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [mediaPosts, setMediaPosts] = useState([]);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyRequest, setVerifyRequest] = useState(null);
  const isMe = profile?._id === user._id;

  useEffect(() => {
    setLoading(true);
    setTab('posts');
    setProfile(null);
    api.get(`/users/by-username/${username}`)
      .then((u) => {
        setProfile(u.data);
        return api.get(`/posts/user/${u.data._id}`).then((p) => {
          const all = Array.isArray(p.data) ? p.data : p.data.posts || [];
          setPosts(all);
          setMediaPosts(all.filter((post) => post.image));
        });
      })
      .finally(() => setLoading(false));
  }, [username]);

  // Fetch own verification request status
  useEffect(() => {
    if (isMe) {
      api.get('/users/verification-request')
        .then((r) => setVerifyRequest(r.data.verificationRequest))
        .catch(() => {});
    }
  }, [isMe]);

  useEffect(() => {
    if (tab === 'likes' && likedPosts.length === 0 && profile?._id) {
      api.get(`/posts/liked/${profile._id}`).then((r) => setLikedPosts(r.data)).catch(() => {});
    }
  }, [tab, profile]);

  const isFollowing = profile?.followers?.some((f) => f._id === user._id || f === user._id);

  const handleFollow = async () => {
    setFollowLoading(true);
    await api.post(`/users/follow/${profile._id}`);
    const res = await api.get(`/users/by-username/${username}`);
    setProfile(res.data);
    setFollowLoading(false);
  };

  const handleSave = (updated) => {
    setProfile((p) => ({ ...p, ...updated }));
    updateUser({ ...user, ...updated });
    setEditing(false);
  };

  const handleDelete = (pid) => {
    setPosts((prev) => prev.filter((p) => p._id !== pid));
    setMediaPosts((prev) => prev.filter((p) => p._id !== pid));
  };
  const handleUpdate = (u) => {
    setPosts((prev) => prev.map((p) => (p._id === u._id ? u : p)));
    setMediaPosts((prev) => prev.map((p) => (p._id === u._id ? u : p)));
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!profile) return <div className="p-8 text-gray-600 text-center">User not found</div>;

  const coverSrc = profile.coverPicture
    ? (profile.coverPicture.startsWith('http') ? profile.coverPicture : `${BASE_URL}${profile.coverPicture}`)
    : null;

  const displayName = profile.displayName || profile.username;

  const profileImg = profile.profilePicture
    ? (profile.profilePicture.startsWith('http') ? profile.profilePicture : `${BASE_URL}${profile.profilePicture}`)
    : null;

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": displayName,
      "alternateName": `@${profile.username}`,
      "description": profile.bio || `${displayName} on Vamppe`,
      "image": profileImg,
      "url": `https://vamppe.com/${profile.username}`,
      "interactionStatistic": [
        { "@type": "InteractionCounter", "interactionType": "https://schema.org/FollowAction", "userInteractionCount": profile.followers?.length || 0 }
      ]
    }
  };

  const TABS = [
    { key: 'posts',  label: 'Posts',  Icon: EditIcon,  count: posts.length },
    { key: 'media',  label: 'Media',  Icon: ImageIcon, count: mediaPosts.length },
    { key: 'likes',  label: 'Likes',  Icon: HeartIcon, count: null },
  ];

  return (
    <div className="animate-fade-in">
      <SEOHead
        title={`${displayName} (@${profile.username})`}
        description={profile.bio || `Follow ${displayName} on Vamppe — ${profile.followers?.length || 0} followers, ${posts.length} posts.`}
        image={profileImg}
        url={`/${profile.username}`}
        type="profile"
        jsonLd={profileJsonLd}
      />
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
          <p className="font-semibold text-sm leading-tight">{displayName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-gray-600 text-xs">@{profile.username}</p>
            {profile.verified && <VerifiedBadge type={profile.verifiedType || 'blue'} size={11} />}
          </div>
        </div>
      </div>

      {/* Cover */}
      <div className="h-44 relative">
        {coverSrc ? (
          <img src={coverSrc} className="w-full h-full object-cover" alt="" />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.28) 0%, rgba(192,38,211,0.15) 50%, rgba(139,92,246,0.22) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(249,115,22,0.18) 0%, transparent 55%)' }} />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(10,10,15,0.6) 100%)' }} />
      </div>

      {/* Profile body */}
      <div className="px-5 pb-4">
        {/* Avatar row */}
        <div className="flex items-start justify-between mb-5">
          {/* Avatar — pulled up to overlap cover */}
          <div className="relative z-10" style={{ marginTop: '-40px' }}>
            <Avatar
              src={profile.profilePicture}
              size={20}
              ring={isMe}
              style={{ borderColor: '#0a0a0f', borderWidth: '4px', borderStyle: 'solid' }}
            />
          </div>

          <div className="flex gap-2 pt-3">
            {isMe ? (
              <>
                <button onClick={() => setEditing(true)}
                  className="btn-ghost flex items-center gap-1.5 text-xs py-2 px-4">
                  <EditIcon className="w-3.5 h-3.5" /> Edit profile
                </button>
                {!profile.verified && (
                  <button onClick={() => setVerifyModal(true)}
                    className="flex items-center gap-1.5 text-xs py-2 px-4 rounded-xl font-semibold transition-all"
                    style={{
                      background: verifyRequest?.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${verifyRequest?.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      color: verifyRequest?.status === 'pending' ? '#f59e0b' : '#60a5fa',
                    }}>
                    {verifyRequest?.status === 'pending' ? '⏳ Pending review' :
                     verifyRequest?.status === 'rejected' ? '↺ Re-apply' :
                     '✦ Get verified'}
                  </button>
                )}
              </>
            ) : (              <>
                <button onClick={() => navigate(`/chat/${profile.username}`)}
                  className="btn-ghost flex items-center gap-1.5 text-xs py-2 px-4">
                  <ChatIcon className="w-3.5 h-3.5" /> Message
                </button>
                <button onClick={handleFollow} disabled={followLoading}
                  className={isFollowing ? 'btn-following' : 'btn-follow'}>
                  {followLoading
                    ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                    : isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name / meta */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-xl text-white">{displayName}</h2>
            {profile.isAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-gray-500 text-sm">@{profile.username}</p>
            {profile.verified && <VerifiedBadge type={profile.verifiedType || 'blue'} size={14} />}
          </div>

          {profile.bio && (
            <p className="mt-2.5 text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
          )}

          {/* Verification request status banner (own profile only) */}
          {isMe && verifyRequest?.status === 'rejected' && (
            <div className="mt-3 rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-400 text-base leading-none mt-0.5">✕</span>
              <div>
                <p className="text-red-400 text-xs font-semibold">Verification request declined</p>
                {verifyRequest.rejectionReason && (
                  <p className="text-red-400/60 text-xs mt-0.5">{verifyRequest.rejectionReason}</p>
                )}
                <button onClick={() => setVerifyModal(true)} className="text-xs text-red-400 underline underline-offset-2 mt-1 hover:text-red-300 transition-colors">
                  Submit a new request
                </button>
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
            {profile.location && (
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <MapPinIcon className="w-3.5 h-3.5" /> {profile.location}
              </span>
            )}
            {profile.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: '#f97316' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fb923c'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#f97316'}>
                <LinkIcon className="w-3.5 h-3.5" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1 text-gray-500 text-xs">
              <CalendarIcon className="w-3.5 h-3.5" />
              Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-5 text-sm">
          <button className="hover:text-pulse-400 transition-colors" onClick={() => setModal('following')}>
            <span className="font-bold text-white">{profile.following?.length || 0}</span>
            <span className="text-gray-600 ml-1">Following</span>
          </button>
          <button className="hover:text-pulse-400 transition-colors" onClick={() => setModal('followers')}>
            <span className="font-bold text-white">{profile.followers?.length || 0}</span>
            <span className="text-gray-600 ml-1">Followers</span>
          </button>
          <span>
            <span className="font-bold text-white">{posts.length}</span>
            <span className="text-gray-600 ml-1">Posts</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(({ key, label, Icon, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all relative"
              style={{ color: tab === key ? '#fb923c' : '#6b7280' }}>
              <Icon className="w-4 h-4" />
              {label}
              {count !== null && count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: tab === key ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.06)', color: tab === key ? '#f97316' : '#6b7280' }}>
                  {count}
                </span>
              )}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#f97316' }} />
              )}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {tab === 'posts' && (
          posts.length === 0 ? (
            <div className="px-8 py-14 text-center">
              <p className="font-semibold text-white mb-1">No posts yet</p>
              {isMe && <p className="text-gray-600 text-sm">Share something with the world.</p>}
            </div>
          ) : posts.map((p) => (
            <PostCard key={p._id} post={p} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))
        )}

        {/* Media tab */}
        {tab === 'media' && (
          mediaPosts.length === 0 ? (
            <div className="px-8 py-14 text-center">
              <p className="font-semibold text-white mb-1">No media yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {mediaPosts.map((p) => (
                <div key={p._id} className="aspect-square overflow-hidden relative group cursor-pointer"
                  onClick={() => setTab('posts')}>
                  <img
                    src={p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt=""
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-sm font-semibold"
                    style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <span>♥ {p.likes?.length || 0}</span>
                    <span>💬 {p.comments?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Likes tab */}
        {tab === 'likes' && (
          likedPosts.length === 0 ? (
            <div className="px-8 py-14 text-center">
              <p className="font-semibold text-white mb-1">No liked posts</p>
            </div>
          ) : likedPosts.map((p) => (
            <PostCard key={p._id} post={p} onDelete={() => setLikedPosts((prev) => prev.filter((x) => x._id !== p._id))} onUpdate={(u) => setLikedPosts((prev) => prev.map((x) => x._id === u._id ? u : x))} />
          ))
        )}
      </div>

      {editing && (
        <EditModal profile={profile} onClose={() => setEditing(false)} onSave={handleSave} />
      )}

      {modal && (
        <FollowModal userId={profile._id} type={modal} onClose={() => setModal(null)} />
      )}

      {verifyModal && (
        <VerifyRequestModal
          onClose={() => setVerifyModal(false)}
          onSubmit={() => {
            setVerifyModal(false);
            setVerifyRequest({ status: 'pending' });
          }}
        />
      )}
    </div>
  );
}
