import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import '../context/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  String error = '';
  bool loading = false;

  Future<void> _submit() async {
    setState(() { error = ''; loading = true; });
    try {
      final res = await Api.post('/auth/login', {
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
      });
      if (!mounted) return;
      await context.read<AuthProvider>().login(res['token'], Map<String, dynamic>.from(res['user']));
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const SizedBox(height: 40),
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(color: surface2, borderRadius: BorderRadius.circular(18), border: Border.all(color: borderColor)),
              child: const Center(child: Text('V', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: orange))),
            ),
            const SizedBox(height: 20),
            const Text('Sign in to Vamppe', style: TextStyle(color: white, fontWeight: FontWeight.w800, fontSize: 24)),
            const SizedBox(height: 6),
            const Text('Good to have you back', style: TextStyle(color: gray3, fontSize: 14)),
            const SizedBox(height: 28),
            if (error.isNotEmpty)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0x1Aef4444),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0x33ef4444)),
                ),
                child: Text(error, style: const TextStyle(color: redColor, fontSize: 13)),
              ),
            TextField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              style: const TextStyle(color: white),
              decoration: const InputDecoration(hintText: 'Email address'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passCtrl,
              obscureText: true,
              style: const TextStyle(color: white),
              decoration: const InputDecoration(hintText: 'Password'),
              onSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: orange,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: loading ? null : _submit,
                child: loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: white, strokeWidth: 2))
                    : const Text('Sign in', style: TextStyle(color: white, fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: () => Navigator.pushReplacementNamed(context, '/register'),
              child: RichText(text: const TextSpan(
                style: TextStyle(color: gray3, fontSize: 14),
                children: [
                  TextSpan(text: 'New to Vamppe? '),
                  TextSpan(text: 'Create an account', style: TextStyle(color: orange)),
                ],
              )),
            ),
          ]),
        ),
      ),
    );
  }
}
