# 8 oct 2026 — P0 Nothing : Maps crash au lancement (OTA in-app impossible)

**P0 à traiter APRÈS** la campagne suite (vagues A–G + récap + audit git). Pas d’implémentation maintenant. **Pas Nothing ADB / overlay.** Pas de `down -v`. Ne pas interrompre Music APK/OTA.

## Symptôme

Paul (Nothing, prod utilisateur) : Hubera Maps **crash immédiat au lancement** et se ferme. L’OTA in-app (écran Compte / dialogue MAJ) est **inutilisable** — l’app ne reste pas assez longtemps pour se mettre à jour.

Nothing est probablement encore en **0.1.78 / 0.1.79**. Live OTA (vérifié 8 oct 2026, sans toucher le téléphone) :

- Feed : https://maps.hubera.cloud/updates.json → **0.1.81** vc 82, `apkAvailable: true`, `mandatory: false`, `forceUpdate: false`
- APK : https://maps.hubera.cloud/apk/hubera-maps.apk · **5 303 596** octets · SHA-256 `76befdc589a749c18af88d45be55af6b1114849fd281c16ccd2f6e0aa59fd56a`
- Legacy : https://maps.hubera.cloud/apk/hubera-maps-legacy.apk · **5 303 568** octets

Une app qui crash ne peut pas s’auto-mettre à jour.

## Contournement immédiat (Paul)

1. **Ne pas** ouvrir l’app Maps crashée.
2. **Ne pas** ADB / overlay Nothing.
3. Dans le **navigateur** du téléphone : installer https://maps.hubera.cloud/apk/hubera-maps.apk (par-dessus, garder les données).
4. Ensuite seulement, ouvrir Maps.

Blackview et Samsung sont **déjà en 0.1.81**.

## Cause historique

- **0.1.78** : `adoptHuberaId()` sur le thread UI → crash au start.
- **0.1.79** : cold start (carte d’abord, SSO hors UI) — overlay Samsung seulement, pas Nothing.
- **0.1.81** : fusion Overpass (skip non-JSON) + SSO hors UI + chrome natif. Publié live ; Nothing n’a pas pu l’OTA.

## Après la campagne suite

1. Confirmer si **0.1.81 sideloadé** (navigateur) tient sur Nothing.
2. Si **encore crash** → **0.1.82** : launch sans ID / Fuel bloquant, log, nreg cold start, OTA `mandatory: false` / `forceUpdate: false`. Dual APK + overlay Samsung/Blackview. **Jamais overlay Nothing.**
