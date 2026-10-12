# 12 oct 2026 — Lot mock GPS physique (cmd location)

Après le lot Docs labo + Photos. OTA jamais forcée. Pas de `down -v`. Pas d’ADB Nothing. Pas de nouvel APK Maps.

## Problème

`adb emu geo fix` ne déplace **pas** un téléphone réel (commande émulateur). Samsung Android 16 expose `cmd location providers`.

## Livré

- `products/maps/scripts/qa/mock_gps_lib.py` + `mock-gps-trip.py` : test provider GPS, 5 points Rennes → Saint-Jacques, MOCK_LOCATION Maps **et** Fuel.
- Tests `test_mock_gps_lib.py` **4/4** (SDK gate : Blackview API 28 refusé, Samsung API 36 OK ; jamais `emu`).

## Labo

| Appareil | Résultat |
|---|---|
| Samsung `R5CT7263YJL` Android 16 | **5/5 points injectés**. `dumpsys` : `Location[gps 48.103,-1.6935 mock]` **et** `fused` mock identique. |
| Blackview `EEA9700PRO0014587` Android 9 / API 28 | **ECART attendu** : pas de `cmd location providers`. Maps relancé, smoke réel (tuiles + Fuel plus tôt dans la session). |

## Écart UI Maps (noté)

La couche Android a bien le mock. L’écran Maps Samsung **reste** sur le quartier réel (La Croisette / C129 / Av. Gabriel Faure) après « Ma position ». Le WebView ne recentre pas encore sur Saint-Jacques. Pas de trajet zombie créé. À traiter : pont loc WebView / `last-me` / appli mock location développeur — **sans** bump APK tant que le diagnostic n’est pas calé.

Fuel chip et mini-lecteur Music toujours visibles (régression OK).
