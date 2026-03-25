import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../utils/api.dart';
import '../utils/theme.dart';
import '../context/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _section = 'account';

  // Account fields
  final _usernameCtrl = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _oldPassCtrl  = TextEditingController();
  final _newPassCtrl  = TextEditingController();

  // Privacy
  bool _privateAccount = false;
  bool _showOnlineStatus = true;

  // Notifications
  bool _notifLikes     = true;
  bool _notifComments  = true;
  bool _notifFollows   = true;
  bool _notifMessages  = true;

  bool _saving = false;
  String _msg  = '';
  bool _isErr  = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final res = await Api.get('/users/settings');
      setState(() {
        _usernameCtrl.text   = res['username'] ?? '';
        _emailCtrl.text      = res['email'] ?? '';
        _privateAccount      = res['isPrivate'] ?? false;
        _showOnlineStatus    = res['showOnlineStatus'] ?? true;
        _notifLikes          = res['notifLikes'] ?? true;
        _notifComments       = res['notifComments'] ?? true;
        _notifFollows        = res['notifFollows'] ?? true;
        _notifMessages       = res['notifMessages'] ?? true;
      });
    } catch (_) {
      final auth = context.read<AuthProvider>();
      _usernameCtrl.text = auth.user?['username'] ?? '';
      _emailCtrl.text    = auth.user?['email'] ?? '';
    }
  }

  void _showMsg(String msg, {bool err = false}) {
    setState(() { _msg = msg; _isErr = err; });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _msg = '');
    });
  }

  Future<void> _saveAccount() async {
    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'username': _usernameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
      };
      if (_oldPassCtrl.text.isNotEmpty && _newPassCtrl.text.isNotEmpty) {
        body['oldPassword'] = _oldPassCtrl.text;
        body['newPassword'] = _newPassCtrl.text;
      }
      final res = await Api.put('/users/settings', body);
      if (!mounted) return;
      context.read<AuthProvider>().updateUser(Map<String, dynamic>.from(res));
      _oldPassCtrl.clear();
      _newPassCtrl.clear();
      _showMsg('Account updated');
    } catch (e) {
      _showMsg(e.toString(), err: true);
    }
    setState(() => _saving = false);
  }

  Future<void> _savePrivacy() async {
    setState(() => _saving = true);
    try {
      await Api.put('/users/settings', {
        'isPrivate': _privateAccount,
        'showOnlineStatus': _showOnlineStatus,
      });
      _showMsg('Privacy settings saved');
    } catch (e) {
      _showMsg(e.toString(), err: true);
    }
    setState(() => _saving = false);
  }

  Future<void> _saveNotifications() async {
    setState(() => _saving = true);
    try {
      await Api.put('/users/settings', {
        'notifLikes': _notifLikes,
        'notifComments': _notifComments,
        'notifFollows': _notifFollows,
        'notifMessages': _notifMessages,
      });
      _showMsg('Notification preferences saved');
    } catch (e) {
      _showMsg(e.toString(), err: true);
    }
    setState(() => _saving = false);
  }

  Future<void> _deleteAccount() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: surface2,
        title: const Text('Delete account?', style: TextStyle(color: white)),
        content: const Text(
          'This is permanent. All your posts, messages and data will be deleted.',
          style: TextStyle(color: gray2),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: gray3))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: redColor))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await Api.delete('/users/me');
      if (!mounted) return;
      context.read<AuthProvider>().logout();
    } catch (e) {
      _showMsg(e.toString(), err: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Section list
        Container(
          width: 130,
          decoration: const BoxDecoration(border: Border(right: BorderSide(color: borderColor))),
          child: ListView(
            children: [
              _SectionTile(label: 'Account',       icon: Icons.manage_accounts_outlined, id: 'account',       current: _section, onTap: (s) => setState(() => _section = s)),
              _SectionTile(label: 'Privacy',        icon: Icons.lock_outline,             id: 'privacy',        current: _section, onTap: (s) => setState(() => _section = s)),
              _SectionTile(label: 'Notifications',  icon: Icons.notifications_outlined,   id: 'notifications',  current: _section, onTap: (s) => setState(() => _section = s)),
              _SectionTile(label: 'Danger Zone',    icon: Icons.warning_amber_outlined,   id: 'danger',         current: _section, onTap: (s) => setState(() => _section = s)),
            ],
          ),
        ),
        // Content
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (_msg.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _isErr ? const Color(0x1Aef4444) : const Color(0x1A34d399),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _isErr ? const Color(0x33ef4444) : const Color(0x3334d399)),
                  ),
                  child: Text(_msg, style: TextStyle(color: _isErr ? redColor : greenColor, fontSize: 13)),
                ),
              if (_section == 'account')   _buildAccount(),
              if (_section == 'privacy')   _buildPrivacy(),
              if (_section == 'notifications') _buildNotifications(),
              if (_section == 'danger')    _buildDanger(),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildAccount() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const _SectionHeader('Account'),
    _Field(label: 'Username', ctrl: _usernameCtrl),
    const SizedBox(height: 12),
    _Field(label: 'Email', ctrl: _emailCtrl, keyboard: TextInputType.emailAddress),
    const SizedBox(height: 20),
    const _SectionHeader('Change Password'),
    _Field(label: 'Current password', ctrl: _oldPassCtrl, obscure: true),
    const SizedBox(height: 12),
    _Field(label: 'New password', ctrl: _newPassCtrl, obscure: true),
    const SizedBox(height: 20),
    _SaveBtn(label: 'Save changes', loading: _saving, onTap: _saveAccount),
  ]);

  Widget _buildPrivacy() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const _SectionHeader('Privacy'),
    _Toggle(
      label: 'Private account',
      desc: 'Only approved followers can see your posts',
      value: _privateAccount,
      onChange: (v) => setState(() => _privateAccount = v),
    ),
    _Toggle(
      label: 'Show online status',
      desc: 'Let others see when you\'re active',
      value: _showOnlineStatus,
      onChange: (v) => setState(() => _showOnlineStatus = v),
    ),
    const SizedBox(height: 20),
    _SaveBtn(label: 'Save privacy settings', loading: _saving, onTap: _savePrivacy),
  ]);

  Widget _buildNotifications() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const _SectionHeader('Notifications'),
    _Toggle(label: 'Likes',     desc: 'When someone likes your post',    value: _notifLikes,    onChange: (v) => setState(() => _notifLikes = v)),
    _Toggle(label: 'Comments',  desc: 'When someone replies to your post', value: _notifComments, onChange: (v) => setState(() => _notifComments = v)),
    _Toggle(label: 'Follows',   desc: 'When someone follows you',        value: _notifFollows,  onChange: (v) => setState(() => _notifFollows = v)),
    _Toggle(label: 'Messages',  desc: 'When you receive a message',      value: _notifMessages, onChange: (v) => setState(() => _notifMessages = v)),
    const SizedBox(height: 20),
    _SaveBtn(label: 'Save preferences', loading: _saving, onTap: _saveNotifications),
  ]);

  Widget _buildDanger() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const _SectionHeader('Danger Zone'),
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0x0Aef4444),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x22ef4444)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Delete account', style: TextStyle(color: redColor, fontWeight: FontWeight.w700, fontSize: 15)),
        const SizedBox(height: 6),
        const Text('Permanently delete your account and all data. This cannot be undone.', style: TextStyle(color: gray3, fontSize: 13)),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0x22ef4444),
              foregroundColor: redColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: _deleteAccount,
            child: const Text('Delete my account', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ),
      ]),
    ),
  ]);
}

