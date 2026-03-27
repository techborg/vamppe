import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../utils/api.dart';
import '../utils/constants.dart';
import '../utils/theme.dart';
import '../context/auth_provider.dart';
import 'avatar.dart';
import 'verified_badge.dart';

// ── Story Viewer ──────────────────────────────────────────────────────────────
class StoryViewer extends StatefulWidget {
  final List<Map<String, dynamic>> groups;
  final int startIndex;
  const StoryViewer({super.key, required this.groups, required this.startIndex});

  @override
  State<StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends State<StoryViewer>
    with SingleTickerProviderStateMixin {
  late int groupIdx;
  late int storyIdx;
  late AnimationController _progress;
  bool _paused = false;
  double _dragY = 0;

  static const _duration = Duration(seconds: 5);

  @override
  void initState() {
    super.initState();
    groupIdx = widget.startIndex;
    storyIdx = 0;
    _progress = AnimationController(vsync: this, duration: _duration);
    _progress.addStatusListener((s) {
      if (s == AnimationStatus.completed && !_paused) _advance();
    });
    _startStory();
  }

  @override
  void dispose() { _progress.dispose(); super.dispose(); }

  Map<String, dynamic> get _group => widget.groups[groupIdx];
  List get _stories => _group['stories'] as List;
  Map<String, dynamic> get _story => _stories[storyIdx] as Map<String, dynamic>;

  void _startStory() {
    _progress.duration = _duration;
    _progress.reset();
    if (!_paused) _progress.forward();
    Api.post('/stories/${_story['_id']}/view').catchError((_) {});
  }

  void _advance() {
    if (storyIdx < _stories.length - 1) {
      setState(() => storyIdx++);
    } else if (groupIdx < widget.groups.length - 1) {
      setState(() { groupIdx++; storyIdx = 0; });
    } else {
      Navigator.pop(context);
      return;
    }
    _startStory();
  }

  void _retreat() {
    if (storyIdx > 0) {
      setState(() => storyIdx--);
    } else if (groupIdx > 0) {
      setState(() { groupIdx--; storyIdx = 0; });
    }
    _startStory();
  }

  void _pause() { _paused = true; _progress.stop(); }
  void _resume() { _paused = false; _progress.forward(); }

  String _imgUrl() {
    final img = _story['image'] as String? ?? '';
    return img.startsWith('http') ? img : '$baseUrl$img';
  }

  @override
  Widget build(BuildContext context) {
    final user = _group['user'] as Map?;
    final myId = context.read<AuthProvider>().user?['_id'];
    final isMe = user?['_id'] == myId;
    final views = (_story['views'] as List?)?.length ?? 0;
    final createdAt = DateTime.tryParse(_story['createdAt'] ?? '') ?? DateTime.now();

    return GestureDetector(
      onLongPressStart: (_) => _pause(),
      onLongPressEnd: (_) => _resume(),
      onTapDown: (d) {
        final x = d.globalPosition.dx;
        final w = MediaQuery.of(context).size.width;
        if (x < w / 3) _retreat(); else _advance();
      },
      onVerticalDragUpdate: (d) => setState(() => _dragY += d.delta.dy),
      onVerticalDragEnd: (d) {
        if (_dragY > 80) Navigator.pop(context);
        else setState(() => _dragY = 0);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        transform: Matrix4.translationValues(0, _dragY.clamp(0, 200), 0),
        child: Scaffold(
          backgroundColor: Colors.black,
          body: Stack(children: [

            // ── Story image ────────────────────────────────────────────────
            Positioned.fill(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: CachedNetworkImage(
                  key: ValueKey('${groupIdx}_$storyIdx'),
                  imageUrl: _imgUrl(),
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  errorWidget: (_, __, ___) => Container(color: surface2,
                      child: const Icon(Icons.image_not_supported, color: gray3, size: 48)),
                ),
              ),
            ),

            // ── Gradient overlays ──────────────────────────────────────────
            Positioned.fill(child: DecoratedBox(decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter, end: Alignment(0, -0.4),
                colors: [Colors.black54, Colors.transparent],
              ),
            ))),
            Positioned.fill(child: DecoratedBox(decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter, end: Alignment(0, 0.3),
                colors: [Colors.black54, Colors.transparent],
              ),
            ))),

            // ── Progress bars ──────────────────────────────────────────────
            Positioned(
              top: MediaQuery.of(context).padding.top + 6,
              left: 8, right: 8,
              child: AnimatedBuilder(
                animation: _progress,
                builder: (_, __) => Row(
                  children: List.generate(_stories.length, (i) => Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: i < storyIdx ? 1.0 : i == storyIdx ? _progress.value : 0.0,
                          backgroundColor: Colors.white24,
                          valueColor: const AlwaysStoppedAnimation(Colors.white),
                          minHeight: 3,
                        ),
                      ),
                    ),
                  )),
                ),
              ),
            ),

            // ── Header ────────────────────────────────────────────────────
            Positioned(
              top: MediaQuery.of(context).padding.top + 18,
              left: 12, right: 8,
              child: Row(children: [
                GestureDetector(
                  onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/profile', arguments: user?['_id']); },
                  child: Row(children: [
                    Container(
                      decoration: BoxDecoration(shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5)),
                      child: Avatar(src: user?['profilePicture'], size: 34),
                    ),
                    const SizedBox(width: 10),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(user?['username'] ?? '', style: const TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 14, shadows: [Shadow(blurRadius: 4)])),
                        if (user?['verified'] == true) ...[
                          const SizedBox(width: 4),
                          VerifiedBadge(type: user?['verifiedType'] ?? 'blue', size: 13),
                        ],
                      ]),
                      Text(timeago.format(createdAt), style: const TextStyle(color: Colors.white60, fontSize: 11)),
                    ]),
                  ]),
                ),
                const Spacer(),
                if (isMe)
                  IconButton(
                    icon: const Icon(Icons.more_vert, color: white),
                    onPressed: () => _showStoryOptions(context),
                  ),
                IconButton(
                  icon: const Icon(Icons.close, color: white),
                  onPressed: () => Navigator.pop(context),
                ),
              ]),
            ),

            // ── Caption ───────────────────────────────────────────────────
            if ((_story['caption'] ?? '').isNotEmpty)
              Positioned(
                bottom: 80,
                left: 16, right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.black45,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(_story['caption'], style: const TextStyle(color: white, fontSize: 15, height: 1.4)),
                ),
              ),

            // ── Footer: views ─────────────────────────────────────────────
            Positioned(
              bottom: 24,
              left: 16, right: 16,
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                if (isMe)
                  Row(children: [
                    const Icon(Icons.remove_red_eye_outlined, color: Colors.white60, size: 16),
                    const SizedBox(width: 4),
                    Text('$views', style: const TextStyle(color: Colors.white60, fontSize: 13)),
                  ])
                else
                  const SizedBox.shrink(),
                // Swipe up hint
                const Column(children: [
                  Icon(Icons.keyboard_arrow_up, color: Colors.white38, size: 20),
                  Text('Swipe down to close', style: TextStyle(color: Colors.white38, fontSize: 10)),
                ]),
              ]),
            ),

            // ── Pause indicator ───────────────────────────────────────────
            if (_paused)
              const Center(child: Icon(Icons.pause_circle_outline, color: Colors.white38, size: 64)),
          ]),
        ),
      ),
    );
  }

  void _showStoryOptions(BuildContext context) {
    _pause();
    showModalBottomSheet(
      context: context,
      backgroundColor: surface1,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(height: 8),
        Container(width: 40, height: 4, decoration: BoxDecoration(color: gray4, borderRadius: BorderRadius.circular(2))),
        ListTile(
          leading: const Icon(Icons.delete_outline, color: redColor),
          title: const Text('Delete story', style: TextStyle(color: redColor)),
          onTap: () async {
            Navigator.pop(context);
            await Api.delete('/stories/${_story['_id']}').catchError((_) {});
            if (mounted) Navigator.pop(context);
          },
        ),
        const SizedBox(height: 8),
      ]),
    ).then((_) => _resume());
  }
}

