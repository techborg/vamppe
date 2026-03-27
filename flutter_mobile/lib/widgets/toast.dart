import 'package:flutter/material.dart';
import '../utils/theme.dart';

class Toast {
  static void show(BuildContext context, String message, {bool error = false, bool success = false}) {
    final color = error ? redColor : success ? greenColor : orange;
    final icon  = error ? Icons.error_outline : success ? Icons.check_circle_outline : Icons.info_outline;

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        backgroundColor: surface2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: color.withOpacity(0.3)),
        ),
        duration: const Duration(seconds: 3),
        content: Row(children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600))),
        ]),
      ),
    );
  }
}
