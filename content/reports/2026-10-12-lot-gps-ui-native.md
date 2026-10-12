# 12 oct 2026 — Maps 0.1.92 : la pastille suit le mock GPS

Après le harnais `cmd location` (couche Android OK, UI coincée au quartier réel). OTA jamais forcée. Pas de `down -v`. Pas d’ADB Nothing.

## Problème

Le WebView Chromium ignore souvent les positions mock. `add-test-provider gps` échoue dès que le GPS matériel existe (`gps provider is not a test provider`). Le GNSS réel écrasait le mock → pastille à Cesson / La Croisette.

## Livré

- `LocationBridge` : écoute **tous** les providers, poll ~900 ms, mock gagne 120 s, ignore le GNSS réel 60 s après un mock.
- JS `__mapsNativeFix` : fly si mock et saut > 25 m ; `freshMs: 0`.
- Harnais : provider **`huberalab`** (plus le nom `gps`).
- Dual APK **0.1.92** vc 93. SHA cloud `0458a9b0…2615`, legacy `4c5acdc6…e0070`.
- Live `https://maps.hubera.cloud/updates.json` **forceUpdate: false**.

## Tests

| Suite | Résultat |
|---|---|
| `test_mock_gps_lib.py` | 4/4 |
| `test-maps-native-fix.mjs` | 3/3 |
| Harnais Samsung 5 points Rennes → St-Jacques | 5/5 injectés |

## Labo

| Appareil | Résultat |
|---|---|
| Samsung `R5CT7263YJL` Android 16 | Overlay `-r` Success. `HuberaLoc` `mock=true p=huberalab` jusqu’à `48.103,-1.6935`. Carte **Arsenal-Redon / Mabilais** (Saint-Jacques). Mini-lecteur Music + onglets Maps/Fuel/Enreg. OK. |
| Blackview `EEA9700PRO0014587` Android 9 | Overlay `-r` Success. Pas de `cmd location` (API 28). Smoke réel La Croisette : tuiles, recherche, Fuel, pastille, dock Music. |

Fuel chip et dock Music inchangés (régression OK).
