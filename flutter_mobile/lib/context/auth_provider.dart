import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../utils/constants.dart';
import '../utils/notification_service.dart';
import '../utils/api.dart';

// Forward declaration — set by main.dart
GlobalKey<NavigatorState>? appNavigatorKey;

typedef MessageListener = void Function(Map<String, dynamic> msg);
typedef TypingListener  = void Function(String fromId, bool typing);

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? user;
  List<String> onlineUsers = [];
  bool loading = true;
  int unreadMessageCount = 0;
  IO.Socket? _socket;

  final List<MessageListener> _messageListeners = [];
  final List<TypingListener>  _typingListeners  = [];
  final List<Function(String)> _readListeners   = [];

  AuthProvider() { _init(); }

  Future<void> _init() async {
    await NotificationService.init(tapCallback: _onNotificationTap);
    try {
      final prefs = await SharedPreferences.getInstance();
      final u = prefs.getString('user');
      if (u != null) {
        user = jsonDecode(u);
        _connectSocket();
        fetchUnreadCount();
      }
    } catch (_) {}
    loading = false;
    notifyListeners();
  }

  Future<void> fetchUnreadCount() async {
    try {
      final res = await Api.get('/messages/unread-count');
      unreadMessageCount = res['count'] ?? 0;
      notifyListeners();
    } catch (_) {}
  }

  void _onNotificationTap(String? payload) {
    if (payload == null) return;
    final nav = appNavigatorKey?.currentState;
    if (nav == null) return;

    final parts = payload.split(':');
    final type  = parts[0];

    if (type == 'chat' && parts.length >= 3) {
      final userId   = parts[1];
      final username = parts[2];
      nav.pushNamed('/chatroom', arguments: {
        'userId': userId,
        'username': username,
        'profilePicture': null,
      });
    } else if (type == 'profile' && parts.length >= 2) {
      nav.pushNamed('/profile', arguments: parts[1]);
    }
    // post deep link can be added later
  }

  void _connectSocket() {
    _socket?.disconnect();
    _socket = IO.io(baseUrl, IO.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .disableAutoConnect()
        .setReconnectionAttempts(10)
        .setReconnectionDelay(2000)
        .build());

    _socket!.onConnect((_) {
      debugPrint('Socket connected');
      _socket!.emit('user_connected', user?['_id']);
    });

    _socket!.onDisconnect((_) => debugPrint('Socket disconnected'));
    _socket!.onConnectError((e) => debugPrint('Socket connect error: $e'));
    _socket!.onError((e) => debugPrint('Socket error: $e'));

    // Online users list
    _socket!.on('online_users', (data) {
      onlineUsers = List<String>.from(data ?? []);
      notifyListeners();
    });

    // Incoming message
    _socket!.on('receive_message', (data) {
      final msg = Map<String, dynamic>.from(data as Map);
      for (final l in _messageListeners) { l(msg); }

      final sender = msg['senderId'];
      final senderName = sender is Map ? (sender['username'] ?? 'Someone') : 'Someone';
      final senderId   = sender is Map ? sender['_id'] : sender?.toString();
      
      // Increment unread count if not from self
      if (senderId != user?['_id']) {
        unreadMessageCount++;
        notifyListeners();
      }

      NotificationService.showMessage(
        senderName: senderName,
        message: msg['message'] ?? '',
        senderId: senderId,
        senderUsername: sender is Map ? (sender['username'] ?? '') : '',
      );
    });

    _socket!.on('typing_start', (data) {
      final fromId = data is Map ? data['senderId']?.toString() : data?.toString();
      if (fromId != null) for (final l in _typingListeners) { l(fromId, true); }
    });

    _socket!.on('typing_stop', (data) {
      final fromId = data is Map ? data['senderId']?.toString() : data?.toString();
      if (fromId != null) for (final l in _typingListeners) { l(fromId, false); }
    });

    // Activity notifications (likes, comments, follows)
    _socket!.on('receive_notification', (data) {
      final notif = data is Map ? Map<String, dynamic>.from(data['notification'] ?? data) : <String, dynamic>{};
      final type     = notif['type'] as String? ?? 'activity';
      final fromUser = notif['fromUser'];
      final username = fromUser is Map ? (fromUser['username'] ?? 'Someone') : 'Someone';
      final fromId   = fromUser is Map ? fromUser['_id']?.toString() : null;
      final postId   = notif['postId'] is Map ? notif['postId']['_id']?.toString() : notif['postId']?.toString();

      String title, body;
      switch (type) {
        case 'like':
          title = 'New like';
          body  = '$username liked your post';
          break;
        case 'comment':
          title = 'New reply';
          body  = '$username replied to your post';
          break;
        case 'follow':
          title = 'New follower';
          body  = '$username started following you';
          break;
        default:
          title = 'New activity';
          body  = '$username interacted with you';
      }

      NotificationService.showActivity(
        title: title,
        body: body,
        type: type,
        postId: postId,
        fromUserId: fromId,
      );

      notifyListeners(); // refresh notification badge
    });

    _socket!.on('messages_read', (data) {
      final by = data['by']?.toString();
      if (by != null) for (final l in _readListeners) { l(by); }
    });

    _socket!.connect();
  }

  void addMessageListener(MessageListener listener) => _messageListeners.add(listener);
  void removeMessageListener(MessageListener listener) => _messageListeners.remove(listener);
  void addTypingListener(TypingListener listener) => _typingListeners.add(listener);
  void removeTypingListener(TypingListener listener) => _typingListeners.remove(listener);

  void emitTyping(String receiverId, bool typing) {
    _socket?.emit(typing ? 'typing_start' : 'typing_stop', {'senderId': user?['_id'], 'receiverId': receiverId});
  }

  void emitMarkAsRead(String senderId) {
    _socket?.emit('mark_as_read', {'senderId': senderId, 'receiverId': user?['_id']});
  }

  void addReadListener(Function(String) l) => _readListeners.add(l);
  void removeReadListener(Function(String) l) => _readListeners.remove(l);

  Future<void> login(String token, Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('user', jsonEncode(userData));
    user = userData;
    _connectSocket();
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    _socket?.disconnect();
    _socket = null;
    user = null;
    onlineUsers = [];
    await NotificationService.cancelAll();
    notifyListeners();
  }

  Future<void> updateUser(Map<String, dynamic> updated) async {
    final prefs = await SharedPreferences.getInstance();
    user = {...?user, ...updated};
    await prefs.setString('user', jsonEncode(user));
    notifyListeners();
  }

  bool isOnline(String id) => onlineUsers.contains(id);
}
