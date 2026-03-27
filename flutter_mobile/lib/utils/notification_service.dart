import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Notification tap payload routing
typedef NotificationTapCallback = void Function(String? payload);

class NotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;
  static int _notifId = 0;
  static NotificationTapCallback? onTap;

  // ── Channels ────────────────────────────────────────────────────────────────
  static const _chMessages = AndroidNotificationChannel(
    'vamppe_messages', 'Messages',
    description: 'Direct message notifications',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    enableLights: true,
    ledColor: Color(0xFFf97316),
  );

  static const _chActivity = AndroidNotificationChannel(
    'vamppe_activity', 'Activity',
    description: 'Likes, comments and follows',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  static const _chSystem = AndroidNotificationChannel(
    'vamppe_system', 'System',
    description: 'App updates and alerts',
    importance: Importance.defaultImportance,
  );

  // ── Init ────────────────────────────────────────────────────────────────────
  static Future<void> init({NotificationTapCallback? tapCallback}) async {
    if (_initialized) return;
    _initialized = true;
    onTap = tapCallback;

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: (details) {
        onTap?.call(details.payload);
      },
    );

    final androidImpl = _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

    // Create all channels
    await androidImpl?.createNotificationChannel(_chMessages);
    await androidImpl?.createNotificationChannel(_chActivity);
    await androidImpl?.createNotificationChannel(_chSystem);

    // Request permission (Android 13+)
    await androidImpl?.requestNotificationsPermission();
  }

  // ── Message notification ─────────────────────────────────────────────────────
  static Future<void> showMessage({
    required String senderName,
    required String message,
    String? senderId,
    String? senderUsername,
  }) async {
    _notifId = (_notifId + 1) % 10000;

    final androidDetails = AndroidNotificationDetails(
      _chMessages.id,
      _chMessages.name,
      channelDescription: _chMessages.description,
      importance: Importance.max,
      priority: Priority.high,
      category: AndroidNotificationCategory.message,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      ledColor: const Color(0xFFf97316),
      color: const Color(0xFFf97316),
      ticker: message,
      styleInformation: MessagingStyleInformation(
        Person(name: senderName, important: true),
        messages: [Message(message, DateTime.now(), Person(name: senderName))],
        conversationTitle: senderName,
      ),
      actions: [
        const AndroidNotificationAction('reply', 'Reply', showsUserInterface: true),
      ],
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      interruptionLevel: InterruptionLevel.active,
    );

    await _plugin.show(
      _notifId,
      senderName,
      message,
      NotificationDetails(android: androidDetails, iOS: iosDetails),
      payload: 'chat:$senderId:${senderUsername ?? senderName}',
    );
  }

  // ── Activity notification (likes, comments, follows) ─────────────────────────
  static Future<void> showActivity({
    required String title,
    required String body,
    String type = 'activity', // like | comment | follow
    String? postId,
    String? fromUserId,
  }) async {
    _notifId = (_notifId + 1) % 10000;

    final icon = type == 'like' ? '❤️' : type == 'comment' ? '💬' : '✦';

    final androidDetails = AndroidNotificationDetails(
      _chActivity.id,
      _chActivity.name,
      channelDescription: _chActivity.description,
      importance: Importance.high,
      priority: Priority.high,
      color: const Color(0xFFf97316),
      playSound: true,
      enableVibration: true,
      styleInformation: BigTextStyleInformation(
        body,
        contentTitle: '$icon $title',
        summaryText: 'Vamppe',
      ),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final payload = postId != null ? 'post:$postId' : 'profile:$fromUserId';

    await _plugin.show(
      _notifId,
      '$icon $title',
      body,
      NotificationDetails(android: androidDetails, iOS: iosDetails),
      payload: payload,
    );
  }

  // ── System / generic notification ────────────────────────────────────────────
  static Future<void> showSystem({
    required String title,
    required String body,
    String? payload,
  }) async {
    _notifId = (_notifId + 1) % 10000;

    final androidDetails = AndroidNotificationDetails(
      _chSystem.id,
      _chSystem.name,
      channelDescription: _chSystem.description,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      color: const Color(0xFFf97316),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: false,
      presentSound: false,
    );

    await _plugin.show(
      _notifId,
      title,
      body,
      NotificationDetails(android: androidDetails, iOS: iosDetails),
      payload: payload,
    );
  }

  // ── Cancel ───────────────────────────────────────────────────────────────────
  static Future<void> cancelAll() => _plugin.cancelAll();
  static Future<void> cancel(int id) => _plugin.cancel(id);
}
