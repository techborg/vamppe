import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../utils/constants.dart';
import '../utils/theme.dart';

class Avatar extends StatelessWidget {
  final String? src;
  final double size;
  final VoidCallback? onTap;

  const Avatar({super.key, this.src, this.size = 40, this.onTap});

  @override
  Widget build(BuildContext context) {
    final uri = src == null
        ? null
        : src!.startsWith('http')
            ? () {
                // Re-map stored full URLs to current baseUrl (handles IP changes)
                final parsed = Uri.tryParse(src!);
                return '$baseUrl${parsed?.path ?? src}';
              }()
            : '$baseUrl$src';

    final radius = size * 0.4;

    Widget img = uri != null
        ? CachedNetworkImage(
            imageUrl: uri,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => _placeholder(radius),
          )
        : _placeholder(radius);

    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: SizedBox(width: size, height: size, child: img),
      ),
    );
  }

  Widget _placeholder(double radius) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: surface3,
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(color: borderColor),
        ),
        child: Center(
          child: Text('?',
              style: TextStyle(
                  color: Colors.white54,
                  fontSize: size * 0.38,
                  fontWeight: FontWeight.w700)),
        ),
      );
}
