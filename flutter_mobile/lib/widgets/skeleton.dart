import 'package:flutter/material.dart';
import '../utils/theme.dart';

class Skeleton extends StatefulWidget {
  final double width, height;
  final double radius;
  const Skeleton({super.key, required this.width, required this.height, this.radius = 8});

  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 0.7).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _anim,
    builder: (_, __) => Container(
      width: widget.width,
      height: widget.height,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(_anim.value * 0.12),
        borderRadius: BorderRadius.circular(widget.radius),
      ),
    ),
  );
}

class PostSkeleton extends StatelessWidget {
  const PostSkeleton({super.key});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Skeleton(width: 40, height: 40, radius: 20),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Skeleton(width: 120, height: 12),
          const SizedBox(height: 6),
          Skeleton(width: 80, height: 10),
        ]),
      ]),
      const SizedBox(height: 12),
      Skeleton(width: double.infinity, height: 14),
      const SizedBox(height: 6),
      Skeleton(width: 200, height: 14),
      const SizedBox(height: 12),
      Skeleton(width: double.infinity, height: 180, radius: 16),
    ]),
  );
}
