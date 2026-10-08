# 8 oct 2026 — Maps 0.1.77 + Fuel jauge → modèle

## Maps 0.1.77
- Sous le disque **limite de vitesse** : petit menu d’infos pendant le trajet (jauge Fuel live, km restants **seulement hors suivi libre**, ETA, conso / plein).
- HUD 0.1.75/76 inchangé : `STILL_KMH=5`, `ROLL_KMH=8`, « À l’arrêt », `fuelArmed` seulement en roulant.
- Overlay Samsung (USB `R5CT7263YJL`) cloud + legacy **Success**. SHA cloud `477f351a…2baa12`. Pas Nothing. Blackview ADB absent.

## Fuel 1.4.167 (ship)
- Valider la jauge recalibre le modèle par voiture (conso observée vs estimée, `consumptionLearnFactor` + L/100).
- Persistance locale + sync cloud inchangée (`updateVehicle` dans le snapshot).
- Dual APK `cloud.hubera.fuel` + `com.gasoiltracking.app` vc 191. SHA Hubera `baf7c860f7f75fa14e9d191473dd6e7846513584d12e6b3b64a14c28a7c105ac`.
- Overlay Samsung USB `R5CT7263YJL` Success. Pas Nothing. Blackview ADB absent.
- OTA `forceUpdate: false` / `mandatory: false`. `apkAvailable: true` pour un client 1.4.165.

OTA Maps `mandatory: false`. Jamais de MAJ forcée.
