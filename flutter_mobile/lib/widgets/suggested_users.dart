import 'package:flutter/material.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import 'avatar.dart';
import 'verified_badge.dart';

class SuggestedUsers extends StatefulWidget {
  const SuggestedUsers({super.key});
  @override
  State<SuggestedUsers> createState() => _SuggestedUsersState();
}

class _SuggestedUsersState extends State<SuggestedUsers> {
  List<Map<String, dynamic>> users = [];
  final Set<String> _followed = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await Api.get('/users/suggestions');
      if (mounted) setState(() => users = (res as List).cast<Map<String, dynamic>>());
    } catch (_) {}
  }

  Future<void> _follow(String id) async {
    setState(() => _followed.add(id));
    try { await Api.post('/users/follow/$id'); } catch (_) { setState(() => _followed.remove(id)); }
  }

  @override
  Widget build(BuildContext context) {
    if (users.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Suggested for you', style: TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 14)),
          GestureDetector(
            onTap: _load,
            child: const Text('Refresh', style: TextStyle(color: orange, fontSize: 12)),
          ),
        ]),
      ),
      SizedBox(
        height: 130,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          itemCount: users.length,
          itemBuilder: (_, i) {
            final u = users[i];
            final followed = _followed.contains(u['_id']);
            return GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/profile', arguments: u['_id']),
              child: Container(
                width: 110,
                margin: const EdgeInsets.only(right: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: surface2,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Avatar(src: u['profilePicture'], size: 44),
                  const SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Flexible(child: Text(u['username'] ?? '', style: const TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 12), overflow: TextOverflow.ellipsis)),
                    if (u['verified'] == true) ...[const SizedBox(width: 3), VerifiedBadge(type: u['verifiedType'] ?? 'blue', size: 11)],
                  ]),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: followed ? null : () => _follow(u['_id']),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: followed ? surface3 : orange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(followed ? 'Following' : 'Follow',
                          style: TextStyle(color: followed ? gray3 : white, fontSize: 11, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ]),
              ),
            );
          },
        ),
      ),
      const Divider(color: borderColor, height: 1),
    ]);
  }
}
