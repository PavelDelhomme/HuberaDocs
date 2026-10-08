# 8 oct 2026 — Stream leftover torrent + Photos release OTA

Rien overlayé (Nothing interdit, Samsung laissé). Pas de `down -v`. Pas de force-push. `forceUpdate: false` / `mandatory: false`. Pas d’APK Flutter debug publié.

## Stream (Git)

Repo `PavelDelhomme/StreamMake`. Branche `feat/stream-remove-torrent-leftover` laissée sur GitHub.

- Feature : `4624c3a` — retirer le leftover torrent du repo produit
- Merge `--no-ff` main : `9034e6f`

Supprimé : `backend/internal/torrent/*`, scrapers index, UI admin torrent, clients Docker (Transmission/qBittorrent/Deluge/rTorrent/*arr), scripts how-to.

Stub : `/admin/torrents` = landing légale. Live `/app/` Pluto+Arte **200** (nginx Portainer non recréé).

## Photos (OTA)

`assembleRelease` **oui** — clé labo debug `3cf6c532…` (même cert que le DEBUG 1.0.9 live / Drive). Pas de keystore séparé ; c’est le modèle suite Flutter Hubera.

Remplacement volume (conteneur `hubera-photos-web` intact) :

| Slot | Avant | Après |
|---|---|---|
| Canonical `cloud.hubera.photos` | 1.0.9 DEBUG ~155 Mo | **1.0.10** vc 11 release ~53 Mo |
| Legacy `fr.cloudity.cloudity_photos` | 1.0.5 ~53 Mo | **1.0.10** vc 11 release ~54 Mo |

- Feed : https://photos.hubera.cloud/updates.json
- APK canonical : https://photos.hubera.cloud/apk/hubera-photos.apk
- APK legacy : https://photos.hubera.cloud/apk/legacy/hubera-photos.apk
- Install : https://photos.hubera.cloud/install
