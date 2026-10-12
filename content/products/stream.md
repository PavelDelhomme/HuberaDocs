# Hubera Stream

Pas de client Android aujourd’hui. Package réservé : `cloud.hubera.stream`.

Hook Hubera ID : même module `android-sso` + picker. Voir [SSO Android](../guides/hubera-id-sso-android.md).

**Web** : login Hubera ID sur `/app/` (proxy `/auth/` → Cloudity). À la connexion, écriture du cookie `hubera_suite_auth` (`Domain=.hubera.cloud`, aligné Mail/Drive/Calendar). Lecture seule si déjà connecté ailleurs dans la suite.

**Admin owner** : `/admin/sources/` — catalogue personnel (magnet ou URL privée), allowlist `paul@delhomme.ovh`. `/admin/torrents/` reste une landing légale (pas de client torrent public).

Bibliothèque web **légale** : catalogue Pluto TV (API `api.pluto.tv` / boot officiel) et Arte.tv (EMAC v4 + player officiel). Lecture in-app via embed Arte (`allowEmbed`) et iframe Pluto. **Pas** de torrents, **pas** de contournement DRM.

URL : `https://stream.hubera.cloud/app/` (`mandatory` / `forceUpdate`: false).
