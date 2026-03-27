import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../utils/api.dart';
import '../utils/constants.dart';
import '../utils/theme.dart';
import '../context/auth_provider.dart';
import 'avatar.dart';
import 'verified_badge.dart';
import 'toast.dart';

const _reactions = ['❤️', '🔥', '😂', '😢', '😮', '😡'];

// ── Full-screen image viewer ──────────────────────────────────────────────────
class _ImageViewer extends StatelessWidget {
  final String url;
  const _ImageViewer({required this.url});
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.black,
    body: GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Center(child: InteractiveViewer(child: CachedNetworkImage(imageUrl: url, fit: BoxFit.contain))),
    ),
  );
}

// ── Heart burst animation ─────────────────────────────────────────────────────
class _HeartBurst extends StatefulWidget {
  final VoidCallback onDone;
  const _HeartBurst({required this.onDone});
  @override
  State<_HeartBurst> createState() => _HeartBurstState();
}

class _HeartBurstState extends State<_HeartBurst> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale, _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _scale   = Tween(begin: 0.3, end: 1.4).animate(CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut));
    _opacity = Tween(begin: 1.0, end: 0.0).animate(CurvedAnimation(parent: _ctrl, curve: const Interval(0.6, 1.0)));
    _ctrl.forward().then((_) => widget.onDone());
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _ctrl,
    builder: (_, __) => Opacity(
      opacity: _opacity.value,
      child: Transform.scale(scale: _scale.value, child: const Icon(Icons.favorite, color: Colors.white, size: 80)),
    ),
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
class PostCard extends StatefulWidget {
  final Map<String, dynamic> post;
  final Function(String) onDelete;
  final Function(Map<String, dynamic>) onUpdate;
  final bool bookmarked;

