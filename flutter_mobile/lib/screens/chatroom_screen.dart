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
  List<Map<String, dynamic>> messages = [];
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  bool loading = true;
  bool _initialized = false;
  bool _isTyping = false;
  bool _theyTyping = false;
  late String userId;
  late String username;
  late String? profilePicture;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;

    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    if (args == null) { Navigator.pop(context); return; }
    userId = args['userId'] ?? '';
    username = args['username'] ?? '';
    profilePicture = args['profilePicture'];

    _load();
    context.read<AuthProvider>().addMessageListener(_onMessage);
    context.read<AuthProvider>().addTypingListener(_onTyping);
    context.read<AuthProvider>().addReadListener(_onRead);
  }

  void _onMessage(Map<String, dynamic> msg) {
    final senderId = msg['senderId']?['_id'] ?? msg['senderId'];
    if (senderId == userId && mounted) {
      setState(() { messages = [...messages, msg]; _theyTyping = false; });
      _scrollToBottom();
      context.read<AuthProvider>().emitMarkAsRead(userId);
    }
  }

  void _onTyping(String fromId, bool typing) {
    if (fromId == userId && mounted) setState(() => _theyTyping = typing);
  }

  void _onRead(String byId) {
    if (byId == userId && mounted) {
      setState(() {
        messages = messages.map((m) => {...m, 'read': true}).toList();
      });
    }
  }

  @override
  void dispose() {
    context.read<AuthProvider>().removeMessageListener(_onMessage);
    context.read<AuthProvider>().removeTypingListener(_onTyping);
    context.read<AuthProvider>().removeReadListener(_onRead);
    if (_isTyping) context.read<AuthProvider>().emitTyping(userId, false);
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (userId.isEmpty) {
      setState(() => loading = false);
      return;
    }
    try {
      final res = await Api.get('/messages/history/$userId');
      if (!mounted) return;
      setState(() {
        messages = (res as List).cast<Map<String, dynamic>>();
        loading = false;
      });
      _scrollToBottom();
      context.read<AuthProvider>().emitMarkAsRead(userId);
    } catch (e) {
      if (mounted) setState(() => loading = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    _ctrl.clear();
    setState(() => _isTyping = false);
    context.read<AuthProvider>().emitTyping(userId, false);
    try {
      final res = await Api.post('/messages/send', {'receiverId': userId, 'message': text});
      if (!mounted) return;
      setState(() => messages = [...messages, Map<String, dynamic>.from(res)]);
      _scrollToBottom();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: redColor));
    }
  }

  void _onTextChanged(String val) {
    final typing = val.isNotEmpty;
    if (typing != _isTyping) {
      _isTyping = typing;
      context.read<AuthProvider>().emitTyping(userId, typing);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final myId = auth.user?['_id'];
    final online = auth.isOnline(userId);

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Avatar(
            src: profilePicture,
            size: 32,
            onTap: () => Navigator.pushNamed(context, '/profile', arguments: userId),
          ),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(username, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: white)),
            Text(
              online ? '● Active now' : _theyTyping ? '● typing...' : '● Offline',
              style: TextStyle(fontSize: 11, color: online ? greenColor : _theyTyping ? orange : gray3),
            ),
          ]),
        ]),
      ),
      body: Column(children: [
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: orange))
              : messages.isEmpty
                  ? Center(
                      child: Text(
                        'No messages yet.\nSay hello to $username!',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: gray3),
                      ),
                    )
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                      itemCount: messages.length + (_theyTyping ? 1 : 0),
                      itemBuilder: (_, i) {
                        // Typing indicator bubble
                        if (i == messages.length) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(children: [
                              Avatar(src: profilePicture, size: 26),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(color: surface2, borderRadius: BorderRadius.circular(18), border: Border.all(color: borderColor)),
                                child: Row(mainAxisSize: MainAxisSize.min, children: [
                                  _TypingDot(delay: 0),
                                  const SizedBox(width: 4),
                                  _TypingDot(delay: 200),
                                  const SizedBox(width: 4),
                                  _TypingDot(delay: 400),
                                ]),
                              ),
                            ]),
                          );
                        }

                        final m = messages[i];
                        final senderId = m['senderId']?['_id'] ?? m['senderId'];
                        final isMine = senderId == myId;
                        final isLast = i == messages.length - 1;
                        final createdAt = DateTime.tryParse(m['createdAt'] ?? '') ?? DateTime.now();

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            mainAxisAlignment: isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (!isMine) ...[
                                Avatar(src: profilePicture, size: 26),
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
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        m['message'] ?? '',
                                        style: TextStyle(color: isMine ? white : gray1, fontSize: 15, height: 1.4),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        timeago.format(createdAt),
                                        style: TextStyle(fontSize: 10, color: isMine ? Colors.white54 : gray4),
                                      ),
                                      if (isMine && isLast)
                                        Text(m['read'] == true ? ' ✓✓' : ' ✓',
                                            style: const TextStyle(fontSize: 10, color: Colors.white54)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ),

        // Input bar
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: Color(0x0FFFFFFF))),
          ),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _ctrl,
                style: const TextStyle(color: white),
                maxLines: null,
                textInputAction: TextInputAction.send,
                onChanged: _onTextChanged,
                decoration: InputDecoration(
                  hintText: 'Message $username…',
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

class _TypingDot extends StatefulWidget {
  final int delay;
  const _TypingDot({required this.delay});
  @override
  State<_TypingDot> createState() => _TypingDotState();
}

class _TypingDotState extends State<_TypingDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _anim = Tween(begin: 0.0, end: -6.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.repeat(reverse: true);
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Transform.translate(
      offset: Offset(0, _anim.value),
      child: Container(width: 7, height: 7, decoration: const BoxDecoration(color: gray3, shape: BoxShape.circle)),
    ),
  );
}
