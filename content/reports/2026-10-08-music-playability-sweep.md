# Hubera Music — sweeper de jouabilité (serveur)

Pas un dump pirate, pas un scrape « tout YouTube », pas de torrent. Uniquement YouTube Music / Innertube, comme `/api/stream`.

## Pourquoi

Des titres de bibliothèque (tous comptes, pas seulement Paul) restaient injouables : URL morte, 403/HTML, ou **le même titre pointant vers plusieurs morceaux différents**. Le client voyait parfois « coroutine left the scope » quand un `LaunchedEffect` annulait le resolve.

## Ce que fait le sweeper

Module `api/src/library/playabilitySweep.ts`, table SQLite `data/playability.db` (`videoId`, `status` ok/fail/replaced, `replacementVideoId`, `lastChecked`, `error`, `durationMs`).

1. Résout l’URL audio comme la prod (`getAudioFormat` Innertube).
2. Sonde HTTP Range (début + derniers octets) — pas de téléchargement complet.
3. Si KO : recherche **songs only** (filtre musique), sonde les candidats, upsert l’id canonique, **alias** l’ancien (file d’attente encore valable).
4. Titres homonymes : un canonique jouable, les doublons sont repliés.

## Planning

- **Cron dans le process API ytmusic** (`setInterval` 6 h, départ ~3 min après boot). Lots de ~40, concurrence 2, pause ~750 ms. **Pas de Cursor /loop.**
- `POST /api/admin/playability/sweep` (auth admin) — limiter `limit` (max 40).
- À la demande : URL morte sur `/api/stream` → recover debounce 60 s ; `POST /api/library/repair-playability` (« réparer »).
- CLI conteneur : `npx tsx api/src/library/playabilitySweep.ts --once --limit 8`

Env : `PLAYABILITY_SWEEP=0` pour couper le cron. Watchtower ytmusic reste **OFF**. `STREAM_MUSIC=0` sur les téléphones. Pas de `docker compose down -v`.

## Android

Resolve hors composition (`PlaybackScopes` / appScope). `CancellationException` / « left the scope » n’est plus traité comme un titre cassé. Source dans le dépôt ; **APK 1.3.362** si on publie après 1.3.361 (pas d’overlay Nothing ici).

## Légal

Innertube YouTube Music uniquement. Aucun magnet, scrape global, DeviantArt.
