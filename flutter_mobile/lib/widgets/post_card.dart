import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../utils/api.dart';
import '../utils/constants.dart';
import '../utils/theme.dart';
import 'avatar.dart';
import 'verified_badge.dart';

class PostCard extends StatefulWidget {
  final Map<String, dynamic> post;
  final Function(String) onDelete;
  final Function(Map<String, dynamic>) onUpdate;

  const PostCard({super.key, required this.post, required this.onDelete, required this.onUpdate});

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool showComments = false;
  final _commentCtrl = TextEditingController();
  bool submitting = false;

  late bool liked;
  late int likeCount;

  @override
  void initState() {
    super.initState();
    // liked/likeCount set from post data — userId comparison done server-side
    liked = false;
    likeCount = (widget.post['likes'] as List?)?.length ?? 0;
  }

  Future<void> _like() async {
    setState(() { liked = !liked; likeCount += liked ? 1 : -1; });
    try {
      final res = await Api.post('/posts/like/${widget.post['_id']}');
      widget.onUpdate({...widget.post, 'likes': res['likes']});
    } catch (_) {
      setState(() { liked = !liked; likeCount += liked ? 1 : -1; });
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
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Remove', style: TextStyle(color: redColor))),
        ],
      ),
    );
    if (ok == true) {
      await Api.delete('/posts/${widget.post['_id']}');
      widget.onDelete(widget.post['_id']);
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final userId = post['userId'];
    final comments = (post['comments'] as List?) ?? [];
    final rawImage = post['image'] as String?;
    String? imageUrl;
    if (rawImage != null && rawImage.isNotEmpty) {
      if (rawImage.startsWith('http')) {
        // Re-map any stored full URL to current baseUrl (handles IP changes)
        final uri = Uri.tryParse(rawImage);
        final path = uri?.path ?? rawImage;
        imageUrl = '$baseUrl$path';
      } else {
        imageUrl = '$baseUrl$rawImage';
      }
    }
    final createdAt = DateTime.tryParse(post['createdAt'] ?? '') ?? DateTime.now();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0x0DFFFFFF))),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Row(children: [
          Avatar(
            src: userId?['profilePicture'],
            size: 40,
            onTap: () => Navigator.pushNamed(context, '/profile', arguments: userId?['_id']),
          ),
          const SizedBox(width: 10),
          Expanded(child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/profile', arguments: userId?['_id']),
              child: Row(children: [
                Text(userId?['username'] ?? '', style: const TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 14)),
                if (userId?['verified'] == true) ...[
                  const SizedBox(width: 4),
                  VerifiedBadge(type: userId?['verifiedType'] ?? 'blue', size: 14),
                ],
              ]),
            ),
            Row(children: [
              Text(timeago.format(createdAt), style: const TextStyle(color: gray4, fontSize: 12)),
              // Delete button — shown only for own posts (handled by server 403)
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _delete,
                child: const Text('✕', style: TextStyle(color: gray4, fontSize: 15)),
              ),
            ]),
          ])),
        ]),

        // Content
        if (post['content'] != null && post['content'].isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(post['content'], style: const TextStyle(color: gray1, fontSize: 15, height: 1.5)),
          ),

        // Image
        if (imageUrl != null)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: CachedNetworkImage(imageUrl: imageUrl, width: double.infinity, height: 220, fit: BoxFit.cover),
            ),
          ),

        // Actions
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Row(children: [
            _ActionBtn(
              icon: '💬',
              count: comments.length,
              active: showComments,
              activeColor: violetLight,
              onTap: () => setState(() => showComments = !showComments),
            ),
            const SizedBox(width: 4),
            _ActionBtn(
              icon: liked ? '♥' : '♡',
              count: likeCount,
              active: liked,
              activeColor: const Color(0xFFfb7185),
              onTap: _like,
            ),
          ]),
        ),

        // Comments
        if (showComments) ...[
          const SizedBox(height: 12),
          const Divider(color: Color(0x0DFFFFFF), height: 1),
          const SizedBox(height: 10),
          if (comments.isEmpty)
            const Text('No replies yet', style: TextStyle(color: gray4, fontSize: 12)),
          ...comments.map((c) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Avatar(src: c['userId']?['profilePicture'], size: 28,
                  onTap: () => Navigator.pushNamed(context, '/profile', arguments: c['userId']?['_id'])),
              const SizedBox(width: 8),
              Expanded(child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: surface2,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(c['userId']?['username'] ?? '', style: const TextStyle(color: gray2, fontWeight: FontWeight.w700, fontSize: 12)),
                  const SizedBox(height: 2),
                  Text(c['text'] ?? '', style: const TextStyle(color: gray2, fontSize: 13)),
                ]),
              )),
            ]),
          )),
          Row(children: [
            Expanded(
              child: TextField(
                controller: _commentCtrl,
                style: const TextStyle(color: white, fontSize: 13),
                decoration: const InputDecoration(hintText: 'Add a reply…', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
              ),
            ),
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

class _ActionBtn extends StatelessWidget {
  final String icon;
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
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(10)),
        child: Row(children: [
          Text(icon, style: TextStyle(fontSize: 16, color: color)),
          if (count > 0) ...[
            const SizedBox(width: 4),
            Text('$count', style: TextStyle(fontSize: 13, color: color)),
          ],
        ]),
      ),
    );
  }
}
