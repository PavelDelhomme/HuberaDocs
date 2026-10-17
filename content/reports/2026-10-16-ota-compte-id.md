# 16 oct 2026 — OTA choix de compte, safe area, popup

APK déjà compilées publiées. Canoniques manquantes sur le disque (écrasées par le build legacy) recompilées depuis le source courant, sans baisser la version. `forceUpdate: false` / `mandatory: false`. Pas de `docker compose down -v`. Auth Jobs non redémarrée : `POST /api/v1/auth/login/hubera-sso` sans jeton reste 400. Catalogue `https://hubera.cloud/updates.json` régénéré (JSON seulement).

## Flux

| App | URL | Version | apkAvailable | forceUpdate |
|---|---|---|---|---|
| ID | `https://id.hubera.cloud/updates.json` | 0.1.4 vc 104 `cloud.hubera.id` | true | false |
| Mail | `https://mail.hubera.cloud/updates.json` | 1.0.8 vc 9 cloud + legacy | true | false |
| Drive | `https://drive.hubera.cloud/updates.json` | 1.0.9 vc 10 cloud + legacy | true | false |
| Jobs | `https://jobs.hubera.cloud/api/v1/mobile/releases/latest?platform=android&channel=production` | 1.0.64 build 64 | pas de champ | false |
| Fuel | `https://fuel.hubera.cloud/api/version` | 1.4.176 vc 200 cloud + legacy | true pour un client 1.4.175 | false |
| Maps | `https://maps.hubera.cloud/api/version` | 0.1.101 vc 102 cloud + legacy | true | false |
| Docs | `https://docs.hubera.cloud/api/version` | p+0.2.15 vc 215 cloud + legacy | true pour un client 0.2.14 | false |
| Notes | `https://notes.hubera.cloud/updates.json` | 0.1.10 vc 11 cloud + legacy | true | false |
| Calendar | `https://calendar.hubera.cloud/updates.json` | 0.1.11 vc 12 cloud + legacy | true | false |

Téléchargements publics `504b0304`. Docs : le fichier est dans le volume, `/api/apk` sans session reste 401.

## Appareils

- Blackview `EEA9700PRO0014587` : `cloud.hubera.id` **0.1.4** installé (`adb install -r`). Pas de paquet legacy ID.
- Nothing `192.168.1.44:5555` : déjà en 0.1.4, non réinstallé.
- Samsung : non touché.
