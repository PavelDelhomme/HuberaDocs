# Hubera Maps

Priorité 2 après Music. Lieux, tuiles hors-ligne, garage Fuel dans Maps.

- Domaine : https://maps.hubera.cloud
- OTA : `updates.json` + `GET /api/version` (même JSON). `forceUpdate: false` / `mandatory: false`
- Live **0.1.82** vc 83 · UI WebView d’avant le chrome 0.1.80 + cold start 0.1.79 · overlay Samsung + Blackview `-r` 8 oct · **Nothing absent ADB** → sideload https://maps.hubera.cloud/apk/hubera-maps.apk
- SHA APK cloud `94e4017326833c5bc5779fcf485f9c43051abe8ac2364716add7a09dc7097395`
- SHA APK legacy `5157b907cbfc971720da9446d00d0c8f8a8742cbbd6e2fb3f1ba76b427e09b80`

## Nothing — installer **sans ouvrir** l’app (P0 crash 0.1.75)

Si Maps se ferme au lancement, l’OTA in-app est inutilisable. Télécharger le fichier APK (pas besoin de lancer Maps) :

1. **APK directe** : https://maps.hubera.cloud/apk/hubera-maps.apk
2. Raccourci identique : https://maps.hubera.cloud/download
3. Page d’aide : https://maps.hubera.cloud/install
4. Legacy `ovh.delhomme.maps` : https://maps.hubera.cloud/apk/hubera-maps-legacy.apk

Installer par-dessus (garder les données), **puis** ouvrir Maps.

- **0.1.82** : UI d’avant chrome (HUD / recherche / onglets) + cold start 0.1.79. Rapport `content/reports/2026-10-08-maps-0.1.82.md`
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