// ── Reusable widgets ──────────────────────────────────────────────────────────

class _SectionTile extends StatelessWidget {
  final String label, id, current;
  final IconData icon;
  final void Function(String) onTap;
  const _SectionTile({required this.label, required this.icon, required this.id, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final active = id == current;
    return GestureDetector(
      onTap: () => onTap(id),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: active ? const Color(0x1Af97316) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          Icon(icon, size: 16, color: active ? orange : gray3),
          const SizedBox(width: 8),
          Flexible(child: Text(label, style: TextStyle(color: active ? orange : gray3, fontSize: 12, fontWeight: active ? FontWeight.w700 : FontWeight.normal))),
        ]),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String text;
  const _SectionHeader(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Text(text, style: const TextStyle(color: white, fontWeight: FontWeight.w800, fontSize: 16)),
  );
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController ctrl;
  final bool obscure;
  final TextInputType keyboard;
  const _Field({required this.label, required this.ctrl, this.obscure = false, this.keyboard = TextInputType.text});

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: const TextStyle(color: gray3, fontSize: 12, fontWeight: FontWeight.w600)),
    const SizedBox(height: 6),
    TextField(
      controller: ctrl,
      obscureText: obscure,
      keyboardType: keyboard,
      style: const TextStyle(color: white),
      decoration: const InputDecoration(),
    ),
  ]);
}

class _Toggle extends StatelessWidget {
  final String label;
  final String? desc;
  final bool value;
  final void Function(bool) onChange;
  const _Toggle({required this.label, this.desc, required this.value, required this.onChange});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 14),
    decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: borderColor))),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: gray1, fontSize: 14, fontWeight: FontWeight.w500)),
        if (desc != null) Text(desc!, style: const TextStyle(color: gray3, fontSize: 12)),
      ])),
      Switch(value: value, onChanged: onChange, activeColor: orange),
    ]),
  );
}

class _SaveBtn extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback onTap;
  const _SaveBtn({required this.label, required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: orange,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(vertical: 14),
      ),
      onPressed: loading ? null : onTap,
      child: loading
          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: white, strokeWidth: 2))
          : Text(label, style: const TextStyle(color: white, fontWeight: FontWeight.w700)),
    ),
  );
}
