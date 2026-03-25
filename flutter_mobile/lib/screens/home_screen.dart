import 'package:flutter/material.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/post_card.dart';
import 'create_post_sheet.dart';

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
        title: const Text('Vamppe',
            style: TextStyle(color: orange, fontWeight: FontWeight.w900, fontSize: 20)),
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
          ? const Center(child: CircularProgressIndicator(color: orange))
          : RefreshIndicator(
              color: orange,
              backgroundColor: surface1,
              onRefresh: _refresh,
              child: error.isNotEmpty
                  ? ListView(children: [
                      SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(mainAxisSize: MainAxisSize.min, children: [
                            const Icon(Icons.wifi_off, color: gray3, size: 48),
                            const SizedBox(height: 12),
                            Text(error,
                                style: const TextStyle(color: gray3, fontSize: 13),
                                textAlign: TextAlign.center),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                  backgroundColor: orange,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12))),
                              onPressed: () {
                                setState(() => loading = true);
                                _fetch(1);
                              },
                              child: const Text('Retry', style: TextStyle(color: white)),
                            ),
                          ]),
                        ),
                      ),
                    ])
                  : posts.isEmpty
                      ? ListView(children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.35),
                          const Center(
                            child: Text(
                              'Your feed is empty.\nFollow people to see posts.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: gray3),
                            ),
                          ),
                        ])
                      : ListView.builder(
                          itemCount: posts.length + (hasMore ? 1 : 0),
                          itemBuilder: (_, i) {
                            if (i == posts.length) {
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
                              post: posts[i],
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
