# 8 oct 2026 — Hubera Docs web + app Android native

Lot cockpit **cahier unique**. Auth Hubera ID allowlist. Pas Admin / CMS.

## Web

- Header resserré, titre **Cahier unique**, logo Docs (teal Hubera `#0E4D5C` + orange `#C9782A`).
- Nav bas icônes + libellés, cibles pouce 56 px.
- Kanban : clic → **popup fiche** (édition depuis la fiche). FAB **+**. Colonnes ajoutables.
- Rapports PDF **et** markdown ingérés automatiquement, liés au compte (`owner_email`). Ex. `Hubera-2026-10-07-soir-lyrics-suite.pdf`, `2026-10-07-soir-lyrics.md`. 401 sans session.

## Android

Kotlin Compose dans `products/docs/android` — **pas** de WebView du site.
Écrans : login Hubera ID, dashboard, kanban (popup + FAB + colonnes), docs, PDF natif (`PdfRenderer`), Gantt (barres API), retours.
Dual APK `cloud.hubera.docs` + `ovh.delhomme.hubera.docs` **0.2.0** (`p+0.2.0`, vc 200).
OTA `forceUpdate: false` / `mandatory: false`.
Overlay Samsung `-r` (USB `R5CT7263YJL`). **Pas** Nothing. Blackview : pas d’ADB.

## Prod 8 oct (cutover)

Live `https://docs.hubera.cloud` **0.2.0** : cahier unique, kanban popup/FAB/+colonne, rapports 7 oct MD+PDF pour Paul, 401 sans session.
Volume `hubera-docs-data` intact (sqlite). Watchtower Docs `false`. Pas `down -v`.
OTA : client N-1 `apkAvailable: true`, déjà 0.2.0 / plus récent → pas d’APK plus vieille. `forceUpdate: false` / `mandatory: false`.

SHA volume `/app/data/apk` :
- `cloud.hubera.docs.apk` `07da425a3d74d5a156ef08a011f3f4913bd06297169f071f85c1bcea1043c170`
- `ovh.delhomme.hubera.docs.apk` `95702245b1db2f873b875d6fb4410ee56b6e394d2b1bf4d4311112570f13ca94`

Overlay Samsung `R5CT7263YJL` confirmé `p+0.2.0` vc 200 (cloud + legacy). **Pas** Nothing.

## Reste

Push GitHub `HuberaDocs` (main encore 0.1.0 — ne pas Git-redeploy Portainer sinon rollback). Drag-and-drop kanban non demandé. Overlay Blackview : pas d’ADB.
