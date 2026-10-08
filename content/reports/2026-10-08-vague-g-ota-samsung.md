# 8 oct 2026 — Vague G OTA + smoke Samsung

Overlay Samsung USB `R5CT7263YJL` `-r` uniquement. **Pas Nothing.** Pas de `down -v`. `forceUpdate: false` / `mandatory: false`.

## OTA

- Catalogue `https://hubera.cloud/updates.json` régénéré depuis les feeds live (`make updates-build`) puis docker cp **uniquement** `updates.json` + `updates/*.json` dans `hubera-www`. Vitrine HTML inchangée.
- Photos : APK volume déjà **1.0.9** (`dd3a11b9…`) mais `photos.hubera.cloud/updates.json` disait 1.0.7. JSON aligné, pas de nouvel APK.
- Office : feed + APK release 0.1.1 (`f306a78a…`) sur `hubera-office-web`. `/updates.json` 200, APK `PK`.
- Contacts / Notes / Cook / Tasks / Mail : `forceUpdate: false` ajouté. Pas de publication des APK debug ~150 Mo extraits du téléphone.
- Cook OTA reste **0.1.1** release (téléphone 0.1.2). Tasks **0.1.3** (téléphone 0.1.4). Mail **1.0.4** (téléphone 1.0.5). Pas de rebuild (heures).
- Jobs API toujours **1.0.56** (téléphone 1.0.60). ID sans feed (www 0.0.0). Music apk-info **1.3.359** (téléphone **1.3.360**, `apkAvailable: false` pour ce client).

## Overlay Samsung

- Contacts + Notes : APK **release** déjà built, même version que le téléphone → `-r` Success (debug 151 Mo → release ~54 Mo).
- Cook / Tasks / Photos / Mail / Office : pas d’overlay (downgrade ou déjà à jour).

## Smoke

Launch Samsung OK pour Docs, Drive, Mail, Jobs, ID, Contacts, Photos, Notes, Cook, Tasks, Office. Captures dans `content/reports/captures/<app>/samsung-smoke.png`. Hubera ID non connecté sur ce téléphone → écrans login (pas kanban / inbox / home Drive). Photos 1.0.9 : bannière DEBUG.

## Flutter test

`flutter` système Arch : snapshot SDK cassé (`0451907c` vs `78da37fe`). Tests Contacts/Notes/Photos/Cook/Tasks non exécutables ici. Office : pas de suite Flutter.
