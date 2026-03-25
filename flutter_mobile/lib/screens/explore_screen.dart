import 'package:flutter/material.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/post_card.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});
  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  List<Map<String, dynamic>> posts = [];
  bool loading = true;
  String query = '';

  @override
  void initState() {
    super.initState();
    _fetch('');
  }

  Future<void> _fetch(String q) async {
    setState(() => loading = true);
    try {
      final path = q.isEmpty ? '/posts/explore?limit=20' : '/posts/explore?q=${Uri.encodeComponent(q)}&limit=20';
      final res = await Api.get(path);
      final list = res is List ? res : (res['posts'] as List? ?? []);
      setState(() => posts = list.cast<Map<String, dynamic>>());
    } catch (_) {}
    setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Discover')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            style: const TextStyle(color: white),
            decoration: const InputDecoration(
              hintText: 'Search posts…',
              prefixIcon: Icon(Icons.search, color: gray3),
            ),
            onChanged: (v) {
              query = v;
              Future.delayed(const Duration(milliseconds: 350), () {
                if (query == v) _fetch(v);
              });
            },
          ),
        ),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: orange))
              : posts.isEmpty
                  ? Center(child: Text(query.isEmpty ? 'Nothing here yet' : 'No results found', style: const TextStyle(color: gray3)))
                  : RefreshIndicator(
                  color: orange,
                  backgroundColor: surface1,
                  onRefresh: () => _fetch(query),
                  child: posts.isEmpty
                      ? const Center(child: Text('Nothing here yet', style: TextStyle(color: gray3)))
                      : ListView.builder(
                          itemCount: posts.length,
                          itemBuilder: (_, i) => PostCard(
                            post: posts[i],
                            onDelete: (id) => setState(() => posts.removeWhere((p) => p['_id'] == id)),
                            onUpdate: (u) => setState(() => posts = posts.map((p) => p['_id'] == u['_id'] ? u : p).toList()),
                          ),
                        ),
                ),
        ),
      ]),
    );
  }
}
