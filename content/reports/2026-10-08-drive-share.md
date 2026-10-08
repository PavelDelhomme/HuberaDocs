# 8 oct 2026 — Hubera Drive face à Google Drive (incréments)

Cloudity **non stoppée**. Pas de `down -v`. Nothing non touché.

## Live

- `cloudity-drive-service` : binaire HTML partage (`lien partagé`) docker-cp + restart **seul**. Health OK. Auth / mail / gateway inchangés.
- nginx `cloudity-web` : `/drive` `client_max_body_size 210m` + timeouts 600 s. Reload nginx, pas recreate stack.
- Page publique `GET /drive/share/:token` (Accept HTML) : aperçu PDF/image. JSON si `format=json`.
- Fake token → 404 JSON (pas 401).

## SPA web (8 oct soir)

- Rebuild image `cloudity-frontend:local-ops-20261008-nav` (`sha256:704a7de340…`). **docker cp** des assets + `nginx.conf` dans le conteneur `cloudity-web` existant (id `ebee3d98`, tag image toujours `local-ops-20260922`). Reload nginx. Pas recreate, pas `down -v`.
- Bundle servi : `/app/drive/assets/index-CZ9JrsGI.js`.
- Chrome live : bas Accueil / Favoris / Partagés / Fichiers ; haut drawer + recherche + compte ; drawer Récents, Importations, Hors connexion, Corbeille, Spam, Paramètres, quota `0 Mo / 15 Go`.
- Arbre uniquement dans **Fichiers**. Accueil = suggérés + ouverts récemment.
- Fake token `/drive/share/not-a-real-token` → 404 JSON. Auth / mail / postgres toujours up.

## Reste

- Hors-ligne Drive (drawer) : placeholder — package commun Hubera ID.
- Quota réel API (plafond) : affichage 15 Go tant que `/drive/storage/summary` n’a pas de total.
- APK : ne pas overlay Nothing ; autre agent sur Android.

## Kanban

- Drive : partage HTML + upload 210 Mo → **fait**
- Drive : SPA Partager + nav Google Drive live → **fait**
- Drive : hors-ligne commun ID → **plus tard**
