# Hubera Docs

Cockpit **Paul uniquement** : tâches (kanban), documentation canonique, rapports PDF / mails, avancement (Gantt), retours d’usage → tâches.

- **Pas** Hubera Admin, **pas** HuberaPress.
- Auth : **Hubera ID** + allowlist e-mail.
- Web + PWA (Nothing : Chrome → Ajouter à l’écran d’accueil).
- Repo : https://github.com/PavelDelhomme/HuberaDocs
- Domaine visé : `https://docs.hubera.cloud`

```bash
cp .env.example .env   # SESSION_SECRET long, DOCS_ADMIN_EMAILS
npm install
npm run dev            # http://127.0.0.1:8780
```

Les produits Hubera ne gardent qu’un `DOCS.md` qui pointe ici. Ne plus écrire de NOTES longue dans Fuel/Jobs/…

Stack Portainer : `hubera-docs` · volume `hubera-docs-data` · Watchtower **false**. Jamais `down -v`.
