import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../context/auth_provider.dart';
import '../utils/theme.dart';
import '../utils/constants.dart';
import 'avatar.dart';
import 'verified_badge.dart';
import 'vamppe_logo.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final avatarSrc = user?['profilePicture'] as String?;
    final avatarUrl = avatarSrc == null
        ? null
        : avatarSrc.startsWith('http')
            ? () {
                final parsed = Uri.tryParse(avatarSrc);
                return '$baseUrl${parsed?.path ?? avatarSrc}';
              }()
            : '$baseUrl$avatarSrc';

    return Drawer(
      backgroundColor: surface1,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const VamppeLogo(size: 36, showText: true),
                  IconButton(
                    icon: const Icon(Icons.close, color: gray3, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            const Divider(color: borderColor, height: 1),

            // ── Profile card ─────────────────────────────────────────────────
            GestureDetector(
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/profile',
                    arguments: user?['_id']);
              },
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: surface2,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: borderColor),
                ),
                child: Row(children: [
                  Avatar(src: avatarUrl, size: 52),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Flexible(
                              child: Text(
                                user?['displayName'] ??
                                    user?['username'] ??
                                    '',
                                style: const TextStyle(
                                    color: white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (user?['verified'] == true) ...[
                              const SizedBox(width: 5),
                              VerifiedBadge(
                                  type: user?['verifiedType'] ?? 'blue',
                                  size: 14),
                            ],
                          ]),
                          const SizedBox(height: 2),
                          Text(
                            '@${user?['username'] ?? ''}',
                            style: const TextStyle(
                                color: gray3, fontSize: 13),
                          ),
                          const SizedBox(height: 8),
                          Row(children: [
                            _StatChip(
                                label: 'Following',
                                value: (user?['following'] as List?)
                                        ?.length ??
                                    0),
                            const SizedBox(width: 16),
                            _StatChip(
                                label: 'Followers',
                                value: (user?['followers'] as List?)
                                        ?.length ??
                                    0),
                          ]),
                        ]),
                  ),
                  const Icon(Icons.chevron_right, color: gray4, size: 20),
                ]),
              ),
            ),

            // ── Nav items ────────────────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _NavItem(
                    icon: Icons.person_outline,
                    label: 'Profile',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/profile', arguments: user?['_id']);
                    },
                  ),
                  _NavItem(
                    icon: Icons.bookmark_outline,
                    label: 'Saved',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/bookmarks');
                    },
                  ),
                  _NavItem(
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/settings');
                    },
                  ),
                  if (user?['isAdmin'] == true)
                    _NavItem(
                      icon: Icons.admin_panel_settings_outlined,
                      label: 'Admin Panel',
                      color: violet,
                      onTap: () => Navigator.pop(context),
                    ),
                  const SizedBox(height: 8),
                  const Divider(color: borderColor),
                  const SizedBox(height: 8),
                  _NavItem(
                    icon: Icons.logout,
                    label: 'Sign out',
                    color: redColor,
                    onTap: () async {
                      Navigator.pop(context);
                      await context.read<AuthProvider>().logout();
                      if (context.mounted) {
                        Navigator.of(context)
                            .pushNamedAndRemoveUntil('/', (_) => false);
                      }
                    },
                  ),
                ],
              ),
            ),

            // ── Footer ───────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text(
                'Vamppe v3.0.0',
                style: const TextStyle(color: gray4, fontSize: 11),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final int value;
  const _StatChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Row(children: [
        Text('$value',
            style: const TextStyle(
                color: white, fontWeight: FontWeight.w800, fontSize: 13)),
        const SizedBox(width: 3),
        Text(label,
            style: const TextStyle(color: gray3, fontSize: 12)),
      ]);
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = gray2,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Icon(icon, color: color, size: 22),
        title: Text(label,
            style: TextStyle(
                color: color,
                fontSize: 15,
                fontWeight: FontWeight.w600)),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        onTap: onTap,
        horizontalTitleGap: 8,
        minLeadingWidth: 24,
      );
}
