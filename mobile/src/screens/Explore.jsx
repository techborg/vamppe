import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, TextInput, StyleSheet } from 'react-native';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import { colors } from '../utils/theme';

export default function Explore({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (q = '', p = 1) => {
    const params = new URLSearchParams({ page: p, limit: 10 });
    if (q.trim()) params.set('q', q.trim());
    const res = await api.get(`/posts/explore?${params}`);
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
    fetchPosts('', 1).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetchPosts(query, 1).finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(query, page + 1);
    setLoadingMore(false);
  };

  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));
  const handleUpdate = (u) => setPosts((prev) => prev.map((p) => (p._id === u._id ? u : p)));

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts…"
          placeholderTextColor={colors.gray4}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={posts}
        keyExtractor={(p) => p._id}
        renderItem={({ item }) => (
          <PostCard post={item} onDelete={handleDelete} onUpdate={handleUpdate} navigation={navigation} />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading ? <Text style={styles.loadingMore}>Loading…</Text>
          : posts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{query ? 'No results found' : 'Nothing here yet'}</Text>
              <Text style={styles.emptyDesc}>{query ? 'Try a different search.' : 'Be the first to post something.'}</Text>
            </View>
          ) : loadingMore ? <Text style={styles.loadingMore}>Loading…</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: colors.surface2, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: colors.white, fontSize: 14, paddingVertical: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { color: colors.white, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  emptyDesc: { color: colors.gray3, fontSize: 14, textAlign: 'center' },
  loadingMore: { color: colors.gray3, textAlign: 'center', padding: 16 },
});
