import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../utils/api.dart';
import '../utils/constants.dart';
import '../utils/theme.dart';
import '../widgets/avatar.dart';
import '../widgets/post_card.dart';
import '../widgets/verified_badge.dart';
import '../context/auth_provider.dart';
import '../widgets/follow_list_modal.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? profile;
  List<Map<String, dynamic>> posts      = [];
  List<Map<String, dynamic>> mediaPosts = [];
  List<Map<String, dynamic>> likedPosts = [];
  bool loading = true;
  bool editing = false;
  bool saving  = false;
  bool followLoading = false;
  bool _initialized = false;
  String userId = '';
  late TabController _tabs;

  final _bioCtrl      = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _displayCtrl  = TextEditingController();
  final _websiteCtrl  = TextEditingController();
  final _locationCtrl = TextEditingController();
  String? newAvatarPath;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final id = ModalRoute.of(context)?.settings.arguments as String?;
    final auth = context.read<AuthProvider>();
    final newUserId = id ?? auth.user?['_id'] ?? '';
    if (_initialized && newUserId == userId) return;
    _initialized = true;
    userId = newUserId;
    if (userId.isEmpty) return;
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final results = await Future.wait([
        Api.get('/users/profile/$userId'),
        Api.get('/posts/user/$userId'),
      ]);
      final p = results[0];
      final raw = results[1];
      final list = (raw is List ? raw : (raw['posts'] as List? ?? []))
          .cast<Map<String, dynamic>>();
      setState(() {
        profile            = Map<String, dynamic>.from(p);
        _bioCtrl.text      = p['bio'] ?? '';
        _usernameCtrl.text = p['username'] ?? '';
        _displayCtrl.text  = p['displayName'] ?? '';
        _websiteCtrl.text  = p['website'] ?? '';
        _locationCtrl.text = p['location'] ?? '';
        posts      = list;
        mediaPosts = list
            .where((x) => x['image'] != null && x['image'].toString().isNotEmpty)
            .toList();
      });
      try {
        final liked = await Api.get('/posts/liked/$userId');
        setState(() => likedPosts =
            (liked is List ? liked : (liked['posts'] as List? ?? []))
                .cast<Map<String, dynamic>>());
      } catch (_) {}
    } catch (_) {}
    setState(() => loading = false);
  }

  Future<void> _pickAvatar() async {
    final img = await ImagePicker()
        .pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => newAvatarPath = img.path);
  }

  Future<void> _save() async {
    setState(() => saving = true);
    try {
      final res = await Api.putMultipart(
        '/users/profile',
        {
          'bio': _bioCtrl.text,
          'username': _usernameCtrl.text,
          'displayName': _displayCtrl.text,
          'website': _websiteCtrl.text,
          'location': _locationCtrl.text,
        },
        files: newAvatarPath != null ? {'profilePicture': newAvatarPath!} : null,
      );
      if (!mounted) return;
      context.read<AuthProvider>().updateUser(Map<String, dynamic>.from(res));
      setState(() {
        profile        = {...?profile, ...res};
        editing        = false;
        newAvatarPath  = null;
      });
    } catch (_) {}
    setState(() => saving = false);
  }

  bool get isMe {
    final auth = context.read<AuthProvider>();
    return userId == auth.user?['_id'];
  }

  bool get isFollowing {
    final auth = context.read<AuthProvider>();
    final followers = (profile?['followers'] as List?) ?? [];
    return followers.any((f) => (f['_id'] ?? f) == auth.user?['_id']);
  }

  Future<void> _follow() async {
    setState(() => followLoading = true);
    await Api.post('/users/follow/$userId');
    await _load();
    setState(() => followLoading = false);
  }

  void _showVerifyModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: surface1,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _VerifyRequestSheet(userId: userId),
    );
  }

  void _onUpdate(Map<String, dynamic> u) {
    setState(() {
      posts      = posts.map((x) => x['_id'] == u['_id'] ? u : x).toList();
      mediaPosts = mediaPosts.map((x) => x['_id'] == u['_id'] ? u : x).toList();
      likedPosts = likedPosts.map((x) => x['_id'] == u['_id'] ? u : x).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
          body: Center(child: CircularProgressIndicator(color: orange)));
    }
    if (profile == null) {
      return const Scaffold(
          body: Center(
              child: Text('User not found', style: TextStyle(color: gray3))));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(profile!['username'] ?? ''),
        actions: [
          if (isMe && !editing) ...[
            IconButton(
                icon: const Icon(Icons.edit_outlined),
                onPressed: () => setState(() => editing = true)),
            IconButton(
                icon: const Icon(Icons.settings_outlined),
                onPressed: () => Navigator.pushNamed(context, '/settings')),
          ],
          if (editing) ...[
            TextButton(
                onPressed: () =>
                    setState(() { editing = false; newAvatarPath = null; }),
                child: const Text('Cancel',
                    style: TextStyle(color: gray3))),
            TextButton(
              onPressed: saving ? null : _save,
              child: saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          color: orange, strokeWidth: 2))
                  : const Text('Save',
                      style: TextStyle(
                          color: orange, fontWeight: FontWeight.w700)),
            ),
          ],
        ],
      ),
      body: NestedScrollView(
        headerSliverBuilder: (_, __) =>
            [SliverToBoxAdapter(child: _buildHeader())],
        body: Column(children: [
          TabBar(
            controller: _tabs,
            indicatorColor: orange,
            labelColor: orange,
            unselectedLabelColor: gray3,
            tabs: const [
              Tab(text: 'Posts'),
              Tab(text: 'Media'),
              Tab(text: 'Likes'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                _PostList(
                    posts: posts,
                    onDelete: (id) => setState(() {
                          posts.removeWhere((x) => x['_id'] == id);
                          mediaPosts.removeWhere((x) => x['_id'] == id);
                        }),
                    onUpdate: _onUpdate),
                _MediaGrid(posts: mediaPosts),
                _PostList(posts: likedPosts, onDelete: (_) {}, onUpdate: _onUpdate),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        height: 120,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0x47f97316), Color(0x3A8b5cf6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Transform.translate(
              offset: const Offset(0, -36),
              child: GestureDetector(
                onTap: isMe && editing ? _pickAvatar : null,
                child: Stack(children: [
                  Avatar(
                      src: newAvatarPath ?? profile!['profilePicture'],
                      size: 76),
                  if (isMe && editing)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                            color: Colors.black45,
                            borderRadius: BorderRadius.circular(30)),
                        child: const Icon(Icons.camera_alt,
                            color: white, size: 22),
                      ),
                    ),
                ]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: isMe
                  ? (profile!['verified'] != true
                      ? TextButton(
                          onPressed: _showVerifyModal,
                          style: TextButton.styleFrom(
                            side: const BorderSide(color: borderColor),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Get verified',
                              style: TextStyle(color: gray2, fontSize: 13)),
                        )
                      : const SizedBox())
                  : Row(children: [
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: borderColor),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.pushNamed(
                            context, '/chatroom',
                            arguments: {
                              'userId': userId,
                              'username': profile!['username'],
                              'profilePicture': profile!['profilePicture'],
                            }),
                        child: const Text('Message',
                            style: TextStyle(color: gray2)),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor:
                              isFollowing ? surface2 : white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: followLoading ? null : _follow,
                        child: Text(
                            isFollowing ? 'Following' : 'Follow',
                            style: TextStyle(
                                color: isFollowing ? gray2 : bgColor,
                                fontWeight: FontWeight.w700)),
                      ),
                    ]),
            ),
          ]),

          if (editing) ...[
            TextField(
                controller: _displayCtrl,
                style: const TextStyle(color: white),
                decoration:
                    const InputDecoration(hintText: 'Display name')),
            const SizedBox(height: 10),
            TextField(
                controller: _usernameCtrl,
                style: const TextStyle(color: white),
                decoration:
                    const InputDecoration(hintText: 'Username')),
            const SizedBox(height: 10),
            TextField(
                controller: _bioCtrl,
                maxLines: 3,
                style: const TextStyle(color: white),
                decoration: const InputDecoration(hintText: 'Bio')),
            const SizedBox(height: 10),
            TextField(
                controller: _websiteCtrl,
                style: const TextStyle(color: white),
                decoration:
                    const InputDecoration(hintText: 'Website')),
            const SizedBox(height: 10),
            TextField(
                controller: _locationCtrl,
                style: const TextStyle(color: white),
                decoration:
                    const InputDecoration(hintText: 'Location')),
          ] else ...[
            Row(children: [
              Text(
                  profile!['displayName'] ??
                      profile!['username'] ??
                      '',
                  style: const TextStyle(
                      color: white,
                      fontWeight: FontWeight.w800,
                      fontSize: 20)),
              if (profile!['verified'] == true) ...[
                const SizedBox(width: 6),
                VerifiedBadge(
                    type: profile!['verifiedType'] ?? 'blue',
                    size: 18),
              ],
            ]),
            const SizedBox(height: 2),
            Text('@${profile!['username']}',
                style: const TextStyle(color: gray3, fontSize: 13)),
            if ((profile!['bio'] ?? '').isNotEmpty)
              Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(profile!['bio'],
                      style: const TextStyle(
                          color: gray2, fontSize: 14, height: 1.5))),
            if ((profile!['location'] ?? '').isNotEmpty)
              Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Row(children: [
                    const Icon(Icons.location_on_outlined,
                        size: 14, color: gray3),
                    const SizedBox(width: 4),
                    Text(profile!['location'],
                        style: const TextStyle(
                            color: gray3, fontSize: 13)),
                  ])),
            if ((profile!['website'] ?? '').isNotEmpty)
              Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Row(children: [
                    const Icon(Icons.link, size: 14, color: orange),
                    const SizedBox(width: 4),
                    Text(profile!['website'],
                        style: const TextStyle(
                            color: orange, fontSize: 13)),
                  ])),
          ],

          const SizedBox(height: 14),
          Row(children: [
            _Stat(label: 'Following', value: (profile!['following'] as List?)?.length ?? 0,
                onTap: () => showFollowList(context, userId, 'following')),
            const SizedBox(width: 24),
            _Stat(label: 'Followers', value: (profile!['followers'] as List?)?.length ?? 0,
                onTap: () => showFollowList(context, userId, 'followers')),
            const SizedBox(width: 24),
            _Stat(label: 'Posts', value: posts.length),
          ]),
        ]),
      ),
    ]);
  }
}

