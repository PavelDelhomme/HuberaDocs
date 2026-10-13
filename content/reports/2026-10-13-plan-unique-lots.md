# 13 oct 2026 — Plan unique, overlay Vague A, lots A7–D1

Plan unique : `content/PLAN.md`. Pointeurs : `RESTE-A-FAIRE.md`, Jobs / Cloudity ops / lab `PLAN.md`.

## Overlay Vague A (Samsung + Blackview, `-r`, OTA jamais forcée)

- Maps **0.1.94** vc 95 dual (`cloud.hubera.maps` + `ovh.delhomme.maps`), feed live `apkAvailable` + sha réel.
- Fuel **1.4.173** vc 197 dual, `forceUpdate=false` sur les deux paquets.
- Catalogue `hubera.cloud/updates.json` régénéré.

## A7 OTA type Music

Dialogue spinner + notes + Télécharger / Plus tard. Cache APK **non purgé** ; reprise Range si partiel. Flutter `cloudity_shared`, Maps, Docs, Jobs.

## A8 Retour

`PopScope` sur le scaffold suite (Paramètres → accueil). Mail / Drive idem. Jobs `moveTaskToBack`. Maps WebView racine : `moveTaskToBack` au lieu de `finish()`.

## B–D (code)

Mail notifs + carnet téléphone ; Calendar lieu Contacts + FAB/drawer ; Notes Keep FAB ; Drive partage Hubera/lien ; Jobs import Contacts ; Pass PIN 6 ; Cook FR ; Admin DocsCockpit natif ; cold start JWT sans boucle gateway.
