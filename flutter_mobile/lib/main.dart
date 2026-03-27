import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'context/auth_provider.dart' show AuthProvider, appNavigatorKey;
import 'utils/theme.dart';
import 'utils/notification_service.dart';
import 'utils/api.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/explore_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/chatroom_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/bookmarks_screen.dart';
import 'screens/settings_screen.dart';
import 'widgets/app_drawer.dart';

import 'utils/server_config.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ServerConfig.init();
  await NotificationService.init();
  appNavigatorKey = navigatorKey;
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const VamppApp(),
    ),
  );
}

class VamppApp extends StatelessWidget {
  const VamppApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Vamppe',
      debugShowCheckedModeBanner: false,
      theme: appTheme,
      initialRoute: '/',
      onGenerateRoute: (settings) {
        final routes = <String, WidgetBuilder>{
          '/':          (_) => const _Root(),
          '/login':     (_) => const LoginScreen(),
          '/register':  (_) => const RegisterScreen(),
          '/profile':   (_) => const ProfileScreen(),
          '/chatroom':  (_) => const ChatRoomScreen(),
          '/settings':  (_) => const SettingsScreen(),
          '/bookmarks': (_) => const BookmarksScreen(),
        };
        final builder = routes[settings.name];
        if (builder == null) return null;
        return PageRouteBuilder(
          settings: settings,
          pageBuilder: (c, _, __) => builder(c),
          transitionsBuilder: (_, anim, __, child) {
            final fade = CurvedAnimation(parent: anim, curve: Curves.easeOut);
            final scale = Tween<double>(begin: 0.98, end: 1.0).animate(fade);
            return FadeTransition(
              opacity: fade,
              child: ScaleTransition(scale: scale, child: child),
            );
          },
          transitionDuration: const Duration(milliseconds: 250),
        );
      },
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.loading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72, height: 72,
                decoration: BoxDecoration(
                  color: surface2,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: borderColor),
                ),
                child: const Center(
                  child: Text('V', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: orange)),
                ),
              ),
              const SizedBox(height: 32),
              const SizedBox(
                width: 24, height: 24,
                child: CircularProgressIndicator(color: orange, strokeWidth: 2.5),
              ),
            ],
          ),
        ),
      );
    }
    if (auth.user == null) return const LandingScreen();
    return const _MainShell();
  }
}

class _MainShell extends StatefulWidget {
  const _MainShell();
  @override
  State<_MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<_MainShell> {
  int _idx = 0;
  int _unreadMessages = 0;
  int _unreadNotifs = 0;

  final _screens = const [
    HomeScreen(),
    ExploreScreen(),
    NotificationsScreen(),
    ChatScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _loadUnread();
  }

  Future<void> _loadUnread() async {
    context.read<AuthProvider>().fetchUnreadCount();
    try {
      final notifs = await Api.get('/notifications/unread-count');
      if (mounted) setState(() {
        _unreadNotifs = notifs['count'] ?? 0;
      });
    } catch (_) {}
  }

  Widget _badge(Widget icon, int count) {
    if (count == 0) return icon;
    return Stack(clipBehavior: Clip.none, children: [
      icon,
      Positioned(
        top: -4, right: -6,
        child: Container(
          padding: const EdgeInsets.all(3),
          decoration: const BoxDecoration(color: orange, shape: BoxShape.circle),
          child: Text(
            count > 9 ? '9+' : '$count',
            style: const TextStyle(color: white, fontSize: 9, fontWeight: FontWeight.w800),
          ),
        ),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      drawer: const AppDrawer(),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: _screens[_idx],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _idx,
        onTap: (i) {
          if (i == 4) {
            Navigator.pushNamed(context, '/profile', arguments: auth.user?['_id']);
          } else {
            setState(() {
              _idx = i;
              if (i == 2) _unreadNotifs = 0;
              if (i == 3) context.read<AuthProvider>().unreadMessageCount = 0;
            });
          }
        },
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          const BottomNavigationBarItem(icon: Icon(Icons.explore_outlined), activeIcon: Icon(Icons.explore), label: 'Discover'),
          BottomNavigationBarItem(
            icon: _badge(const Icon(Icons.notifications_outlined), _unreadNotifs),
            activeIcon: _badge(const Icon(Icons.notifications), _unreadNotifs),
            label: 'Activity',
          ),
          BottomNavigationBarItem(
            icon: _badge(const Icon(Icons.chat_bubble_outline), auth.unreadMessageCount),
            activeIcon: _badge(const Icon(Icons.chat_bubble), auth.unreadMessageCount),
            label: 'Messages',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
