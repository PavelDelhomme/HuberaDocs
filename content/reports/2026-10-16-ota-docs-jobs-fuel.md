# 16 oct 2026 — OTA Docs, Jobs, Fuel

APK dual compilées et overlay `-r`. `forceUpdate: false` / `mandatory: false`. Pas de `docker compose down -v`. Conteneur `ytmusic` non redémarré. Volume Fuel `gasoil_api_data` inchangé (upload API seulement).

## Versions

| App | Version | versionCode | Paquets |
|---|---|---|---|
| Docs | 0.2.13 | 213 | `cloud.hubera.docs` + `ovh.delhomme.hubera.docs` |
| Jobs | 1.0.61 | 61 | `cloud.hubera.jobs` + `ovh.delhomme.jobbingtrack` |
| Fuel | 1.4.174 | 198 | `cloud.hubera.fuel` + `com.gasoiltracking.app` |

## Appareils

- Nothing USB `00145153K001434` : les trois apps, deux paquets. Wifi `192.168.1.44:5555` = le même téléphone, un seul overlay.
- Blackview `EEA9700PRO0014587` : les trois apps, deux paquets.
- Samsung `R5CT7263YJL` : absent.

## Feeds

- Docs N-1 `0.2.12` : `https://docs.hubera.cloud/api/version` `apkAvailable: true`. Fichier volume `504b0304`. `/api/apk` sans session = 401 JSON.
- Jobs : `https://jobs.hubera.cloud/api/v1/mobile/releases/latest?platform=android&channel=production` version `1.0.61` build `61`, `forceUpdate: false`. Téléchargement `504b0304`. Pas de champ `apkAvailable`.
- Fuel N-1 `1.4.173` : `https://fuel.hubera.cloud/api/version` `apkAvailable: true` (cloud + legacy). Téléchargement `504b0304`.
