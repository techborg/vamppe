import 'package:flutter/material.dart';

class VerifiedBadge extends StatelessWidget {
  final String type;
  final double size;
  const VerifiedBadge({super.key, this.type = 'blue', this.size = 16});

  @override
  Widget build(BuildContext context) {
    final color = switch (type) {
      'gold'   => const Color(0xFFf59e0b),
      'purple' => const Color(0xFF8b5cf6),
      'red'    => const Color(0xFFef4444),
      _        => const Color(0xFF3b82f6),
    };
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: Center(
        child: Text('✓',
            style: TextStyle(
                color: Colors.white,
                fontSize: size * 0.55,
                fontWeight: FontWeight.w900,
                height: 1)),
      ),
    );
  }
}
