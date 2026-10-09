# 9 oct 2026 — Chrome insets, OTA sans boucle, overlay Samsung

Lot Maps / chrome / Mail / Cook / OTA. Overlay `-r` **Samsung seulement**. Nothing gardé pour les vidéos (pas d’ADB). Blackview USB en HID MediaTek, pas d’ADB.

## Overlay Samsung `R5CT7263YJL` (SM-G990B2)

| App | Paquet | Version |
|---|---|---|
| Maps | cloud + legacy | 0.1.84 vc 85 |
| Docs | cloud + legacy | p+0.2.9 vc 209 |
| Mail | cloud.hubera.mail | 1.0.5 vc 6 |
| Cook | cloud.hubera.cook | 0.1.4 vc 5 |
| Music | cloud + legacy | p+1.3.366 vc 10666 |

## OTA live (`forceUpdate: false` / `mandatory: false`)

- Music N-1 (1.3.365) : `apkAvailable: true` · client 366 : false
- Docs N-1 (0.2.8) : `apkAvailable: true` · client 0.2.9 : false
- Maps `updates.json` 0.1.84
- Cook 0.1.4 · Mail canonical 1.0.5
- Watchtower **arrêté**. Pas de `down -v`. docker cp volumes existants.

## Produit

- Maps / Flutter / Docs : un seul padding bas, plus de double inset.
- OTA : permission d’installer **avant** le téléchargement, cooldown 90 s.
- Mail : plus de `/auth/validate` si le JWT n’expire pas.
- Cook : scroll infini recettes, quantités frigo, FAB au-dessus de Courses.
- Jobs prod : SSO Hubera ID remappe/promouvoit `paul@delhomme.ovh` en SUPER_ADMIN (`jobbingtrack-prod-auth-service` restart).

## Blackview / Nothing

- Nothing : **pas touché**.
- Blackview `EEA9700PRO0014587` : Maps dual + Docs canonical déjà posés plus tôt ; reste docs-legacy, mail, cook, music. USB `0e8d:20ff` HID, pas ADB.
