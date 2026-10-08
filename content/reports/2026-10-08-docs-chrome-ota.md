# 8 oct 2026 — Docs 0.2.4 chrome Music + OTA lancement

Chrome Google-like calqué sur Hubera Music (pas une copie analogue). Overlay Samsung `-r` seulement. Pas Nothing.

## Android

- Header compact (Row 48 dp type `AppTopBar` Music), hamburger gauche, compte droite, status bar claire.
- Nav bas Material3 : Accueil · Tâches · Docs · Rapports.
- Drawer : Cahier unique, Kanban, Docs, Rapports PDF, Gantt, Retours, Compte / MAJ, grille suite Hubera.
- OTA au lancement : dialogue proposition, `forceUpdate: false` / `mandatory: false`, jamais bloquant.
- Écran Compte : version installée, notes, télécharger/installer APK (slot selon le paquet).
- Kanban : popup carte + FAB + colonnes inchangés (plus de Scaffold imbriqué).

## Dual APK 0.2.4 (vc 204)

`cloud.hubera.docs` + `ovh.delhomme.hubera.docs`. Volume `/app/data/apk`. `apkAvailable: true` pour un client 0.2.0 / 0.2.3.

SHA :
- `cloud.hubera.docs` `540c3dc486650c55f30c2f03479623ceb4288dce94e04dfcf5690dd2ffe96b57`
- `ovh.delhomme.hubera.docs` `9a514cad6fc0271c6c6ef795d0ba38c8ee5e72c9741fafa56b412926a211409d`

Overlay Samsung `R5CT7263YJL` `-r` : `p+0.2.4` vc 204 (cloud + legacy). **Pas Nothing.** Watchtower Docs `false`. Conteneur `hubera-docs` inchangé (created 2026-10-06), docker cp + restart.
