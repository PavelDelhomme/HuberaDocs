# Vague D — Hubera Calendar (8 oct 2026)

Web + API. **Pas d’overlay Nothing.** Samsung ADB laissé au worker Music (`R5CT7263YJL`) ; Calendar 0.1.7 déjà overlayé. Pas de `down -v`. `forceUpdate: false` / `mandatory: false`. Pas de rebuild Maps APK.

## Live

- Version OTA : **0.1.7** vc **8** · `fr.cloudity.cloudity_calendar` + canonical `cloud.hubera.calendar`
- Git HuberaCalendar **main** `ebe24e3482181a9e3c137f2a5fcf511af940544d`
- Déploiement : `docker cp` binaire `cloudity-calendar-service:/app/app` + assets `hubera-calendar-web` + restart service (conteneur web inchangé, Up 2 weeks)

## Résultats

| Point | Statut |
|---|---|
| Vues web mois / semaine / jour / agenda | **PASS** |
| Chrome drawer / compte / nav vues | **PASS** (hamburger + avatar + Jour/Semaine/Mois/Agenda) |
| Récurrence `daily` / `weekly` / `monthly` / `weekdays` | **PASS** API + UI (occurrences dépliées sur la grille) |
| `POST /calendar/events/from-maps` + alias `/api/…` | **PASS** (401 sans auth ; create puis `created: false` même `id`) |
| Événement Maps éditable | **PASS** (PUT titre/lieu) |
| Maps 0.1.81 hook `CalendarBridge` (`c522059`) | **déjà là** — pas de rebuild APK |
| Invitations e-mail + champ invités | **PASS** (stockage `attendees`) |
| RSVP `PUT/POST /calendar/events/:id/rsvp` | **PASS** (ajouté ce lot : `accepted` / `declined` / `tentative`) |
| Sync web `[TEST]` puis DELETE uniquement `[TEST]` | **PASS** (`QA Event` id=2 conservé) |

## Captures

- `captures/calendar/2026-10-08-vague-d-mois.png`
- `captures/calendar/2026-10-08-vague-d-semaine.png`
- `captures/calendar/2026-10-08-vague-d-jour.png`
- `captures/calendar/2026-10-08-vague-d-agenda.png`
- `captures/calendar/2026-10-08-vague-d-agenda-test.png`
- `captures/calendar/2026-10-08-vague-d-drawer.png`
- `captures/calendar/2026-10-08-vague-d-editeur-rsvp.png`

## Restes

- Pas de Meet / salles / `.ics` / lien RSVP public dans le mail.
- Lieux : texte libre (pas de picker Maps).
- Éditeur RSVP live sur le **web** ; le Flutter 0.1.7 a déjà le champ invités, pas le sélecteur RSVP (pas d’APK ce lot).
- Chrome web = tiroir suite léger, pas la nav bas native Flutter.
