# Docs 0.2.8 + Admin 0.1.6 — cockpit natif, retours éditables (8 oct)

Paul : retours/notes non modifiables, chrome type page web, espace barre Admin / Docs, markdown brut. **Samsung d’abord**, puis Nothing si OK. Pas de `down -v`. `forceUpdate: false`.

## Livré

- PATCH `/api/remarks/:id` : texte, type (retour/note), application — la tâche liée suit.
- Rapports et fichiers `.md` rendus (titres, listes), plus le monospace brut. Bouton Modifier pour éditer.
- Barre unique : hamburger, ou **Retour** dans la même barre quand un fichier / rapport / compte est ouvert. Plus de deuxième flèche en dessous.
- Hubera Admin **0.1.6** : le cockpit Docs (accueil, tâches, docs, rapports, retours, Gantt, compte) est **dans** l’app, SSO Hubera ID, pas de WebView. Tenants et console web restent dans le tiroir.

## Overlay

- Samsung `R5CT7263YJL` et Blackview `EEA9700PRO0014587` : Docs `p+0.2.8` vc 208 + Admin `0.1.6` vc 7, overlay `-r`.
- Nothing : **pas sur ADB** — pas d’overlay, OTA `apkAvailable: true` / `forceUpdate: false`.
- Connexion Admin Samsung : écran Hubera ID OK ; mot de passe prod pas dans les `.env` (Bitwarden verrouillé). API PATCH retours + rendu markdown web vérifiés avec session allowlist Paul. Le retour Music existant a été restauré après un test PATCH.
