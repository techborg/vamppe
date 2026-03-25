import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'context/auth_provider.dart';
import 'utils/theme.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/explore_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/chatroom_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';

void main() {
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
      title: 'Vamppe',
      debugShowCheckedModeBanner: false,
      theme: appTheme,
      initialRoute: '/',
      routes: {
        '/':         (_) => const _Root(),
        '/login':    (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/profile':  (_) => const ProfileScreen(),
        '/chatroom': (_) => const ChatRoomScreen(),
        '/settings': (_) => const SettingsScreen(),
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
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: orange)));
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

  final _screens = const [
    HomeScreen(),
    ExploreScreen(),
    NotificationsScreen(),
    ChatScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _idx,
        onTap: (i) => setState(() => _idx = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined),         activeIcon: Icon(Icons.home),          label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.explore_outlined),      activeIcon: Icon(Icons.explore),       label: 'Discover'),
          BottomNavigationBarItem(icon: Icon(Icons.notifications_outlined), activeIcon: Icon(Icons.notifications), label: 'Activity'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline),   activeIcon: Icon(Icons.chat_bubble),   label: 'Messages'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline),        activeIcon: Icon(Icons.person),        label: 'Profile'),
        ],
      ),
    );
  }
}
