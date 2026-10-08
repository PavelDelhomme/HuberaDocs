# Hubera Stream

Pas de client Android aujourd’hui. Package réservé : `cloud.hubera.stream`.

Hook Hubera ID : même module `android-sso` + picker. Voir [SSO Android](../guides/hubera-id-sso-android.md). Sur le web, cookie suite `hubera_suite_auth` (même domaine) — pas de mot de passe collecté ici.

Bibliothèque web **légale** : catalogue Pluto TV (API `api.pluto.tv` / boot officiel) et Arte.tv (EMAC v4 + player officiel). Lecture in-app via embed Arte (`allowEmbed`) et iframe Pluto. **Pas** de torrents, **pas** de contournement DRM.

URL : `https://stream.hubera.cloud/app/` (`mandatory` / `forceUpdate`: false).
