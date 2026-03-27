import 'package:flutter/material.dart';
import '../utils/theme.dart';

import '../widgets/vamppe_logo.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const VamppeLogo(size: 72),
            const SizedBox(height: 24),
            RichText(text: const TextSpan(
              style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: white),
              children: [
                TextSpan(text: 'Welcome to '),
                TextSpan(text: 'Vamppe', style: TextStyle(color: orange)),
              ],
            )),
            const SizedBox(height: 10),
            const Text(
              'Share ideas, connect with people, and feel the rhythm of real conversations.',
              textAlign: TextAlign.center,
              style: TextStyle(color: gray3, fontSize: 15, height: 1.5),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: orange,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () => Navigator.pushNamed(context, '/register'),
                child: const Text('Create your account', style: TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: borderColor),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () => Navigator.pushNamed(context, '/login'),
                child: const Text('Sign in', style: TextStyle(color: gray2, fontWeight: FontWeight.w600, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 36),
            ...[
              ('✦', 'Real-time feed', 'See posts from people you follow instantly.'),
              ('⚡', 'Instant messaging', 'Chat with anyone, see who\'s online.'),
              ('🔔', 'Smart activity', 'Likes, replies, and follows — all in one place.'),
            ].map((f) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: surface1,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: borderColor),
                ),
                child: Row(children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0x1Ff97316),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(child: Text(f.$1, style: const TextStyle(fontSize: 18))),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(f.$2, style: const TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(f.$3, style: const TextStyle(color: gray3, fontSize: 12, height: 1.4)),
                  ])),
                ]),
              ),
            )),
          ]),
        ),
      ),
    );
  }
}
