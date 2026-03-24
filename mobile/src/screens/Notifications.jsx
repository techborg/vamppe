import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'timeago.js';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import socket from '../utils/socket';
import { colors } from '../utils/theme';

const TYPE = {
  like:    { bg: 'rgba(244,63,94,0.12)',  color: '#fb7185', emoji: '♥',  label: 'liked your post' },
  comment: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', emoji: '💬', label: 'replied to your post' },
  follow:  { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', emoji: '✦',  label: 'started following you' },
};

export default function Notifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then((r) => { setNotifications(r.data); setLoading(false); });
    api.put('/notifications/read');
    socket.on('receive_notification', (d) => setNotifications((p) => [d.notification, ...p]));
    return () => socket.off('receive_notification');
  }, []);

  const renderItem = ({ item: n }) => {
    const style = TYPE[n.type] || TYPE.like;
    return (
      <TouchableOpacity
        style={[styles.item, !n.read && styles.unread]}
        onPress={() => navigation.navigate('Profile', { id: n.fromUser?._id })}
        activeOpacity={0.7}
      >
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Text style={{ color: style.color, fontSize: 14 }}>{style.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Avatar src={n.fromUser?.profilePicture} size={32} onPress={() => navigation.navigate('Profile', { id: n.fromUser?._id })} />
            {!n.read && <View style={styles.dot} />}
          </View>
          <Text style={styles.text}>
            <Text style={styles.bold}>{n.fromUser?.username}</Text>
            {' '}{style.label}
          </Text>
          {n.postId?.content ? (
            <Text style={styles.postSnippet} numberOfLines={1}>"{n.postId.content}"</Text>
          ) : null}
          <Text style={styles.time}>{format(n.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔔</Text>
          <Text style={styles.emptyTitle}>All quiet here</Text>
          <Text style={styles.emptyDesc}>Likes, replies, and follows will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  item: { flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  unread: { backgroundColor: 'rgba(249,115,22,0.03)' },
  badge: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange },
  text: { color: colors.gray2, fontSize: 14, lineHeight: 20 },
  bold: { color: colors.white, fontWeight: '700' },
  postSnippet: { color: colors.gray4, fontSize: 12, marginTop: 2 },
  time: { color: colors.gray4, fontSize: 11, marginTop: 3 },
  loading: { color: colors.gray3, textAlign: 'center', marginTop: 40 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { color: colors.white, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  emptyDesc: { color: colors.gray3, fontSize: 14, textAlign: 'center' },
});
