import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { format } from 'timeago.js';
import api from '../utils/api';
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { colors } from '../utils/theme';

export default function ChatRoom({ route, navigation }) {
  const { userId, username, profilePicture } = route.params;
  const { user, onlineUsers } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef();
  const typingTimeout = useRef();

  const isOnline = onlineUsers?.includes(userId);

  useEffect(() => {
    navigation.setOptions({
      title: username,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 4 }}>
          <Avatar src={profilePicture} size={30} onPress={() => navigation.navigate('Profile', { id: userId })} />
          {isOnline && <View style={styles.onlineDot} />}
        </View>
      ),
    });
  }, [isOnline]);

  useEffect(() => {
    api.get(`/messages/history/${userId}`).then((r) => setMessages(r.data));

    socket.on('receive_message', (msg) => {
      const sid = msg.senderId?._id || msg.senderId;
      if (sid === userId) setMessages((p) => [...p, msg]);
    });
    socket.on('typing_start', ({ senderId }) => { if (senderId === userId) setIsTyping(true); });
    socket.on('typing_stop',  ({ senderId }) => { if (senderId === userId) setIsTyping(false); });

    return () => {
      socket.off('receive_message');
      socket.off('typing_start');
      socket.off('typing_stop');
    };
  }, [userId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    socket.emit('typing_stop', { receiverId: userId });
    clearTimeout(typingTimeout.current);
    const res = await api.post('/messages/send', { receiverId: userId, message: text });
    setMessages((p) => [...p, res.data]);
    setText('');
  };

  const handleTyping = (val) => {
    setText(val);
    socket.emit('typing_start', { receiverId: userId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('typing_stop', { receiverId: userId }), 1500);
  };

  const renderMessage = ({ item: m, index }) => {
    const isMine = (m.senderId?._id || m.senderId) === user._id;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
        {!isMine && <Avatar src={profilePicture} size={26} />}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine && { color: colors.white }]}>{m.message}</Text>
          <Text style={[styles.bubbleTime, isMine && { color: 'rgba(255,255,255,0.5)' }]}>
            {format(m.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.msgRow, styles.msgRowOther]}>
              <Avatar src={profilePicture} size={26} />
              <View style={[styles.bubble, styles.bubbleOther, { paddingVertical: 10 }]}>
                <Text style={{ color: colors.gray3, letterSpacing: 3 }}>•••</Text>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={{ padding: 12, gap: 4 }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${username}…`}
          placeholderTextColor={colors.gray4}
          value={text}
          onChangeText={handleTyping}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && { opacity: 0.35 }]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginVertical: 2 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: colors.orange, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: colors.gray1, lineHeight: 21 },
  bubbleTime: { fontSize: 10, color: colors.gray4, marginTop: 3, textAlign: 'right' },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  input: { flex: 1, backgroundColor: colors.surface2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.white, fontSize: 15, borderWidth: 1, borderColor: colors.border, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: colors.white, fontSize: 16 },
});
