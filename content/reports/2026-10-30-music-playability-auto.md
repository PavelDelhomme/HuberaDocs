# Music — heal jouabilité automatique continu (1.3.411)

**30 oct ~17h.** Sans Cursor /loop : le process API `ytmusic` balaye seul.

## Comportement

- Cron **toutes les ~45 min** (départ ~90 s après boot), lots de 24.
- Erreur **transitoire** (`no-stream-url`, 403, LOGIN_REQUIRED, timeout…) → d’abord **autres routes** audio (client / itag / relais), **pas** un autre titre.
- Remplacement d’id seulement si la vidéo est vraiment morte (unavailable / privée / copyright).
- Les fails transitoires restent visibles côté client (`isPlayableId`) et sont re-tentés au prochain passage.

## Déploiement

- Overlay conteneur : `playabilitySweep.ts`, `freshAudioRoutes.ts`, `VERSION` 1.3.411, restart.
- Log live : `[playability] cron every 45 min (start in 90 s, batch=24)`.
- APK toujours **1.3.410** (changement serveur) — OTA non forcée.

Env : `PLAYABILITY_SWEEP=0` coupe le cron. `PLAYABILITY_SWEEP_INTERVAL_MS` / `BATCH` surchargeables.
