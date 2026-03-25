import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../utils/api.dart';
import '../utils/theme.dart';
import '../widgets/avatar.dart';
import '../context/auth_provider.dart';

class ChatRoomScreen extends StatefulWidget {
  const ChatRoomScreen({super.key});
  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  List messages = [];
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  bool loading = true;
  late Map args;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    args = ModalRoute.of(context)!.settings.arguments as Map;
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await Api.get('/messages/history/${args['userId']}');
      setState(() { messages = res; loading = false; });
      _scrollToBottom();
    } catch (_) { setState(() => loading = false); }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
    });
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    _ctrl.clear();
    try {
      final res = await Api.post('/messages/send', {'receiverId': args['userId'], 'message': text});
      setState(() => messages = [...messages, res]);
      _scrollToBottom();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final myId = auth.user?['_id'];
    final online = auth.isOnline(args['userId'] ?? '');

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Avatar(src: args['profilePicture'], size: 32,
              onTap: () => Navigator.pushNamed(context, '/profile', arguments: args['userId'])),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(args['username'] ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            Text(online ? '● Active now' : '● Offline',
                style: TextStyle(fontSize: 11, color: online ? greenColor : gray3)),
          ]),
        ]),
      ),
      body: Column(children: [
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: orange))
              : ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.all(12),
                  itemCount: messages.length,
                  itemBuilder: (_, i) {
                    final m = messages[i];
                    final isMine = (m['senderId']?['_id'] ?? m['senderId']) == myId;
                    final createdAt = DateTime.tryParse(m['createdAt'] ?? '') ?? DateTime.now();
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      child: Row(
                        mainAxisAlignment: isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (!isMine) ...[
                            Avatar(src: args['profilePicture'], size: 26),
                            const SizedBox(width: 6),
                          ],
                          ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                              decoration: BoxDecoration(
                                color: isMine ? orange : surface2,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(18),
                                  topRight: const Radius.circular(18),
                                  bottomLeft: Radius.circular(isMine ? 18 : 4),
                                  bottomRight: Radius.circular(isMine ? 4 : 18),
                                ),
                                border: isMine ? null : Border.all(color: borderColor),
                              ),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                Text(m['message'] ?? '', style: TextStyle(color: isMine ? white : gray1, fontSize: 15, height: 1.4)),
                                const SizedBox(height: 3),
                                Text(timeago.format(createdAt),
                                    style: TextStyle(fontSize: 10, color: isMine ? Colors.white54 : gray4)),
                              ]),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0x0FFFFFFF)))),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _ctrl,
                style: const TextStyle(color: white),
                maxLines: null,
                decoration: InputDecoration(
                  hintText: 'Message ${args['username']}…',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                onSubmitted: (_) => _send(),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _send,
              child: Container(
                width: 44, height: 44,
                decoration: const BoxDecoration(color: orange, shape: BoxShape.circle),
                child: const Icon(Icons.send_rounded, color: white, size: 20),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}
