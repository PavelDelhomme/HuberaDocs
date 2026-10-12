# 12 oct 2026 — Fuel 1.4.171 : pastille mock GPS

Après Maps 0.1.92. OTA jamais forcée. Pas de `down -v`. Pas d’ADB Nothing.

## Problème

Expo Fused Location ignore le provider labo `huberalab`. La pastille Fuel restait à Thorigné alors que Maps (pont natif) était déjà à Saint-Jacques. Le filtre `too_fast` protégeait bien les km trajet (à garder).

## Livré

- `HuberaLocationModule` : tous les providers, mock gagne 120 s, event JS `huberaFix`.
- Pastille idle : `acceptMapDisplayFix` accepte un téléport mock ; les km restent filtrés.
- Dual APK **1.4.171** vc 195. Overlay Samsung + Blackview `-r`.
- Live `fuel.hubera.cloud/api/version` **forceUpdate: false**, `apkAvailable: true` (cloud + legacy).
- SHA cloud `af2147f3ea85e4d1500d48761048cfe691f75a91a632fe1ae1a4fe73dd55e60a`.

## Tests

| Suite | Résultat |
|---|---|
| Vitest Fuel | **154/154** |
| dont `gps-free-tracking` (téléport km rejeté, pastille mock OK) | 8/8 |
| Samsung HuberaLoc `mock=true p=huberalab` 5/5 | PASS |
| Carte Fuel Arsenal-Redon / Mabilais | PASS |

## Labo

| Appareil | Résultat |
|---|---|
| Samsung `R5CT7263YJL` | Overlay Success. Carte recentrée Saint-Jacques. SSO `qa.lab` (pas de mot de passe dans ce rapport). |
| Blackview `EEA9700PRO0014587` | Overlay Success 1.4.171 (était 1.4.165). Smoke accueil Trajet/Véhicules/Stats. Pas de `cmd location` (API 28). |

Maps **0.1.92** et Music **p+1.3.368** inchangés (régression OK).
