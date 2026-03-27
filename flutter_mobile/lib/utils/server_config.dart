import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class ServerConfig {
  static const _key = 'server_url';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_key);
    if (saved != null && saved.isNotEmpty) {
      baseUrl = saved.trimRight().replaceAll(RegExp(r'/$'), '');
      apiUrl  = '$baseUrl/api';
    }
  }

  static Future<void> save(String url) async {
    final clean = url.trim().replaceAll(RegExp(r'/$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, clean);
    baseUrl = clean;
    apiUrl  = '$clean/api';
  }

  static Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
    baseUrl = defaultBaseUrl;
    apiUrl  = '$defaultBaseUrl/api';
  }
}
