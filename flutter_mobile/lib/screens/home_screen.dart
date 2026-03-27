import 'package:flutter/material.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/post_card.dart';
import 'create_post_sheet.dart';

import '../widgets/skeleton.dart';
import '../widgets/vamppe_logo.dart';
import '../widgets/stories_bar.dart';
import '../widgets/suggested_users.dart';
import '../widgets/empty_state.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, dynamic>> posts = [];
  bool loading = true;
  bool loadingMore = false;
  bool hasMore = false;
  int page = 1;
  String error = '';

  @override
  void initState() {
    super.initState();
    _fetch(1);
  }

  Future<void> _fetch(int p) async {
    if (p == 1 && mounted) setState(() => error = '');
    try {
      final res = await Api.get('/posts/feed?page=$p&limit=10');
      final list = (res is Map ? (res['posts'] as List? ?? []) : (res as List))
          .cast<Map<String, dynamic>>();
      if (mounted) setState(() {
        posts   = p == 1 ? list : [...posts, ...list];
        hasMore = res is Map ? (res['hasMore'] ?? false) : false;
        page    = p;
        loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { error = e.toString(); loading = false; });
    }
  }

  Future<void> _refresh() => _fetch(1);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const VamppeLogo(size: 32, showText: true),
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu, color: white),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: orange),
            onPressed: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: surface1,
              shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
              builder: (_) =>
                  CreatePostSheet(onPost: (p) => setState(() => posts = [p, ...posts])),
            ),
          ),
        ],
      ),
      body: loading
          ? ListView.builder(itemCount: 4, itemBuilder: (_, __) => const PostSkeleton())
          : RefreshIndicator(
              color: orange,
              backgroundColor: surface1,
              onRefresh: _refresh,
              child: error.isNotEmpty
                  ? ListView(children: [
                      SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                      EmptyState(
                        icon: Icons.wifi_off_outlined,
                        title: 'Connection error',
                        subtitle: error,
                        onAction: _refresh,
                      ),
                    ])
                  : posts.isEmpty
                      ? ListView(children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                          const EmptyState(
                            icon: Icons.auto_awesome_mosaic_outlined,
                            title: 'Your feed is quiet',
                            subtitle: 'Follow people to see their posts here.',
                          ),
                        ])
                      : ListView.builder(
                          itemCount: posts.length + 3 + (hasMore ? 1 : 0),
                          itemBuilder: (_, i) {
                            // Slot 0: stories bar
                            if (i == 0) return const StoriesBar();
                            // Slot 1: suggested users (shown when feed has posts)
                            if (i == 1) return const SuggestedUsers();
                            // Slot 2: divider
                            if (i == 2) return const SizedBox.shrink();

                            final postIdx = i - 3;
                            if (postIdx == posts.length) {
                              if (!loadingMore) {
                                Future.microtask(() async {
                                  setState(() => loadingMore = true);
                                  await _fetch(page + 1);
                                  if (mounted) setState(() => loadingMore = false);
                                });
                              }
                              return const Padding(
                                padding: EdgeInsets.all(16),
                                child: Center(
                                    child: CircularProgressIndicator(
                                        color: orange, strokeWidth: 2)),
                              );
                            }
                            return PostCard(
                              post: posts[postIdx],
                              onDelete: (id) =>
                                  setState(() => posts.removeWhere((p) => p['_id'] == id)),
                              onUpdate: (u) => setState(() =>
                                  posts = posts
                                      .map((p) => p['_id'] == u['_id'] ? u : p)
                                      .toList()),
                            );
                          },
                        ),
            ),
    );
  }
}
