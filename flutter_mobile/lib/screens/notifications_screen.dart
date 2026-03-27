import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/avatar.dart';
import '../widgets/empty_state.dart';

import '../widgets/vamppe_logo.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List notifications = [];
  bool loading = true;

  static const _types = {
    'like':    (Color(0x1Ef43f5e),  Color(0xFFfb7185), '♥',  'liked your post'),
    'comment': (Color(0x1E8b5cf6),  Color(0xFFa78bfa), '💬', 'replied to your post'),
    'follow':  (Color(0x1Ef97316),  Color(0xFFfb923c), '✦',  'started following you'),
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await Api.get('/notifications');
      Api.put('/notifications/read');
      setState(() { notifications = res; loading = false; });
    } catch (_) { setState(() => loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const Padding(
          padding: EdgeInsets.all(10),
          child: VamppeLogo(size: 28),
        ),
        title: const Text('Activity')),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: orange))
          : RefreshIndicator(
              color: orange,
              backgroundColor: surface1,
              onRefresh: _load,
              child: notifications.isEmpty
                  ? ListView(children: const [
                      SizedBox(height: 120),
                      EmptyState(
                        icon: Icons.notifications_none_outlined,
                        title: 'All quiet here',
                        subtitle: 'When people like your posts or follow you, you\'ll see it here.',
                      ),
                    ])
                  : ListView.builder(
                      itemCount: notifications.length,
                      itemBuilder: (_, i) {
                    final n = notifications[i];
                    final t = _types[n['type']] ?? _types['like']!;
                    final createdAt = DateTime.tryParse(n['createdAt'] ?? '') ?? DateTime.now();
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: n['read'] == false ? const Color(0x08f97316) : Colors.transparent,
                        border: const Border(bottom: BorderSide(color: Color(0x0AFFFFFF))),
                      ),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(color: t.$1, borderRadius: BorderRadius.circular(12)),
                          child: Center(child: Text(t.$3, style: TextStyle(color: t.$2, fontSize: 14))),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Avatar(
                              src: n['fromUser']?['profilePicture'],
                              size: 32,
                              onTap: () => Navigator.pushNamed(context, '/profile', arguments: n['fromUser']?['_id']),
                            ),
                            if (n['read'] == false) ...[
                              const SizedBox(width: 8),
                              Container(width: 7, height: 7, decoration: const BoxDecoration(color: orange, shape: BoxShape.circle)),
                            ],
                          ]),
                          const SizedBox(height: 6),
                          RichText(text: TextSpan(
                            style: const TextStyle(color: gray2, fontSize: 14, height: 1.4),
                            children: [
                              TextSpan(text: n['fromUser']?['username'] ?? '', style: const TextStyle(color: white, fontWeight: FontWeight.w700)),
                              TextSpan(text: ' ${t.$4}'),
                            ],
                          )),
                          if (n['postId']?['content'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text('"${n['postId']['content']}"', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: gray4, fontSize: 12)),
                            ),
                          const SizedBox(height: 3),
                          Text(timeago.format(createdAt), style: const TextStyle(color: gray4, fontSize: 11)),
                        ])),
                      ]),
                    );
                  },
                ),
            ),
    );
  }
}
