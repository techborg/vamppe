import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { colors } from '../utils/theme';

export default function CreatePost({ onPost }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to attach images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      if (image) {
        fd.append('image', { uri: image.uri, name: 'photo.jpg', type: 'image/jpeg' });
      }
      const res = await api.post('/posts/create', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onPost(res.data);
      setContent('');
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  const maxChars = 500;
  const over = content.length > maxChars;
  const canPost = (content.trim() || image) && !loading && !over;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Avatar src={user?.profilePicture} size={40} />
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.gray4}
          value={content}
          onChangeText={setContent}
          multiline
        />
      </View>

      {image && (
        <View style={styles.previewBox}>
          <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.removeImg} onPress={() => setImage(null)}>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={pickImage} style={styles.imgBtn}>
          <Text style={{ color: colors.gray3, fontSize: 18 }}>🖼</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          {content.length > 0 && (
            <Text style={[styles.counter, over && { color: colors.red }]}>
              {content.length}/{maxChars}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.postBtn, !canPost && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={!canPost}
          >
            <Text style={styles.postBtnText}>{loading ? '…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  input: { flex: 1, color: colors.white, fontSize: 15, minHeight: 44, paddingTop: 8 },
  previewBox: { marginTop: 10, position: 'relative' },
  preview: { width: '100%', height: 180, borderRadius: 16 },
  removeImg: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  imgBtn: { padding: 6 },
  counter: { color: colors.gray3, fontSize: 12, marginRight: 10 },
  postBtn: { backgroundColor: colors.orange, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 },
  postBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
