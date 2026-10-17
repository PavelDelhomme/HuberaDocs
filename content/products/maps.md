# Hubera Maps

**DA vague 1 :** [`../design/labo-da-vague1.html`](../design/labo-da-vague1.html) (variante C · carte + recherche).

Priorité 2 après Music. Lieux, tuiles hors-ligne, garage Fuel dans Maps.

- Domaine : https://maps.hubera.cloud
- OTA : `updates.json` + `GET /api/version` (même JSON). `forceUpdate: false` / `mandatory: false`
- Live **0.1.106** vc 107 (17 oct. 2026) : popup de mise à jour comme Hubera Fuel (proposée, jamais forcée, téléchargement puis installateur). Thème du téléphone. OTA `forceUpdate: false` / `mandatory: false`. Pas d’overlay Nothing.
- SHA APK cloud `9995c74ef11217feaaf8b6d3c82c0b9ce8c29f8e4398cdf210d5c1d392520a38`
- SHA APK legacy `9f77360d04f2b7fd287569ce93ee34c9d874beef3f643aa90c48da8c2a031c21`

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
