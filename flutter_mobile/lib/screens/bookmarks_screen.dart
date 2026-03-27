import 'package:flutter/material.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/post_card.dart';
import '../widgets/skeleton.dart';
import '../widgets/vamppe_logo.dart';
import '../widgets/empty_state.dart';

class BookmarksScreen extends StatefulWidget {
  const BookmarksScreen({super.key});
  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> {
  List<Map<String, dynamic>> posts = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await Api.get('/bookmarks');
      setState(() => posts = (res as List).cast<Map<String, dynamic>>());
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const Padding(padding: EdgeInsets.all(10), child: VamppeLogo(size: 28)),
        title: const Text('Saved'),
      ),
      body: loading
          ? ListView.builder(itemCount: 4, itemBuilder: (_, __) => const PostSkeleton())
          : RefreshIndicator(
              color: orange,
              backgroundColor: surface1,
              onRefresh: _load,
              child: posts.isEmpty
                  ? ListView(children: const [
                      SizedBox(height: 120),
                      EmptyState(
                        icon: Icons.bookmark_outline,
                        title: 'No saved items',
                        subtitle: 'Bookmark posts you want to see again later.',
                      ),
                    ])
                  : ListView.builder(
                      itemCount: posts.length,
                      itemBuilder: (_, i) => PostCard(
                        post: posts[i],
                        bookmarked: true,
                        onDelete: (id) => setState(() => posts.removeWhere((p) => p['_id'] == id)),
                        onUpdate: (u) => setState(() => posts = posts.map((p) => p['_id'] == u['_id'] ? u : p).toList()),
                      ),
                    ),
            ),
    );
  }
}
