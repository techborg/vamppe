import 'package:flutter/material.dart';

const Color bgColor      = Color(0xFF0a0a0f);
const Color surface1     = Color(0xFF12121a);
const Color surface2     = Color(0xFF1a1a24);
const Color surface3     = Color(0xFF22222e);
const Color borderColor  = Color(0x12FFFFFF);
const Color orange       = Color(0xFFf97316);
const Color orangeLight  = Color(0xFFfb923c);
const Color violet       = Color(0xFF8b5cf6);
const Color violetLight  = Color(0xFFa78bfa);
const Color white        = Color(0xFFFFFFFF);
const Color gray1        = Color(0xFFe5e7eb);
const Color gray2        = Color(0xFF9ca3af);
const Color gray3        = Color(0xFF6b7280);
const Color gray4        = Color(0xFF374151);
const Color redColor     = Color(0xFFf87171);
const Color greenColor   = Color(0xFF34d399);

ThemeData appTheme = ThemeData(
  scaffoldBackgroundColor: bgColor,
  colorScheme: const ColorScheme.dark(
    primary: orange,
    secondary: violet,
    surface: surface1,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: bgColor,
    foregroundColor: white,
    elevation: 0,
    titleTextStyle: TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 17),
    iconTheme: IconThemeData(color: white),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: surface1,
    selectedItemColor: orange,
    unselectedItemColor: gray3,
    type: BottomNavigationBarType.fixed,
    elevation: 0,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: surface2,
    hintStyle: const TextStyle(color: gray4),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: borderColor),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: borderColor),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: orange, width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  ),
  textTheme: const TextTheme(
    bodyMedium: TextStyle(color: gray1, fontSize: 15),
    bodySmall: TextStyle(color: gray3, fontSize: 13),
  ),
);
