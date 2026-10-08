# Hubera Calendar

Agenda quotidien (pas un clone Google Calendar). Override backlog Music→Maps→Fuel demandé le 8 oct 2026.

- Domaine : https://calendar.hubera.cloud — app `/app/` (mois / semaine / jour / agenda)
- Login **Hubera ID** (`/auth/login` Cloudity, cookie suite `.hubera.cloud`)
- Chrome web : hamburger (suite + compte) · nav vues · avatar
- API : `POST /calendar/events/from-maps` (alias `/api/calendar/events/from-maps`) · récurrence `daily` / `weekly` / `monthly` / `weekdays` · RSVP `PUT /calendar/events/:id/rsvp`
- Mobile Flutter **0.1.7** vc 8 : grille + Maps intent + récurrence (Samsung déjà overlayé). Git web/API **main** `ebe24e3`
- Dual APK `cloud.hubera.calendar` (SHA `076da581…739624`) + `fr.cloudity.cloudity_calendar` (SHA `82398e0e…3b2e93`)
- OTA `updates.json` · `mandatory: false` / `forceUpdate: false`
- Overlay labo : Samsung SM-G990B2 `R5CT7263YJL` `-r` **0.1.7**. Legacy publié pour OTA, **non installé** sur ce téléphone. **Pas Nothing.**
- Lieux : texte libre. Invitations : e-mails + RSVP web (`accepted` / `declined` / `tentative`). Pas de Meet / salles.
