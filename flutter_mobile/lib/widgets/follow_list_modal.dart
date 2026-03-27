import 'package:flutter/material.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import 'avatar.dart';
import 'verified_badge.dart';

class FollowListModal extends StatefulWidget {
  final String userId;
  final String type; // 'followers' | 'following'
  const FollowListModal({super.key, required this.userId, required this.type});

  @override
  State<FollowListModal> createState() => _FollowListModalState();
}

class _FollowListModalState extends State<FollowListModal> {
  List<Map<String, dynamic>> users = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final profile = await Api.get('/users/profile/${widget.userId}');
      final list = (profile[widget.type] as List? ?? []).cast<Map<String, dynamic>>();
      setState(() => users = list);
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: surface1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(children: [
        // Handle
        Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4,
            decoration: BoxDecoration(color: gray4, borderRadius: BorderRadius.circular(2))),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(widget.type == 'followers' ? 'Followers' : 'Following',
              style: const TextStyle(color: white, fontWeight: FontWeight.w800, fontSize: 17)),
        ),
        const Divider(color: borderColor, height: 1),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: orange))
              : users.isEmpty
                  ? Center(child: Text('No ${widget.type} yet', style: const TextStyle(color: gray3)))
                  : ListView.builder(
                      itemCount: users.length,
                      itemBuilder: (_, i) {
                        final u = users[i];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          leading: Avatar(src: u['profilePicture'], size: 44,
                              onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/profile', arguments: u['_id']); }),
                          title: Row(children: [
                            Text(u['username'] ?? '', style: const TextStyle(color: white, fontWeight: FontWeight.w700)),
                            if (u['verified'] == true) ...[
                              const SizedBox(width: 4),
                              VerifiedBadge(type: u['verifiedType'] ?? 'blue', size: 14),
                            ],
                          ]),
                          subtitle: u['bio'] != null && u['bio'].isNotEmpty
                              ? Text(u['bio'], maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: gray3, fontSize: 12))
                              : null,
                          onTap: () { Navigator.pop(context); Navigator.pushNamed(context, '/profile', arguments: u['_id']); },
                        );
                      },
                    ),
        ),
      ]),
    );
  }
}

void showFollowList(BuildContext context, String userId, String type) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => FollowListModal(userId: userId, type: type),
  );
}