// ── Tab content ───────────────────────────────────────────────────────────────

class _PostList extends StatelessWidget {
  final List<Map<String, dynamic>> posts;
  final Function(String) onDelete;
  final Function(Map<String, dynamic>) onUpdate;
  const _PostList(
      {required this.posts,
      required this.onDelete,
      required this.onUpdate});

  @override
  Widget build(BuildContext context) {
    if (posts.isEmpty) {
      return const Center(
          child: Text('No posts yet', style: TextStyle(color: gray3)));
    }
    return ListView.builder(
      itemCount: posts.length,
      itemBuilder: (_, i) =>
          PostCard(post: posts[i], onDelete: onDelete, onUpdate: onUpdate),
    );
  }
}

class _MediaGrid extends StatelessWidget {
  final List<Map<String, dynamic>> posts;
  const _MediaGrid({required this.posts});

  @override
  Widget build(BuildContext context) {
    if (posts.isEmpty) {
      return const Center(
          child: Text('No media yet', style: TextStyle(color: gray3)));
    }
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3, crossAxisSpacing: 2, mainAxisSpacing: 2),
      itemCount: posts.length,
      itemBuilder: (_, i) {
        final img = posts[i]['image'] as String;
        final url = img.startsWith('http') ? img : '$baseUrl$img';
        return CachedNetworkImage(imageUrl: url, fit: BoxFit.cover);
      },
    );
  }
}

