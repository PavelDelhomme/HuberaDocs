# Calendar — grille utilisable (8 oct 2026)

Override backlog Music→Maps→Fuel demandé explicitement.

## Livré

- Web `https://calendar.hubera.cloud/app/` : login Hubera ID, vues **mois / semaine / jour**, liste du jour, CRUD événements (API Cloudity `calendar-service`, volumes inchangés).
- Mobile Flutter **0.1.5** vc 6 : mêmes vues + tap créneau pour créer. Dual APK.
- Overlay Samsung USB `R5CT7263YJL` `cloud.hubera.calendar` `-r` (était 0.1.4 vc 5). Processus vivant, sélecteur identifiants Hubera ID à l’ouverture.
- OTA `mandatory: false` / `forceUpdate: false`.
- Pas de `down -v`. Pas d’overlay Nothing. Pas d’injection `paul@delhomme.ovh`.

## Restes

- Invitations : champ e-mail Contacts déjà dans l’éditeur mobile ; pas de RSVP / salles / Meet.
- Lieux Maps (picker) : texte libre seulement.
- Picker SSO Hubera ID natif Calendar : même hook que Maps/Fuel, pas un écran dédié ce lot.
- Legacy `fr.cloudity.cloudity_calendar` publié pour OTA, **non installé** sur le Samsung (évite un second icône).
