import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, StyleSheet, Alert } from 'react-native';
import { format } from 'timeago.js';
import api, { BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { colors } from '../utils/theme';

// Small inline verified badge for React Native
const MBadge = () => (
  <View style={mBadge.wrap}>
    <Text style={mBadge.check}>✓</Text>
  </View>
);
const mBadge = {
  wrap: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  check: { color: 'white', fontSize: 9, fontWeight: '900', lineHeight: 15 },
};

export default function PostCard({ post, onDelete, onUpdate, navigation }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(post.likes.includes(user._id));
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    const res = await api.post(`/posts/like/${post._id}`);
    onUpdate({ ...post, likes: res.data.likes });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await api.post(`/posts/comment/${post._id}`, { text: commentText });
    onUpdate(res.data);
    setCommentText('');
    setSubmitting(false);
  };

  const handleDelete = () => {
    Alert.alert('Remove post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await api.delete(`/posts/${post._id}`);
        onDelete(post._id);
      }},
    ]);
  };

  const imageUri = post.image
    ? post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar
          src={post.userId?.profilePicture}
          size={40}
          onPress={() => navigation.navigate('Profile', { id: post.userId?._id })}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={[styles.rowBetween]}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: post.userId?._id })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.username}>{post.userId?.username}</Text>
                {post.userId?.verified && <MBadge />}
              </View>
            </TouchableOpacity>
            <View style={styles.row}>
              <Text style={styles.time}>{format(post.createdAt)}</Text>
              {post.userId?._id === user._id && (
                <TouchableOpacity onPress={handleDelete} style={{ marginLeft: 8 }}>
                  <Text style={{ color: colors.gray4, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(!showComments)}>
          <Text style={[styles.actionIcon, showComments && { color: colors.violetLight }]}>💬</Text>
          {post.comments.length > 0 && (
            <Text style={[styles.actionCount, showComments && { color: colors.violetLight }]}>
              {post.comments.length}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Text style={[styles.actionIcon, liked && { color: '#fb7185' }]}>{liked ? '♥' : '♡'}</Text>
          {likeCount > 0 && (
            <Text style={[styles.actionCount, liked && { color: '#fb7185' }]}>{likeCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={styles.commentsBox}>
          {post.comments.length === 0 && (
            <Text style={styles.noComments}>No replies yet</Text>
          )}
          {post.comments.map((c) => (
            <View key={c._id} style={styles.comment}>
              <Avatar src={c.userId?.profilePicture} size={28}
                onPress={() => navigation.navigate('Profile', { id: c.userId?._id })} />
              <View style={styles.commentBubble}>
                <Text style={styles.commentUser}>{c.userId?.username}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}
          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Add a reply…"
              placeholderTextColor={colors.gray4}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              style={[styles.replyBtn, (!commentText.trim() || submitting) && { opacity: 0.4 }]}
              onPress={handleComment}
              disabled={!commentText.trim() || submitting}
            >
              <Text style={styles.replyBtnText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  username: { color: colors.white, fontWeight: '700', fontSize: 14 },
  time: { color: colors.gray4, fontSize: 12 },
  content: { color: colors.gray1, fontSize: 15, lineHeight: 22, marginTop: 10 },
  image: { width: '100%', height: 220, borderRadius: 16, marginTop: 10 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, gap: 4 },
  actionIcon: { fontSize: 16, color: colors.gray3 },
  actionCount: { fontSize: 13, color: colors.gray3 },
  commentsBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  noComments: { color: colors.gray4, fontSize: 12, marginBottom: 8 },
  comment: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  commentBubble: { flex: 1, backgroundColor: colors.surface2, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  commentUser: { color: colors.gray2, fontWeight: '700', fontSize: 12, marginBottom: 2 },
  commentText: { color: colors.gray2, fontSize: 13 },
  commentInput: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: { flex: 1, backgroundColor: colors.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: colors.white, fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  replyBtn: { backgroundColor: colors.orange, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  replyBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
