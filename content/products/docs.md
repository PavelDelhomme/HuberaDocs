# Hubera Docs

Cahier unique Paul (pas Admin, pas CMS). Web `https://docs.hubera.cloud` + app Android native Compose.

- Auth Hubera ID, allowlist.
- Vues : dashboard → kanban (popup carte, FAB, colonnes) → docs → PDF/md du compte → Gantt → retours.
- Dual APK `cloud.hubera.docs` / `ovh.delhomme.hubera.docs`. Live **0.2.4**. OTA jamais forcée (`forceUpdate: false` / `mandatory: false`), dialogue au lancement.
- Chrome type Music : hamburger, header compact, compte haut droite, nav bas Accueil · Tâches · Docs · Rapports.
- Pas de WebView du site. Overlay Samsung `-r` seulement. Pas Nothing.