// ── Create Story Sheet ────────────────────────────────────────────────────────
class _CreateStorySheet extends StatefulWidget {
  final String imagePath;
  final VoidCallback onCreated;
  const _CreateStorySheet({required this.imagePath, required this.onCreated});

  @override
  State<_CreateStorySheet> createState() => _CreateStorySheetState();
}

class _CreateStorySheetState extends State<_CreateStorySheet> {
  final _captionCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _post() async {
    setState(() => _loading = true);
    try {
      await Api.postMultipart('/stories', {'caption': _captionCtrl.text.trim()}, files: {'image': widget.imagePath});
      if (mounted) { Navigator.pop(context); widget.onCreated(); }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(color: surface1, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: gray4, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          const Text('New Story', style: TextStyle(color: white, fontWeight: FontWeight.w800, fontSize: 17)),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.asset(widget.imagePath, height: 200, width: double.infinity, fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(height: 200, color: surface2)),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _captionCtrl,
            style: const TextStyle(color: white),
            maxLines: 2,
            decoration: const InputDecoration(hintText: 'Add a caption… (optional)'),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: orange, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 14)),
              onPressed: _loading ? null : _post,
              child: _loading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: white, strokeWidth: 2))
                  : const Text('Share Story', style: TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 15)),
            ),
          ),
        ]),
      ),
    );
  }
}

// ── Stories Bar ───────────────────────────────────────────────────────────────
class StoriesBar extends StatefulWidget {
  const StoriesBar({super.key});
  @override
  State<StoriesBar> createState() => _StoriesBarState();
}

