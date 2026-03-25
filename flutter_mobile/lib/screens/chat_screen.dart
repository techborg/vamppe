import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/avatar.dart';
import '../context/auth_provider.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List conversations = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await Api.get('/messages/conversations');
      setState(() { conversations = res; loading = false; });
    } catch (_) { setState(() => loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: orange))
          : RefreshIndicator(
              color: orange,
              backgroundColor: surface1,
              onRefresh: _load,
              child: conversations.isEmpty
                  ? ListView(children: const [
                      SizedBox(height: 160),
                      Center(child: Text('No conversations yet.\nMessage someone from their profile.', textAlign: TextAlign.center, style: TextStyle(color: gray3))),
                    ])
                  : ListView.builder(
                      itemCount: conversations.length,
                      itemBuilder: (_, i) {
                        final c = conversations[i];
                        final u = c['user'];
                        final last = c['lastMessage'];
                        final online = auth.isOnline(u?['_id'] ?? '');
                        final createdAt = last?['createdAt'] != null ? DateTime.tryParse(last['createdAt']) : null;
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Stack(children: [
                            Avatar(src: u?['profilePicture'], size: 48),
                            if (online)
                              Positioned(bottom: 1, right: 1,
                                child: Container(
                                  width: 11, height: 11,
                                  decoration: BoxDecoration(color: greenColor, shape: BoxShape.circle, border: Border.all(color: bgColor, width: 2)),
                                )),
                          ]),
                          title: Text(u?['username'] ?? '', style: const TextStyle(color: white, fontWeight: FontWeight.w700)),
                          subtitle: Text(last?['message'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: gray3, fontSize: 13)),
                          trailing: createdAt != null ? Text(timeago.format(createdAt), style: const TextStyle(color: gray4, fontSize: 11)) : null,
                          onTap: () => Navigator.pushNamed(context, '/chatroom', arguments: {
                            'userId': u?['_id'],
                            'username': u?['username'],
                            'profilePicture': u?['profilePicture'],
                          }),
                        );
                      },
                    ),
            ),
    );
  }
}
