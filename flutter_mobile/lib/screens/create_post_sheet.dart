import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/api.dart';
import '../utils/theme.dart';

class CreatePostSheet extends StatefulWidget {
  final Function(Map<String, dynamic>) onPost;
  const CreatePostSheet({super.key, required this.onPost});
  @override
  State<CreatePostSheet> createState() => _CreatePostSheetState();
}

class _CreatePostSheetState extends State<CreatePostSheet> {
  final _ctrl = TextEditingController();
  String? imagePath;
  bool loading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final img = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => imagePath = img.path);
  }

  Future<void> _submit() async {
    if (_ctrl.text.trim().isEmpty && imagePath == null) return;
    setState(() => loading = true);
    try {
      final res = await Api.postMultipart(
        '/posts/create',
        {'content': _ctrl.text},
        files: imagePath != null ? {'image': imagePath!} : null,
      );
      widget.onPost(Map<String, dynamic>.from(res));
      if (mounted) Navigator.pop(context);
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: gray4, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          TextField(
            controller: _ctrl,
            maxLines: 4,
            style: const TextStyle(color: white, fontSize: 15),
            decoration: const InputDecoration(hintText: "What's on your mind?"),
            autofocus: true,
          ),
          if (imagePath != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Stack(children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(imagePath!, height: 140, width: double.infinity, fit: BoxFit.cover),
                ),
                Positioned(top: 6, right: 6,
                  child: GestureDetector(
                    onTap: () => setState(() => imagePath = null),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.close, color: white, size: 16),
                    ),
                  )),
              ]),
            ),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            IconButton(
              icon: const Icon(Icons.image_outlined, color: gray3),
              onPressed: _pickImage,
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: orange,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
              ),
              onPressed: loading ? null : _submit,
              child: loading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: white, strokeWidth: 2))
                  : const Text('Post', style: TextStyle(color: white, fontWeight: FontWeight.w700)),
            ),
          ]),
        ]),
      ),
    );
  }
}
