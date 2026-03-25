import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class Api {
  static Future<String?> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, String>> _headers({bool multipart = false}) async {
    final token = await _token();
    return {
      if (!multipart) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> get(String path) async {
    final res = await http.get(
      Uri.parse('$apiUrl$path'),
      headers: await _headers(),
    ).timeout(const Duration(seconds: 10));
    return _handle(res);
  }

  static Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    final res = await http.post(
      Uri.parse('$apiUrl$path'),
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    ).timeout(const Duration(seconds: 10));
    return _handle(res);
  }

  static Future<dynamic> put(String path, [Map<String, dynamic>? body]) async {
    final res = await http.put(
      Uri.parse('$apiUrl$path'),
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    ).timeout(const Duration(seconds: 10));
    return _handle(res);
  }

  static Future<dynamic> delete(String path) async {
    final res = await http.delete(
      Uri.parse('$apiUrl$path'),
      headers: await _headers(),
    ).timeout(const Duration(seconds: 10));
    return _handle(res);
  }

  static Future<dynamic> postMultipart(String path, Map<String, String> fields,
      {Map<String, String>? files}) async {
    final token = await _token();
    final req = http.MultipartRequest('POST', Uri.parse('$apiUrl$path'));
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
    req.fields.addAll(fields);
    if (files != null) {
      for (final e in files.entries) {
        req.files.add(await http.MultipartFile.fromPath(e.key, e.value));
      }
    }
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return _handle(res);
  }

  static Future<dynamic> putMultipart(String path, Map<String, String> fields,
      {Map<String, String>? files}) async {
    final token = await _token();
    final req = http.MultipartRequest('PUT', Uri.parse('$apiUrl$path'));
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
    req.fields.addAll(fields);
    if (files != null) {
      for (final e in files.entries) {
        req.files.add(await http.MultipartFile.fromPath(e.key, e.value));
      }
    }
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return _handle(res);
  }

  static dynamic _handle(http.Response res) {
    final body = jsonDecode(utf8.decode(res.bodyBytes));
    if (res.statusCode >= 400) {
      throw body['message'] ?? 'Request failed';
    }
    return body;
  }
}
