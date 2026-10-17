import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Color(0x00000000),
    systemNavigationBarColor: Color(0x00000000),
  ));
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
    await _offerAccount();
    await _controller.loadRequest(Uri.parse('https://docs.hubera.cloud/'));
    if (mounted) setState(() {});
  }

  Future<void> _offerAccount() async {
    var installed = false;
    try {
      installed = await _sso.invokeMethod<bool>('idInstalled') ?? false;
    } catch (_) {}
    if (!mounted) return;
    await WidgetsBinding.instance.endOfFrame;
    if (!mounted) return;
    final pad = MediaQuery.viewPaddingOf(context);
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    final action = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        insetPadding: EdgeInsets.fromLTRB(24 + pad.left, 24 + pad.top, 24 + pad.right, 24 + pad.bottom),
        backgroundColor: dark ? const Color(0xFF2D2E30) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
                child: Text(
                  'Choisir un compte',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w400,
                    color: dark ? const Color(0xFFE8EAED) : const Color(0xFF202124),
                  ),
                ),
              ),
              for (final email in _emails)
                _DocsAccountLine(
                  title: _accountTitle(email),
                  subtitle: email,
                  onTap: () => Navigator.pop(ctx, email),
                ),
              _DocsAccountLine(
                title: 'Ajouter un compte',
                add: true,
                onTap: () => Navigator.pop(ctx, ''),
              ),
              if (!installed)
                _DocsAccountLine(
                  title: 'Installer Hubera ID',
                  add: true,
                  onTap: () => _sso.invokeMethod<void>('openIdInstall'),
                ),
            ],
          ),
        ),
      ),
    );
    if (!mounted || action == null) return;
    if (action.isEmpty) {
      await _promptNewAccount();
      return;
    }
    try {
      await _sso.invokeMethod<Map<dynamic, dynamic>>('sso', {'email': action});
    } catch (_) {}
  }

  Future<void> _promptNewAccount() async {
    final emailCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ajouter un compte'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'E-mail')),
            TextField(controller: passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Mot de passe Hubera ID')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Créer la session')),
        ],
      ),
    );
    final email = emailCtrl.text;
    final password = passCtrl.text;
    emailCtrl.dispose();
    passCtrl.dispose();
    if (ok != true || !mounted) return;
    try {
      await _sso.invokeMethod<Map<dynamic, dynamic>>('login', {
        'email': email,
        'password': password,
      });
    } catch (_) {}
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
      backgroundColor: const Color(0xFF0F172A),
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

String _accountTitle(String email) {
  final local = email.split('@').first.trim();
  if (local.isEmpty) return email;
  return local[0].toUpperCase() + local.substring(1);
}

Color _avatarColor(String email) {
  const palette = <Color>[
    Color(0xFF1A73E8),
    Color(0xFF188038),
    Color(0xFFE37400),
    Color(0xFF9334E6),
    Color(0xFF007B83),
    Color(0xFFC5221F),
    Color(0xFF1967D2),
    Color(0xFF0D7377),
  ];
  var hash = 0;
  for (final code in email.toLowerCase().codeUnits) {
    hash = (hash * 31 + code) & 0x7fffffff;
  }
  return palette[hash % palette.length];
}

class _DocsAccountLine extends StatelessWidget {
  const _DocsAccountLine({
    required this.title,
    required this.onTap,
    this.subtitle,
    this.add = false,
  });

  final String title;
  final String? subtitle;
  final bool add;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    final ink = dark ? const Color(0xFFE8EAED) : const Color(0xFF202124);
    final muted = dark ? const Color(0xFF9AA0A6) : const Color(0xFF5F6368);
    final sub = subtitle?.trim();
    final showSub = sub != null && sub.isNotEmpty && sub.toLowerCase() != title.toLowerCase();
    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 64),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: add ? Colors.transparent : _avatarColor(sub ?? title),
                  border: add ? Border.all(color: muted) : null,
                ),
                child: Text(
                  add ? '+' : (title.isEmpty ? '?' : title[0].toUpperCase()),
                  style: TextStyle(
                    color: add ? ink : Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 16, color: ink),
                    ),
                    if (showSub)
                      Text(
                        sub,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 14, color: muted),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
