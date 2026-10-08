# Calendar + Tasks — overlay type Google (8 oct 2026)

Web d’abord. **Pas d’overlay Nothing.** Samsung ADB non touché (APK Calendar reste **0.1.7** vc 8). Pas de `down -v`. `forceUpdate: false` / `mandatory: false`.

## Live

- Calendar web **0.1.8** (`VERSION` + cache `?v=0.1.8`) · https://calendar.hubera.cloud/app/
- Git HuberaCalendar **main** (feat `feat/calendar-show-tasks`)
- Déploiement : `docker cp` assets `hubera-calendar-web` + `updates.json` + reload nginx (conteneur created 2026-09-19, inchangé)
- OTA Calendar APK **0.1.7** vc **8** (mêmes SHA, pas de binaire plus vieux). Champ `web_version: 0.1.8`
- Tasks OTA notes : échéances visibles dans Calendar. Canonical **0.1.3** vc 4, `forceUpdate: false`

## GATE (2e passe)

| Point | Statut |
|---|---|
| `node web/app/grid.test.mjs` | **PASS** |
| `GET /tasks` sans auth | **401** |
| Chip jour d’échéance (`[TEST] Calendar overlay …` le 8 oct) | **PASS** |
| Toggle **Tâches** dans le tiroir | **PASS** |
| Terminer depuis Calendar → `completed: true` sur `GET /tasks` (même Hubera ID) | **PASS** |
| Pas de copie dans `calendar_events` | **PASS** |
| Purge `[TEST]` uniquement | **PASS** |
| APK / overlay Nothing | **non fait** (volontaire) |

Compte QA navigateur : `qa.lab@maily.ovh` (cookie suite).

## Captures

- `captures/calendar/2026-10-08-tasks-mois.png`
- `captures/calendar/2026-10-08-tasks-sheet.png`
- `captures/calendar/2026-10-08-tasks-drawer.png`

## Restes

- Flutter Calendar 0.1.7 affiche déjà les tâches (package partagé) ; pas de toggle tiroir natif ce lot, pas d’APK 0.1.8.
- TaskFlow `tasks.hubera.cloud` garde son auth propre ; l’overlay Calendar lit le `GET /tasks` Cloudity (Hubera ID).
