# 8 oct 2026 — Maps 0.1.79 cold start (P0 Nothing)

## Cause

Nothing se fermait au lancement (écran Compte / OTA injoignable).

1. **0.1.75** : `JSONException Value <?xml` dans `SpeedLimitBridge.parse` (Overpass HTML/504). Corrigé en 0.1.76 (skip non-JSON) — Nothing probablement encore sur cette build.
2. **0.1.78** : `SuiteBridge.adoptHuberaId()` sur le **thread UI** au cold start (80 ContentProviders + Keystore `EncryptedSharedPreferences`) → ANR / kill process possible. L’OTA in-app ne peut pas s’ouvrir si le process meurt avant.

## 0.1.79 (vc 80)

- Carte d’abord, même hors-ligne / sans token Fuel / sans Hubera ID.
- SSO adopt **hors UI**, GPS demandé après le premier paint.
- Parse JSON/XML vérifié (Overpass, OSRM, OTA, Fuel, Contacts). `startActivity` encapsulé.
- OTA `forceUpdate: false` / `mandatory: false` / `apkAvailable: true` pour N-1.
- Dual APK `cloud.hubera.maps` + `ovh.delhomme.maps`.

## Nothing sans ouvrir l’app

- **https://maps.hubera.cloud/apk/hubera-maps.apk** (fichier, `Content-Disposition: attachment`)
- https://maps.hubera.cloud/download (même fichier)
- https://maps.hubera.cloud/install

Pas d’overlay ADB Nothing. Overlay Samsung `-r` USB `R5CT7263YJL`. Watchtower Music OFF. Pas de `down -v`.

## SHA

| Paquet | version | SHA-256 |
|---|---|---|
| `cloud.hubera.maps` | 0.1.79 vc 80 | `2d5a5c0dad0a5a8eec82305569be25cecb31e748c0fea33105993b44209d0326` |
| `ovh.delhomme.maps` | 0.1.79 vc 80 | `4f318ef28485f42e8042d8f8eb06e11f71d115b73402637ae24de9a432052730` |
