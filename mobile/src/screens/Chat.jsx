import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'timeago.js';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';

export default function Chat({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useAuth();

  useEffect(() => {
    api.get('/messages/conversations').then((r) => { setConversations(r.data); setLoading(false); });
    socket.on('receive_message', (msg) => {
      setConversations((prev) => {
        const sid = msg.senderId?._id || msg.senderId;
        const exists = prev.find((c) => c.user?._id === sid);
        if (exists) return prev.map((c) => c.user?._id === sid ? { ...c, lastMessage: msg } : c);
        return prev;
      });
    });
    return () => socket.off('receive_message');
  }, []);

  const isOnline = (id) => onlineUsers?.includes(id);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyDesc}>Find someone to chat with from their profile.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.user?._id}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('ChatRoom', { userId: c.user?._id, username: c.user?.username, profilePicture: c.user?.profilePicture })}
              activeOpacity={0.7}
            >
              <View style={{ position: 'relative' }}>
                <Avatar src={c.user?.profilePicture} size={48} />
                {isOnline(c.user?._id) && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.username}>{c.user?.username}</Text>
                  {c.lastMessage?.createdAt && (
                    <Text style={styles.time}>{format(c.lastMessage.createdAt)}</Text>
                  )}
                </View>
                <Text style={styles.lastMsg} numberOfLines={1}>{c.lastMessage?.message}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.bg },
  info: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { color: colors.white, fontWeight: '700', fontSize: 15 },
  time: { color: colors.gray4, fontSize: 11 },
  lastMsg: { color: colors.gray3, fontSize: 13, marginTop: 2 },
  loading: { color: colors.gray3, textAlign: 'center', marginTop: 40 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { color: colors.white, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  emptyDesc: { color: colors.gray3, fontSize: 14, textAlign: 'center' },
});
