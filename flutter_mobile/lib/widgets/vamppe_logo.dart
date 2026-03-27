import 'package:flutter/material.dart';

/// VamppeLogo — Flutter port of the web brand mark.
/// A stylised "V" with fang details on an orange→violet gradient rounded square.
///
/// [size]     — pixel size of the square (default 40)
/// [showText] — show "vamppe" wordmark next to the mark
class VamppeLogo extends StatelessWidget {
  final double size;
  final bool showText;

  const VamppeLogo({super.key, this.size = 40, this.showText = false});

  @override
  Widget build(BuildContext context) {
    final mark = CustomPaint(
      size: Size(size, size),
      painter: _LogoPainter(),
    );

    if (!showText) return mark;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        SizedBox(width: size * 0.18),
        Text(
          'vamppe',
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.42,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
            height: 1,
          ),
        ),
      ],
    );
  }
}

class _LogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final r = w * 0.26;

    // ── Background gradient ──────────────────────────────────────────────────
    final bgPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: const [
          Color(0xFFf97316),
          Color(0xFFc026d3),
          Color(0xFF7c3aed),
        ],
        stops: const [0.0, 0.55, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, w, h));

    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, w, h),
      Radius.circular(r),
    );
    canvas.drawRRect(rrect, bgPaint);

    // ── Inner glow ───────────────────────────────────────────────────────────
    final glowPaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0, -0.4),
        radius: 0.6,
        colors: [
          const Color(0xFFf97316).withOpacity(0.25),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawRRect(rrect, glowPaint);

    // ── V mark ───────────────────────────────────────────────────────────────
    // Scale points from 48×48 viewBox
    Offset p(double x, double y) => Offset(x / 48 * w, y / 48 * h);

    final strokeW = w * (4.2 / 48);
    final vPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    // Main V
    final vPath = Path()
      ..moveTo(p(10, 11).dx, p(10, 11).dy)
      ..lineTo(p(24, 37).dx, p(24, 37).dy)
      ..lineTo(p(38, 11).dx, p(38, 11).dy);
    canvas.drawPath(vPath, vPaint);

    // Left fang serif
    canvas.drawLine(p(10, 11), p(10, 18), vPaint);
    // Right fang serif
    canvas.drawLine(p(38, 11), p(38, 18), vPaint);

    // Center tip dot
    final dotPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(p(24, 37), w * (1.6 / 48), dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
