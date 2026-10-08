import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const HuberaDocsApp());
}

class HuberaDocsApp extends StatelessWidget {
  const HuberaDocsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hubera Docs',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0E4D5C)),
        useMaterial3: true,
      ),
      home: const DocsShell(),
    );
  }
}

class DocsShell extends StatefulWidget {
  const DocsShell({super.key});

  @override
  State<DocsShell> createState() => _DocsShellState();
}

class _DocsShellState extends State<DocsShell> {
  static const _sso = MethodChannel('hubera_id_sso');
  late final WebViewController _controller;
  var _loading = true;
  List<String> _emails = const [];

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF4F7F8))
      ..addJavaScriptChannel(
        'HuberaId',
        onMessageReceived: (msg) async {
          final email = msg.message.trim();
          if (email.isEmpty) return;
          await _sso.invokeMethod<Map<dynamic, dynamic>>('sso', {'email': email});
          await _controller.reload();
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
            _injectAccounts();
          },
        ),
      );
    _boot();
  }

  Future<void> _boot() async {
    try {
      final raw = await _sso.invokeMethod<List<dynamic>>('listEmails');
      _emails = (raw ?? [])
          .map((e) => (e as Map)['email']?.toString() ?? '')
          .where((e) => e.isNotEmpty)
          .toList();
    } catch (_) {
      _emails = const [];
    }
    var auto = false;
    if (_emails.length == 1) {
      try {
        final r = await _sso.invokeMethod<Map<dynamic, dynamic>>('tryAutoSso');
        auto = r?['ok'] == true;
      } catch (_) {}
    }
    await _controller.loadRequest(Uri.parse('https://docs.hubera.cloud/'));
    if (mounted) setState(() {});
    if (auto) {
      // Cookie déjà posé : le /api/auth/me du site verra la session.
    }
  }

  Future<void> _injectAccounts() async {
    if (_emails.isEmpty) return;
    final json = jsonEncode(_emails);
    await _controller.runJavaScript(
      'window.__huberaDeviceAccounts = $json; '
      'window.__huberaDeviceAccountsReady && window.__huberaDeviceAccountsReady();',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_loading) const LinearProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
