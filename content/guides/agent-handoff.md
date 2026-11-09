# Handoff agent — suite Hubera (9 nov 2026)

Tu prends la suite après Composer. Lis ce fichier **avant** de coder. Réponds en **français**.

## Priorité produit

Stabiliser **Music → Maps → Fuel** (lecture, OTA, hors-ligne). Ne **pas** redessiner la DA. Ne **pas** `docker compose down -v`. OTA toujours `forceUpdate: false` / `mandatory: false`.

## État live (VPS `pavel-server`)

| Élément | État |
|---|---|
| Music API `ytmusic` | **p+1.3.413**, fix DASH relay (relais itag 140 si froid, sans tempête `downloadTrack`) |
| Coolify | Up `https://coolify.delhomme.ovh` (hôte `:8008`, NPM `#68`, SSL OK) |
| Fleet Watch | Conteneur `fleet-watch` — CVE HIGH/CRITICAL + digests, mail quotidien 06:30, **notify-only** |
| Watchtower | **Exited** volontairement (écrasait overlay Music) — voir `kits/fleet-watch/AUTO-UPDATE.md` |
| Nothing / Samsung / Blackview | Music **1.3.413**, Fuel **1.4.198**, Maps **0.1.134** (overlay `-r`) |

## Repos (symlinks HuberaCloud)

| Produit | Chemin | Remote | Branche utile |
|---|---|---|---|
| Music | `products/music` → `YTMusic` | HuberaMusic | **`dev`** (merge OK `feat/music-drawer-open-native` @ 1.3.413, tag `music-1.3.413-ok`) |
| Fuel | `products/fuel` → `GasoilTracking` | HuberaFuel | `prod` / `dev` |
| Maps | `products/maps` → `Maps` | HuberaMaps | `main` |
| Docs / Cockpit | `products/docs` | HuberaDocs | `main` |
| Meta | racine HuberaCloud | Hubera | `main` — contient `kits/fleet-watch/` |

## Music — ce qui a été fait (1.3.413)

1. **Serveur** `api/src/media/stream.ts` : titres froids (hors pins) — si googlevideo `ftyp=dash`, relayer à Android au lieu de rejeter (~100 s de silence). `downloadTrack` progressif **après** décision (évite stack overflow). Env `STREAM_DASH_RELAY_FALLBACK=0` pour couper.
2. **Ducking / mic Google** : `PlayerAudioFocus.kt` + `PlaybackService` — ne plus traiter pause MediaSession focus comme pause user ; reprise GAIN / mode audio.
3. **Pas d’autoplay** au restore/notif : `playWhenReady = autoplay` **avant** `prepare()` dans `PlayerController`.
4. **OTA Compte lent** : `ApkUpdateManager` — hosts en parallèle, timeouts courts, budget UI ~8 s. Endpoint client = `/api/deploy/apk/info` (pas seulement `/api/version`).
5. Déploiement API : souvent `docker cp` + `docker restart ytmusic` (volume `ytmusic_ytmusic_data` intact). Scripts : `scripts/android/android-publish-apk.sh`, `publish-apk-remote.sh`.

## À faire ensuite (ordre suggéré)

1. **Valider Nothing** : lecture hors épingles, reprise après Assistant, Compte check OTA rapide.
2. **OAuth TV Music** si stream encore fragile : fichier tokens encore souvent manquant (`oauth-device-pending.json` sans tokens).
3. **Fuel OTA store** : `android/` est gitignoré — bump version aussi via `app.json` + rebuild `-PhuberaAppId` ; publier APK Fuel sur son endpoint OTA si le flux existe.
4. **Maps OTA** : version `0.1.134` sur devices ; publier binaire sur le canal OTA Maps si besoin hors ADB.
5. **Fleet Watch** : laisser tourner ; dimanche = digest forcé. Ne pas réactiver Watchtower sur `ytmusic`.
6. **Auto-heal playability** : cron ~45 min déjà en place ; surveiller logs `playabilitySweep` / 403 transitoires.

## Interdits

- `paul@…` hardcodé en UI produit ; smokes avec `QA_EMAIL` / `LAB_EMAIL`.
- Forcer OTA.
- Pull Watchtower / Rename volumes / fusionner Git users Portainer.
- Implémenter Contacts / Calendar / Hub tant que Music-Maps-Fuel ne sont pas stables (voir `.cursor/rules/backlog-produit-plus-tard.mdc`).

## Commandes utiles

```bash
# Santé Music
ssh pavel-server 'docker exec ytmusic curl -fsS http://127.0.0.1:8787/api/health'

# Overlay Music (déjà buildé)
adb -s <nothing> install -r products/music/data/public/android/hubera-music.apk

# Fleet Watch manuel
ssh pavel-server 'docker exec fleet-watch /opt/fleet-watch/scan.sh --once'

# Coolify
curl -fsS https://coolify.delhomme.ovh/api/health
```

## Contexte conversation

Session Cursor : déploiement Coolify+NPM, Fleet Watch CVE, fix lecture Music DASH, alignement OTA mobile, handoff présent.
