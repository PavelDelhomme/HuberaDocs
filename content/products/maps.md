# Hubera Maps

Priorité 2 après Music. Lieux, tuiles hors-ligne, garage Fuel dans Maps.

- Domaine : https://maps.hubera.cloud
- OTA : `updates.json` + `GET /api/version` (même JSON). `forceUpdate: false` / `mandatory: false`
- Live **0.1.81** vc 82 · cold start 0.1.79 + chrome natif 0.1.80 · trajet → Calendar · Fuel `hubera-maps://` sans chooser · overlay Samsung cloud+legacy 8 oct · **pas Nothing (ADB)**
- **P0 8 oct Nothing** : crash au lancement (0.1.78/0.1.79) → OTA in-app impossible. Sideload navigateur 0.1.81 **après** campagne suite. `content/reports/2026-10-08-nothing-maps-crash-lancement.md`
- SHA APK cloud `76befdc589a749c18af88d45be55af6b1114849fd281c16ccd2f6e0aa59fd56a`
- SHA APK legacy `241841da9577647a2d22d151bbc3f6961e357e0bc818be6187a76a0783a8c1ab`

## Nothing — installer **sans ouvrir** l’app (P0 crash 0.1.75)

Si Maps se ferme au lancement, l’OTA in-app est inutilisable. Télécharger le fichier APK (pas besoin de lancer Maps) :

1. **APK directe** : https://maps.hubera.cloud/apk/hubera-maps.apk
2. Raccourci identique : https://maps.hubera.cloud/download
3. Page d’aide : https://maps.hubera.cloud/install
4. Legacy `ovh.delhomme.maps` : https://maps.hubera.cloud/apk/hubera-maps-legacy.apk

Installer par-dessus (garder les données), **puis** ouvrir Maps.

- **0.1.81** : fusion cold-start + chrome ; Calendar ; pont Fuel unique
- **0.1.80** : chrome natif hamburger / compte / Carte-Trajet-Lieux
- **0.1.79** : adopt auto Bearer Hubera ID (SSO hors UI) — overlay Samsung seulement
- **0.1.77** : menu infos trajet sous la limite
- **0.1.76** : parse Overpass durci (skip HTML/XML)
- **0.1.75** : crash au start `JSONException Value <?xml` dans `SpeedLimitBridge.parse`
- Overlay Blackview : si ADB
- Dock Music dans Maps (pont `HuberaMusic`)
- Nothing : Paul installe lui-même — **jamais overlay ADB Nothing**

Noter ici (onglet Noter) ce qui cloche sur Nothing / Samsung / Blackview.
