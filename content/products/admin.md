# Hubera Admin

Application **ops** + cockpit Docs intégré (tâches, docs, rapports, retours, Gantt, tenants, console `/4dm1n`). Live mobile **0.1.6**. Interface native, pas de WebView.

- Mobile : `cloud.hubera.admin` — gateway `https://id.hubera.cloud` (proxy `/admin` → `cloudity-api-gateway`).
- Web : `https://cloudity.delhomme.ovh/4dm1n` (pas `admin.hubera.cloud` tant que le TLS n’est pas posé).
- Si l’écran affiche `<!doctype html>` : le nginx Hubera ID ne proxifie pas `/admin` (corrigé 6 oct 2026).

Ne jamais injecter `paul@delhomme.ovh` sur le Nothing. Overlay `-r`. OTA `forceUpdate: false`.
