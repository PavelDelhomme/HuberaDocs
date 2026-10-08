# Hubera Docs

Cockpit **Paul uniquement** : tâches (kanban), documentation canonique, rapports PDF / mails, avancement (Gantt), retours d’usage → tâches.

- **Pas** Hubera Admin, **pas** HuberaPress.
- Auth : **Hubera ID** + allowlist e-mail.
- Web `https://docs.hubera.cloud` + app **Android native** Kotlin Compose (`android/`, paquets `cloud.hubera.docs` / `ovh.delhomme.hubera.docs`). Pas une WebView du site.
- OTA `forceUpdate: false` / `mandatory: false`. Overlay Samsung `-r` ; jamais Nothing.
- Repo : https://github.com/PavelDelhomme/HuberaDocs

```bash
cp .env.example .env   # SESSION_SECRET long, DOCS_ADMIN_EMAILS
npm install
npm run dev            # http://127.0.0.1:8780
```

Les produits Hubera ne gardent qu’un `DOCS.md` qui pointe ici. Ne plus écrire de NOTES longue dans Fuel/Jobs/…

Stack Portainer : `hubera-docs` · volume `hubera-docs-data` · Watchtower **false**. Jamais `down -v`.