class _StoriesBarState extends State<StoriesBar> {
  List<Map<String, dynamic>> groups = [];
  bool loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await Api.get('/stories');
      if (mounted) setState(() => groups = (res as List).cast<Map<String, dynamic>>());
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  Future<void> _pickAndCreate() async {
    HapticFeedback.lightImpact();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: surface1,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(height: 8),
        Container(width: 40, height: 4, decoration: BoxDecoration(color: gray4, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 8),
        ListTile(leading: const Icon(Icons.photo_library_outlined, color: orange), title: const Text('Choose from gallery', style: TextStyle(color: white)), onTap: () => Navigator.pop(context, ImageSource.gallery)),
        ListTile(leading: const Icon(Icons.camera_alt_outlined, color: orange), title: const Text('Take a photo', style: TextStyle(color: white)), onTap: () => Navigator.pop(context, ImageSource.camera)),
        const SizedBox(height: 8),
      ]),
    );
    if (source == null || !mounted) return;
    final img = await ImagePicker().pickImage(source: source, imageQuality: 90);
    if (img == null || !mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateStorySheet(imagePath: img.path, onCreated: _load),
    );
  }

  void _openStory(int index) {
    HapticFeedback.selectionClick();
    Navigator.push(context, PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black87,
      pageBuilder: (_, __, ___) => StoryViewer(groups: groups, startIndex: index),
      transitionsBuilder: (_, anim, __, child) => FadeTransition(
        opacity: CurvedAnimation(parent: anim, curve: Curves.easeOut),
        child: ScaleTransition(scale: Tween(begin: 0.95, end: 1.0).animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)), child: child),
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(
        height: 96,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          children: [
            // ── Add story ──────────────────────────────────────────────────
            _StoryItem(
              onTap: _pickAndCreate,
              hasRing: false,
              label: 'Your story',
              child: Stack(alignment: Alignment.bottomRight, children: [
                Avatar(src: auth.user?['profilePicture'], size: 58),
                Container(
                  width: 22, height: 22,
                  decoration: BoxDecoration(color: orange, shape: BoxShape.circle, border: Border.all(color: bgColor, width: 2)),
                  child: const Icon(Icons.add, color: white, size: 13),
                ),
              ]),
            ),

            // ── Skeleton loaders ───────────────────────────────────────────
            if (loading)
              ...List.generate(4, (_) => _StoryItem(
                onTap: () {}, hasRing: false, label: '',
                child: _ShimmerCircle(size: 58),
              ))
            else
              ...groups.asMap().entries.map((e) {
                final g = e.value;
                final user = g['user'] as Map?;
                final seen = (g['allSeen'] as bool?) ?? false;
                final hasNew = !(g['allSeen'] as bool? ?? true);
                return _StoryItem(
                  onTap: () => _openStory(e.key),
                  hasRing: true,
                  seen: seen,
                  label: user?['username'] ?? '',
                  child: Avatar(src: user?['profilePicture'], size: 58),
                  badge: hasNew ? Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(color: orange, shape: BoxShape.circle, border: Border.all(color: bgColor, width: 1.5)),
                  ) : null,
                );
              }),
          ],
        ),
      ),
      const Divider(color: borderColor, height: 1),
    ]);
  }
}

// ── Story item ────────────────────────────────────────────────────────────────
class _StoryItem extends StatelessWidget {
  final Widget child;
  final String label;
  final VoidCallback onTap;
  final bool hasRing;
  final bool seen;
  final Widget? badge;

  const _StoryItem({
    required this.child,
    required this.label,
    required this.onTap,
    required this.hasRing,
    this.seen = false,
    this.badge,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.only(right: 14),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Stack(alignment: Alignment.bottomRight, children: [
          Container(
            width: 66, height: 66,
            decoration: hasRing
                ? BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: seen
                        ? null
                        : const LinearGradient(colors: [Color(0xFFf97316), Color(0xFF8b5cf6)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                    border: seen ? Border.all(color: gray4, width: 2) : null,
                  )
                : null,
            padding: hasRing ? const EdgeInsets.all(2.5) : EdgeInsets.zero,
            child: ClipOval(child: child),
          ),
          if (badge != null) badge!,
        ]),
        const SizedBox(height: 5),
        SizedBox(
          width: 66,
          child: Text(label,
              style: const TextStyle(color: gray2, fontSize: 11),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
        ),
      ]),
    ),
  );
}

// ── Shimmer circle ────────────────────────────────────────────────────────────
class _ShimmerCircle extends StatefulWidget {
  final double size;
  const _ShimmerCircle({required this.size});
  @override
  State<_ShimmerCircle> createState() => _ShimmerCircleState();
}

class _ShimmerCircleState extends State<_ShimmerCircle> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
    _anim = Tween(begin: 0.2, end: 0.5).animate(_ctrl);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Container(
      width: widget.size, height: widget.size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(_anim.value)),
    ),
  );
}
