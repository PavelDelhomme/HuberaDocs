# Hubera Drive

Fichiers et dossiers. Live : https://drive.hubera.cloud (API encore **Cloudity** — ne pas stopper la stack `cloudity`).

## 8 oct 2026 — poids quotidien vs Google Drive

Incréments **réels** (pas un clone) :

- **Lien de partage public** : aperçu HTML (PDF / image / audio / vidéo) sur `https://drive.hubera.cloud/drive/share/{token}` sans compte. Menu ⋮ → créer / copier / arrêter le lien. Téléchargement `?download=1`.
- **Favoris + Partagés** sur le web (comme les vues Google Drive).
- **Upload jusqu’à 210 Mo** (nginx `/drive` était encore au défaut 1 Mo).
- **Liste dossiers** : `starred` + `share_token` renvoyés (le menu savait déjà partager, mais ne voyait pas l’état).
- **Hubera ID** : le picker Cloudity lit aussi `*.hubera.id` ; permission `READ_ID_ACCOUNT` sur l’APK. JWT Music ≠ JWT Drive : si la session ID n’est pas Cloudity, le login redemande le mot de passe / passkey.

OTA **1.0.6** vc 7 · `mandatory: false` / `forceUpdate: false`. Overlay Samsung `-r` dual (`cloud.hubera.drive` SHA `84e20786…13747652` + `fr.cloudity.cloudity_drive` SHA `d3b0c586…921bfa2d`). **Pas Nothing** (OTA uniquement). Debug disparu sur Samsung (`DEBUGGABLE` retiré).

## 8 oct 2026 — chrome Google Drive + APK release

Cause du « debug » sur Nothing : l’OTA **1.0.5** était un APK Flutter **debug** (`kernel_blob.bin` JIT, `DEBUGGABLE`, bannière jaune). Rebuild **release** 1.0.6 (`debuggable=false`, AOT, API `https://drive.hubera.cloud`).

Chrome obligatoire :

- Top bar : hamburger · recherche · bouton compte Hubera ID
- Bottom nav : **Accueil** (suggérés / récents, pas l’arbre) · **Favoris** · **Partagés** · **Fichiers** (arborescence uniquement ici)
- Drawer : Récents, Importations, Hors connexion, Corbeille, Spam, Paramètres, quota Go utilisés / Go totaux (API `/drive/storage/summary` + 15 Go par défaut)

OTA Nothing : `https://drive.hubera.cloud/updates.json` · APK `https://drive.hubera.cloud/apk/hubera-drive.apk` · install `https://drive.hubera.cloud/install`

## Déjà là (web + mobile)

Arborescence dossiers, recherche, corbeille (restore / purge), aperçu (web PDF/images/texte ; mobile images/texte, PDF via appli), upload avec barre de progression, récents.

## Encore vs Google Drive

- Hors-ligne + file de reprise : **package commun Hubera ID**, pas un sync Drive isolé (backlog).
- Aperçu PDF **in-app** mobile (aujourd’hui ouverture externe).
- Partage dossier complet (enfants téléchargeables) ; collab multi-comptes.
- SPA web Partager / Favoris / chrome Google Drive : **live** `cloudity-web` (docker cp assets, pas `down -v`). Hors-ligne drawer = placeholder jusqu’au package ID.
- Cutover hors Cloudity : plus tard, volumes intacts.