// ── Verification request sheet ────────────────────────────────────────────────

class _VerifyRequestSheet extends StatefulWidget {
  final String userId;
  const _VerifyRequestSheet({required this.userId});
  @override
  State<_VerifyRequestSheet> createState() => _VerifyRequestSheetState();
}

class _VerifyRequestSheetState extends State<_VerifyRequestSheet> {
  final _nameCtrl   = TextEditingController();
  final _reasonCtrl = TextEditingController();
  final _linksCtrl  = TextEditingController();
  String _category  = 'creator';
  bool _loading     = false;
  String _error     = '';

  static const _categories = [
    ('creator',    'Creator / Influencer'),
    ('brand',      'Brand / Business'),
    ('journalist', 'Journalist / Media'),
    ('athlete',    'Athlete / Sports'),
    ('other',      'Other'),
  ];

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty || _reasonCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Name and reason are required');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    try {
      await Api.post('/users/verification-request', {
        'fullName': _nameCtrl.text.trim(),
        'category': _category,
        'reason': _reasonCtrl.text.trim(),
        'links': _linksCtrl.text.trim(),
      });
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Verification request submitted'),
          backgroundColor: surface2));
    } catch (e) {
      setState(() => _error = e.toString());
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Request verification',
                style: TextStyle(
                    color: white,
                    fontWeight: FontWeight.w800,
                    fontSize: 18)),
            GestureDetector(
                onTap: () => Navigator.pop(context),
                child: const Icon(Icons.close, color: gray3)),
          ]),
          const SizedBox(height: 4),
          const Text(
              'Tell us who you are and why you should be verified',
              style: TextStyle(color: gray3, fontSize: 13)),
          const SizedBox(height: 20),
          if (_error.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  color: const Color(0x1Aef4444),
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: const Color(0x33ef4444))),
              child: Text(_error,
                  style: const TextStyle(color: redColor, fontSize: 13)),
            ),
          const Text('Full legal name',
              style: TextStyle(
                  color: gray3,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextField(
              controller: _nameCtrl,
              style: const TextStyle(color: white),
              decoration:
                  const InputDecoration(hintText: 'Your real name')),
          const SizedBox(height: 14),
          const Text('Category',
              style: TextStyle(
                  color: gray3,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
                color: surface2,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor)),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _category,
                dropdownColor: surface2,
                isExpanded: true,
                style: const TextStyle(color: white),
                items: _categories
                    .map((c) => DropdownMenuItem(
                        value: c.$1, child: Text(c.$2)))
                    .toList(),
                onChanged: (v) => setState(() => _category = v!),
              ),
            ),
          ),
          const SizedBox(height: 14),
          const Text('Why should you be verified?',
              style: TextStyle(
                  color: gray3,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextField(
              controller: _reasonCtrl,
              maxLines: 4,
              style: const TextStyle(color: white),
              decoration: const InputDecoration(
                  hintText: 'Describe your public presence…')),
          const SizedBox(height: 14),
          const Text('Supporting links (optional)',
              style: TextStyle(
                  color: gray3,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          TextField(
              controller: _linksCtrl,
              maxLines: 2,
              style: const TextStyle(color: white),
              decoration: const InputDecoration(
                  hintText: 'Website, social profiles…')),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: orange,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          color: white, strokeWidth: 2))
                  : const Text('Submit request',
                      style: TextStyle(
                          color: white, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }
}

// ── Stat widget ───────────────────────────────────────────────────────────────

class _Stat extends StatelessWidget {
  final String label;
  final int value;
  final VoidCallback? onTap;
  const _Stat({required this.label, required this.value, this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('$value', style: const TextStyle(color: white, fontWeight: FontWeight.w800, fontSize: 16)),
      Text(label, style: TextStyle(color: onTap != null ? orange : gray3, fontSize: 12)),
    ]),
  );
}