  const PostCard({
    super.key,
    required this.post,
    required this.onDelete,
    required this.onUpdate,
    this.bookmarked = false,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool showComments  = false;
  bool showReactions = false;
  bool showHeart     = false;
  bool submitting    = false;
  bool liked         = false;
  bool _bookmarked   = false;
  int  likeCount     = 0;
  String? _myReaction;
  final _commentCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    likeCount   = (widget.post['likes'] as List?)?.length ?? 0;
    _bookmarked = widget.bookmarked;
    // Defer auth-dependent init to after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) => _initFromAuth());
  }

  void _initFromAuth() {
    if (!mounted) return;
    final myId = context.read<AuthProvider>().user?['_id'];
    final likes = (widget.post['likes'] as List?) ?? [];
    setState(() {
      liked     = likes.any((l) => (l['_id'] ?? l) == myId);
      likeCount = likes.length;
      final reactions = widget.post['reactions'] as Map?;
      if (reactions != null && myId != null) {
        for (final r in _reactions) {
          final users = (reactions[r] as List?) ?? [];
          if (users.any((u) => (u['_id'] ?? u) == myId)) { _myReaction = r; break; }
        }
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
  }

  @override
  void dispose() { _commentCtrl.dispose(); super.dispose(); }

  Future<void> _like() async {
    HapticFeedback.lightImpact();
    setState(() { liked = !liked; likeCount += liked ? 1 : -1; });
    try {
      final res = await Api.post('/posts/like/${widget.post['_id']}');
      widget.onUpdate({...widget.post, 'likes': res['likes']});
    } catch (_) {
      setState(() { liked = !liked; likeCount += liked ? 1 : -1; });
    }
  }

  void _doubleTapLike() {
    if (!liked) _like();
    setState(() => showHeart = true);
  }

  Future<void> _react(String emoji) async {
    setState(() { _myReaction = _myReaction == emoji ? null : emoji; showReactions = false; });
    try { await Api.post('/posts/react/${widget.post['_id']}', {'reaction': emoji}); } catch (_) {}
  }

  Future<void> _bookmark() async {
    HapticFeedback.lightImpact();
    setState(() => _bookmarked = !_bookmarked);
    try {
      await Api.post('/bookmarks/${widget.post['_id']}');
      if (mounted) Toast.show(context, _bookmarked ? 'Post saved' : 'Removed from saved', success: true);
    } catch (_) {
      setState(() => _bookmarked = !_bookmarked);
    }
  }

  Future<void> _comment() async {
    if (_commentCtrl.text.trim().isEmpty) return;
    setState(() => submitting = true);
    try {
      final res = await Api.post('/posts/comment/${widget.post['_id']}', {'text': _commentCtrl.text});
      widget.onUpdate(Map<String, dynamic>.from(res));
      _commentCtrl.clear();
    } catch (_) {}
    setState(() => submitting = false);
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: surface2,
        title: const Text('Remove post?', style: TextStyle(color: white)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: gray3))),
          TextButton(onPressed: () => Navigator.pop(context, true),  child: const Text('Remove', style: TextStyle(color: redColor))),
        ],
      ),
    );
    if (ok == true) {
      await Api.delete('/posts/${widget.post['_id']}');
      widget.onDelete(widget.post['_id']);
    }
  }

  Future<void> _deleteComment(String commentId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: surface2,
        title: const Text('Remove reply?', style: TextStyle(color: white)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: gray3))),
          TextButton(onPressed: () => Navigator.pop(context, true),  child: const Text('Remove', style: TextStyle(color: redColor))),
        ],
      ),
    );
    if (ok == true) {
      final res = await Api.delete('/posts/comment/${widget.post['_id']}/$commentId');
      widget.onUpdate(Map<String, dynamic>.from(res));
    }
  }

  void _share() {
    showModalBottomSheet(
      context: context,
      backgroundColor: surface1,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: gray4, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          const Text('Share post', style: TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
            _ShareOption(icon: Icons.copy, label: 'Copy link', onTap: () {
              Clipboard.setData(ClipboardData(text: '$baseUrl/posts/${widget.post['_id']}'));
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied'), backgroundColor: surface2, duration: Duration(seconds: 2)));
            }),
            _ShareOption(icon: Icons.bookmark_border, label: 'Save', onTap: () { Navigator.pop(context); _bookmark(); }),
            _ShareOption(icon: Icons.flag_outlined,   label: 'Report', onTap: () => Navigator.pop(context)),
          ]),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  Widget _buildParsedText(String content) {
    final spans = <TextSpan>[];
    final regex = RegExp(r'(#\w+|@\w+)');
    int last = 0;
    for (final m in regex.allMatches(content)) {
      if (m.start > last) spans.add(TextSpan(text: content.substring(last, m.start)));
      final part = m.group(0)!;
      final isMention = part.startsWith('@');
      spans.add(TextSpan(
        text: part,
        style: TextStyle(color: isMention ? violetLight : orange, fontWeight: FontWeight.w600),
        recognizer: isMention ? (TapGestureRecognizer()..onTap = () async {
          final username = part.substring(1);
          try {
            final user = await Api.get('/users/by-username/$username');
            if (mounted) Navigator.pushNamed(context, '/profile', arguments: user['_id']);
          } catch (_) {}
        }) : null,
      ));
      last = m.end;
    }
    if (last < content.length) spans.add(TextSpan(text: content.substring(last)));
    return RichText(text: TextSpan(style: const TextStyle(color: gray1, fontSize: 15, height: 1.5), children: spans));
  }

  @override
  Widget build(BuildContext context) {
    final post     = widget.post;
    final postUser = post['userId'];
    final comments = (post['comments'] as List?) ?? [];
    final rawImage = post['image'] as String?;
    String? imageUrl;
    if (rawImage != null && rawImage.isNotEmpty) {
      final path = Uri.tryParse(rawImage)?.path ?? rawImage;
      imageUrl = rawImage.startsWith('http') ? '$baseUrl$path' : '$baseUrl$rawImage';
    }
    final createdAt = DateTime.tryParse(post['createdAt'] ?? '') ?? DateTime.now();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0x0DFFFFFF)))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Header ──────────────────────────────────────────────────────────
        Row(children: [
          Avatar(src: postUser?['profilePicture'], size: 40,
              onTap: () => Navigator.pushNamed(context, '/profile', arguments: postUser?['_id'])),
          const SizedBox(width: 10),
          Expanded(child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/profile', arguments: postUser?['_id']),
              child: Row(children: [
                Text(postUser?['username'] ?? '', style: const TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 14)),
                if (postUser?['verified'] == true) ...[
                  const SizedBox(width: 4),
                  VerifiedBadge(type: postUser?['verifiedType'] ?? 'blue', size: 14),
                ],
              ]),
            ),
            Row(children: [
              Text(timeago.format(createdAt), style: const TextStyle(color: gray4, fontSize: 12)),
              const SizedBox(width: 8),
              GestureDetector(onTap: _delete, child: const Icon(Icons.more_horiz, color: gray4, size: 18)),
            ]),
          ])),
        ]),

        // ── Content ─────────────────────────────────────────────────────────
        if ((post['content'] ?? '').isNotEmpty)
          Padding(padding: const EdgeInsets.only(top: 10), child: _buildParsedText(post['content'])),

        // ── Image ───────────────────────────────────────────────────────────
        if (imageUrl != null)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: GestureDetector(
              onDoubleTap: _doubleTapLike,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _ImageViewer(url: imageUrl!))),
              child: Stack(alignment: Alignment.center, children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: CachedNetworkImage(imageUrl: imageUrl, width: double.infinity, height: 220, fit: BoxFit.cover),
                ),
                if (showHeart) _HeartBurst(onDone: () { if (mounted) setState(() => showHeart = false); }),
              ]),
            ),
          ),

        // ── Actions ─────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Row(children: [
              _ActionBtn(icon: Icons.chat_bubble_outline, count: comments.length, active: showComments, activeColor: violetLight,
                  onTap: () => setState(() => showComments = !showComments)),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: () => setState(() => showReactions = !showReactions),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Text(_myReaction ?? '😊', style: TextStyle(fontSize: 18, color: _myReaction != null ? orange : gray3)),
                ),
              ),
            ]),
            Row(children: [
              GestureDetector(
                onTap: _bookmark,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Icon(_bookmarked ? Icons.bookmark : Icons.bookmark_border, color: _bookmarked ? orange : gray3, size: 18),
                ),
              ),
              IconButton(icon: const Icon(Icons.share_outlined, color: gray3, size: 18), onPressed: _share, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
            ]),
          ]),
        ),

        // ── Reaction picker ──────────────────────────────────────────────────
        if (showReactions)
          Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: surface2, borderRadius: BorderRadius.circular(24), border: Border.all(color: borderColor)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: _reactions.map((r) => GestureDetector(
                onTap: () => _react(r),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text(r, style: TextStyle(fontSize: 22, decoration: _myReaction == r ? TextDecoration.underline : null)),
                ),
              )).toList(),
            ),
          ),

        // ── Comments ─────────────────────────────────────────────────────────
        if (showComments) ...[
          const SizedBox(height: 12),
          const Divider(color: Color(0x0DFFFFFF), height: 1),
          const SizedBox(height: 10),
          if (comments.isEmpty) const Text('No replies yet', style: TextStyle(color: gray4, fontSize: 12)),
          ...comments.map((c) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Avatar(src: c['userId']?['profilePicture'], size: 28,
                  onTap: () => Navigator.pushNamed(context, '/profile', arguments: c['userId']?['_id'])),
              const SizedBox(width: 8),
              Expanded(child: GestureDetector(
                onLongPress: () {
                  final myId = context.read<AuthProvider>().user?['_id'];
                  if (c['userId']?['_id'] == myId) _deleteComment(c['_id']);
                },
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: surface2, borderRadius: BorderRadius.circular(14), border: Border.all(color: borderColor)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Text(c['userId']?['username'] ?? '', style: const TextStyle(color: gray2, fontWeight: FontWeight.w700, fontSize: 12)),
                      if (c['userId']?['verified'] == true) ...[
                        const SizedBox(width: 4),
                        VerifiedBadge(type: c['userId']?['verifiedType'] ?? 'blue', size: 11),
                      ],
                    ]),
                    const SizedBox(height: 2),
                    _buildParsedText(c['text'] ?? ''),
                  ]),
                ),
              )),
            ]),
          )),
          Row(children: [
            Expanded(child: TextField(
              controller: _commentCtrl,
              style: const TextStyle(color: white, fontSize: 13),
              decoration: const InputDecoration(hintText: 'Add a reply…', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
            )),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: submitting ? null : _comment,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(color: orange, borderRadius: BorderRadius.circular(12)),
                child: const Text('Reply', style: TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
            ),
          ]),
        ],
      ]),
    );
  }
}

// ── Helper widgets ────────────────────────────────────────────────────────────

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final int count;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;
  const _ActionBtn({required this.icon, required this.count, required this.active, required this.activeColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = active ? activeColor : gray3;
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Row(children: [
          Icon(icon, size: 18, color: color),
          if (count > 0) ...[const SizedBox(width: 4), Text('$count', style: TextStyle(fontSize: 13, color: color))],
        ]),
      ),
    );
  }
}

class _ShareOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ShareOption({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Column(children: [
      Container(
        width: 56, height: 56,
        decoration: BoxDecoration(color: surface2, borderRadius: BorderRadius.circular(16), border: Border.all(color: borderColor)),
        child: Icon(icon, color: gray2, size: 22),
      ),
      const SizedBox(height: 6),
      Text(label, style: const TextStyle(color: gray3, fontSize: 12)),
    ]),
  );
}
