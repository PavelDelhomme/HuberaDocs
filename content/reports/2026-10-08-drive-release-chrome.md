# 8 oct 2026 — Hubera Drive 1.0.6 release + chrome Google Drive

Nothing **non overlayé** (OTA seulement). Samsung overlay `-r`. Pas de `down -v`. Pas d’injection `paul@delhomme.ovh`. Watchtower Music OFF. Stack `cloudity` intacte.

## Cause du mode debug

L’APK OTA **1.0.5** vc 6 (~160 Mo) était un build Flutter **debug** : `kernel_blob.bin` JIT, flag Android `DEBUGGABLE`, bannière jaune Material. Overlay Samsung récent avec ce binaire.

## Correctif

- APK **release** 1.0.6 vc 7 : `debuggable=false`, minify/shrink, pas de banner, API `https://drive.hubera.cloud`.
- Dual packages, signature labo `3cf6c532…`.
  - `cloud.hubera.drive` SHA-256 `84e20786d5bc6c3dadc8d6a3f888bd82863618efed7a7d80a87be59013747652`
  - `fr.cloudity.cloudity_drive` SHA-256 `d3b0c58683acc0a4cceee2df6ad9b9fbd2fd7a4270698973455ab1e3921bfa2d`
- Overlay Samsung `R5CT7263YJL` `-r` **Success** (1.0.5 DEBUGGABLE → 1.0.6 sans DEBUGGABLE).
- OTA `forceUpdate: false` / `mandatory: false`. `apkAvailable: true` pour un client 1.0.5.

## Screens

- Top bar : drawer · recherche · compte Hubera ID (picker si d’autres comptes sur le téléphone)
- Bottom : Accueil / Favoris / Partagés / Fichiers
- Drawer : Récents, Importations, Hors connexion, Corbeille, Spam, Paramètres, quota Go/Go
- Accueil ≠ arborescence ; l’arbre est uniquement dans **Fichiers**

## OTA Nothing

- Feed : https://drive.hubera.cloud/updates.json
- APK canonical : https://drive.hubera.cloud/apk/hubera-drive.apk
- APK legacy : https://drive.hubera.cloud/apk/legacy/hubera-drive.apk
- Install : https://drive.hubera.cloud/install
