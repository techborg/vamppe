import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'timeago.js';
import api, { BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';
import { colors } from '../utils/theme';

function FollowModal({ visible, userId, type, onClose, navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    api.get(`/users/profile/${userId}`).then((r) => {
      setUsers(type === 'followers' ? r.data.followers : r.data.following);
      setLoading(false);
    });
  }, [visible, userId, type]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={fStyles.overlay}>
        <View style={fStyles.sheet}>
          <View style={fStyles.header}>
            <Text style={fStyles.title}>{type === 'followers' ? 'Followers' : 'Following'}</Text>
            <TouchableOpacity onPress={onClose} style={fStyles.closeBtn}>
              <Text style={{ color: colors.gray2, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <Text style={fStyles.loading}>Loading…</Text>
          ) : users.length === 0 ? (
            <Text style={fStyles.empty}>{type === 'followers' ? 'No followers yet' : 'Not following anyone'}</Text>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(u) => u._id}
              renderItem={({ item: u }) => (
                <TouchableOpacity style={fStyles.item} onPress={() => { onClose(); navigation.navigate('Profile', { id: u._id }); }}>
                  <Avatar src={u.profilePicture} size={40} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={fStyles.username}>{u.username}</Text>
                    <Text style={fStyles.handle}>@{u.username}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const fStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface1, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '75%', paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.white, fontWeight: '800', fontSize: 18 },
  closeBtn: { padding: 6 },
  loading: { color: colors.gray3, textAlign: 'center', padding: 24 },
  empty: { color: colors.gray3, textAlign: 'center', padding: 24 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  username: { color: colors.white, fontWeight: '700', fontSize: 14 },
  handle: { color: colors.gray3, fontSize: 12 },
});

export default function Profile({ route, navigation }) {
  const { id } = route.params;
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const isMe = id === user._id;

  useEffect(() => {
    setLoading(true);
    setEditing(false);
    setAvatarFile(null);
    Promise.all([api.get(`/users/profile/${id}`), api.get(`/posts/user/${id}`)]).then(([u, p]) => {
      setProfile(u.data);
      setBio(u.data.bio || '');
      setUsername(u.data.username);
      const postsData = p.data;
      setPosts(Array.isArray(postsData) ? postsData : postsData.posts || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const isFollowing = profile?.followers?.some((f) => f._id === user._id);

  const handleFollow = async () => {
    setFollowLoading(true);
    await api.post(`/users/follow/${id}`);
    const res = await api.get(`/users/profile/${id}`);
    setProfile(res.data);
    setFollowLoading(false);
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setAvatarFile(result.assets[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('bio', bio);
      fd.append('username', username);
      if (avatarFile) fd.append('profilePicture', { uri: avatarFile.uri, name: 'avatar.jpg', type: 'image/jpeg' });
      const res = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile((p) => ({ ...p, ...res.data }));
      updateUser({ ...user, ...res.data });
      setEditing(false);
      setAvatarFile(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (pid) => setPosts((prev) => prev.filter((p) => p._id !== pid));
  const handleUpdate = (u) => setPosts((prev) => prev.map((p) => (p._id === u._id ? u : p)));

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <Text style={{ color: colors.gray3 }}>Loading…</Text>
    </View>
  );
  if (!profile) return (
    <View style={[styles.container, styles.center]}>
      <Text style={{ color: colors.gray3 }}>User not found</Text>
    </View>
  );

  const avatarSrc = avatarFile ? avatarFile.uri : profile.profilePicture;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Cover */}
        <View style={styles.cover} />

        <View style={styles.body}>
          {/* Avatar + actions */}
          <View style={styles.avatarRow}>
            <TouchableOpacity onPress={isMe && editing ? pickAvatar : undefined} activeOpacity={isMe && editing ? 0.7 : 1}>
              <Avatar src={avatarSrc} size={76} />
              {isMe && editing && (
                <View style={styles.cameraOverlay}>
                  <Text style={{ color: colors.white, fontSize: 18 }}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.actions}>
              {isMe ? (
                editing ? (
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.btnGhost} onPress={() => { setEditing(false); setAvatarFile(null); }}>
                      <Text style={styles.btnGhostText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnPrimary, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                      <Text style={styles.btnPrimaryText}>{saving ? 'Saving…' : 'Save'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.btnGhost} onPress={() => setEditing(true)}>
                    <Text style={styles.btnGhostText}>Edit profile</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.btnGhost}
                    onPress={() => navigation.navigate('ChatRoom', { userId: id, username: profile.username, profilePicture: profile.profilePicture })}
                  >
                    <Text style={styles.btnGhostText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[isFollowing ? styles.btnFollowing : styles.btnFollow, followLoading && { opacity: 0.6 }]}
                    onPress={handleFollow}
                    disabled={followLoading}
                  >
                    <Text style={isFollowing ? styles.btnFollowingText : styles.btnFollowText}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Name / bio */}
          {editing ? (
            <View style={{ gap: 10, marginBottom: 16 }}>
              <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Display name" placeholderTextColor={colors.gray4} />
              <TextInput style={[styles.input, { minHeight: 80 }]} value={bio} onChangeText={setBio} placeholder="Write a short bio…" placeholderTextColor={colors.gray4} multiline />
            </View>
          ) : (
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.name}>{profile.username}</Text>
            {profile.verified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                </View>
                <Text style={{ color: '#fb923c', fontSize: 12, fontWeight: '600' }}>Verified</Text>
              </View>
            )}
              <Text style={styles.handle}>@{profile.username}</Text>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
              <Text style={styles.joined}>
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.stats}>
            <TouchableOpacity onPress={() => setModal('following')}>
              <Text style={styles.statNum}>{profile.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal('followers')}>
              <Text style={styles.statNum}>{profile.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.statNum}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>
        </View>

        {/* Posts */}
        <View style={styles.postsHeader}>
          <Text style={styles.postsTab}>Posts</Text>
        </View>
        {posts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Text style={{ color: colors.white, fontWeight: '700', marginBottom: 4 }}>No posts yet</Text>
            {isMe && <Text style={{ color: colors.gray3, fontSize: 13 }}>Share something with the world.</Text>}
          </View>
        ) : (
          posts.map((p) => (
            <PostCard key={p._id} post={p} onDelete={handleDelete} onUpdate={handleUpdate} navigation={navigation} />
          ))
        )}
      </ScrollView>

      <FollowModal
        visible={!!modal}
        userId={id}
        type={modal}
        onClose={() => setModal(null)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  cover: { height: 120, backgroundColor: colors.surface2, background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(139,92,246,0.2))' },
  body: { padding: 16, marginTop: -36 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  cameraOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  actions: { marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8 },
  btnPrimary: { backgroundColor: colors.orange, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  btnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  btnGhost: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  btnGhostText: { color: colors.gray2, fontWeight: '600', fontSize: 13 },
  btnFollow: { backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  btnFollowText: { color: colors.bg, fontWeight: '700', fontSize: 13 },
  btnFollowing: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.border },
  btnFollowingText: { color: colors.gray2, fontWeight: '600', fontSize: 13 },
  name: { color: colors.white, fontWeight: '800', fontSize: 20 },
  handle: { color: colors.gray3, fontSize: 13, marginTop: 2 },
  bio: { color: colors.gray2, fontSize: 14, lineHeight: 20, marginTop: 8 },
  joined: { color: colors.gray4, fontSize: 12, marginTop: 6 },
  stats: { flexDirection: 'row', gap: 24, marginTop: 4 },
  statNum: { color: colors.white, fontWeight: '800', fontSize: 16 },
  statLabel: { color: colors.gray3, fontSize: 12 },
  input: { backgroundColor: colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.white, fontSize: 14 },
  postsHeader: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  postsTab: { color: colors.orange, fontWeight: '700', fontSize: 14, borderBottomWidth: 2, borderBottomColor: colors.orange, paddingBottom: 4, alignSelf: 'flex-start' },
  emptyPosts: { alignItems: 'center', paddingVertical: 40 },
});
