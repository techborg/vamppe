import 'package:flutter/material.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/post_card.dart';
import '../widgets/avatar.dart';
import '../widgets/verified_badge.dart';
import '../widgets/empty_state.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});
  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _searchCtrl = TextEditingController();
  String _query = '';

  List<Map<String, dynamic>> posts = [];
  List<Map<String, dynamic>> users = [];
  bool loadingPosts = true;
  bool loadingUsers = false;
  final Set<String> _followed = {};

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _fetchPosts('');
  }

  @override
  void dispose() {
    _tabs.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchPosts(String q) async {
    setState(() => loadingPosts = true);
    try {
      final path = q.isEmpty
          ? '/posts/explore?limit=20'
          : '/posts/explore?q=${Uri.encodeComponent(q)}&limit=20';
      final res = await Api.get(path);
      final list = (res is List ? res : (res['posts'] as List? ?? []))
          .cast<Map<String, dynamic>>();
      if (mounted) setState(() => posts = list);
    } catch (_) {}
    if (mounted) setState(() => loadingPosts = false);
  }

  Future<void> _fetchUsers(String q) async {
    if (q.trim().isEmpty) { setState(() => users = []); return; }
    setState(() => loadingUsers = true);
    try {
      final res = await Api.get('/users/search?q=${Uri.encodeComponent(q)}');
      if (mounted) setState(() => users = (res as List).cast<Map<String, dynamic>>());
    } catch (_) {}
    if (mounted) setState(() => loadingUsers = false);
  }

  void _onSearch(String v) {
    _query = v;
    Future.delayed(const Duration(milliseconds: 350), () {
      if (_query != v) return;
      if (_tabs.index == 0) _fetchPosts(v);
      else _fetchUsers(v);
    });
  }

  Future<void> _follow(String id) async {
    setState(() => _followed.add(id));
    try { await Api.post('/users/follow/$id'); } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(96),
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: white),
                onChanged: _onSearch,
                decoration: InputDecoration(
                  hintText: 'Search posts or people…',
                  prefixIcon: const Icon(Icons.search, color: gray3),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: gray3, size: 18),
                          onPressed: () {
                            _searchCtrl.clear();
                            _onSearch('');
                          })
                      : null,
                ),
              ),
            ),
            TabBar(
              controller: _tabs,
              indicatorColor: orange,
              labelColor: orange,
              unselectedLabelColor: gray3,
              onTap: (_) => _onSearch(_query),
              tabs: const [Tab(text: 'Posts'), Tab(text: 'People')],
            ),
          ]),
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          // Posts tab
          loadingPosts
              ? const Center(child: CircularProgressIndicator(color: orange))
              : posts.isEmpty
                  ? EmptyState(
                      icon: Icons.search_outlined,
                      title: _query.isEmpty ? 'Nothing here yet' : 'No posts found',
                      subtitle: _query.isEmpty ? 'Try exploring trending topics' : 'Try searching for something else.',
                      onAction: () => _fetchPosts(_query),
                    )
                  : RefreshIndicator(
                      color: orange,
                      backgroundColor: surface1,
                      onRefresh: () => _fetchPosts(_query),
                      child: ListView.builder(
                        itemCount: posts.length,
                        itemBuilder: (_, i) => PostCard(
                          post: posts[i],
                          onDelete: (id) => setState(
                              () => posts.removeWhere((p) => p['_id'] == id)),
                          onUpdate: (u) => setState(() => posts =
                              posts.map((p) => p['_id'] == u['_id'] ? u : p).toList()),
                        ),
                      ),
                    ),

          // People tab
          loadingUsers
              ? const Center(child: CircularProgressIndicator(color: orange))
              : users.isEmpty
                  ? EmptyState(
                      icon: Icons.person_search_outlined,
                      title: _query.isEmpty ? 'Find people' : 'No users found',
                      subtitle: _query.isEmpty ? 'Search for your friends by username' : 'Try a different search term.',
                    )
                  : ListView.builder(
                      itemCount: users.length,
                      itemBuilder: (_, i) {
                        final u = users[i];
                        final isFollowed = _followed.contains(u['_id']);
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          leading: Avatar(
                            src: u['profilePicture'],
                            size: 46,
                            onTap: () => Navigator.pushNamed(context, '/profile',
                                arguments: u['_id']),
                          ),
                          title: Row(children: [
                            Text(u['username'] ?? '',
                                style: const TextStyle(
                                    color: white, fontWeight: FontWeight.w700)),
                            if (u['verified'] == true) ...[
                              const SizedBox(width: 4),
                              VerifiedBadge(
                                  type: u['verifiedType'] ?? 'blue', size: 13),
                            ],
                          ]),
                          subtitle: Text(
                            '${(u['followers'] as List?)?.length ?? 0} followers',
                            style: const TextStyle(color: gray3, fontSize: 12),
                          ),
                          trailing: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isFollowed ? surface2 : orange,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                            ),
                            onPressed: isFollowed ? null : () => _follow(u['_id']),
                            child: Text(isFollowed ? 'Following' : 'Follow',
                                style: TextStyle(
                                    color: isFollowed ? gray3 : white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700)),
                          ),
                          onTap: () => Navigator.pushNamed(context, '/profile',
                              arguments: u['_id']),
                        );
                      },
                    ),
        ],
      ),
    );
  }
}
