import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/api.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? user;
  List<String> onlineUsers = [];
  bool loading = true;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final u = prefs.getString('user');
      if (u != null) user = jsonDecode(u);
    } catch (_) {}
    loading = false;
    notifyListeners();
  }

  Future<void> login(String token, Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('user', jsonEncode(userData));
    user = userData;
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    user = null;
    notifyListeners();
  }

  Future<void> updateUser(Map<String, dynamic> updated) async {
    final prefs = await SharedPreferences.getInstance();
    user = {...?user, ...updated};
    await prefs.setString('user', jsonEncode(user));
    notifyListeners();
  }

  void setOnlineUsers(List<String> ids) {
    onlineUsers = ids;
    notifyListeners();
  }

  bool isOnline(String id) => onlineUsers.contains(id);
}
