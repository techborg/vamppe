import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { colors } from '../utils/theme';

export default function Home({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (p = 1) => {
    const res = await api.get(`/posts/feed?page=${p}&limit=10`);
    const data = res.data;
    if (Array.isArray(data)) {
      setPosts(data);
    } else {
      setPosts((prev) => p === 1 ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(data.page);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1).finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed(1);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchFeed(page + 1);
    setLoadingMore(false);
  };

  const handlePost = (p) => setPosts((prev) => [p, ...prev]);
  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));
  const handleUpdate = (u) => setPosts((prev) => prev.map((p) => (p._id === u._id ? u : p)));

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p._id}
        ListHeaderComponent={<CreatePost onPost={handlePost} />}
        renderItem={({ item }) => (
          <PostCard post={item} onDelete={handleDelete} onUpdate={handleUpdate} navigation={navigation} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading ? null : posts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✦</Text>
              <Text style={styles.emptyTitle}>Your feed is empty</Text>
              <Text style={styles.emptyDesc}>Follow people to see their posts here.</Text>
            </View>
          ) : loadingMore ? (
            <Text style={styles.loadingMore}>Loading…</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { color: colors.white, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  emptyDesc: { color: colors.gray3, fontSize: 14, textAlign: 'center' },
  loadingMore: { color: colors.gray3, textAlign: 'center', padding: 16 },
});
