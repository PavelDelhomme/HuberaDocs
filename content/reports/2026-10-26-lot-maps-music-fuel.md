# Lot Maps / Music / Fuel — 26 octobre 2026

Prod déployée (web + dual APK). Overlay Samsung lab + Blackview `-r`. Pas Nothing. OTA `forceUpdate: false` / `mandatory: false`. Cockpit : **À valider**, pas Fait.

## Versions

| App | Version | Code | N-1 voit apkAvailable |
|---|---|---|---|
| Maps | 0.1.131 | 132 | oui |
| Music | 1.3.398 | 10698 | oui |
| Fuel | 1.4.194 | 220 | oui |

## Contenu

### Maps
- Cartes enregistrées + swipe Modifier / Supprimer
- Limite hors conduite
- Itinéraire gardé en pan/zoom
- POI fuel : ways OSM + centre (Total Portain)

### Music
- AronChupa → Aron Chupa
- Reprise flux après navigation SPA
- Typo ostromae : Ridsa ne passe plus devant Stromae
- LOGIN_REQUIRED / tunnel maison : encore ouvert

### Fuel
- Terminer sans résurrection du bouton (cache live sync + cooldown)

## Git (local, non auto-commité dans ce rapport)

- Maps `main` : web/app.js, index, updates, VERSION…
- YTMusic `feat/music-drawer-open-native` : mappers, searchRank, player…
- GasoilTracking `prod` : maps.tsx, startFreeTrip, app.json 1.4.194

PDF mail : `Hubera-2026-10-26-lot-maps-music-fuel.pdf`.
