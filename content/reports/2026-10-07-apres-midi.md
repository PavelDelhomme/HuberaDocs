# 7 oct 2026 après-midi — Maps GPS arrêt, Music paroles, Pass autofill

Fenêtre ~15h30–18h. Samsung USB `R5CT7263YJL` overlay. Blackview USB vu en lsusb mais **pas ADB**. Nothing **non touché**.

## Livré

- **Maps 0.1.75** (vc 76) : à l’arrêt 0 km/h, voix coupée, Fuel seulement une fois en mouvement, HUD « reste km/min ». Dual APK overlay Samsung. OTA `mandatory: false`.
- **Music 1.3.356** (vc 10656) : paroles **toutes scrollables**, suivi karaoké seulement si la ligne sort du cadre, retour auto **8 s** après le dernier geste. Dual overlay Samsung. OTA `forceUpdate: false`, `apkAvailable: true` pour un client 1.3.355.
- **Pass** : service Autofill Android (type Bitwarden) — code dans l’app, APK Flutter **pas encore overlay** (à builder).

## Tests Samsung

- Maps 0.1.75 installée (cloud + legacy).
- Music p+1.3.356. Session Media3 : titre biblio **ÜZÜLECEKSİN 2.0** (SNOW / Murat Boz). Play via keyevent : resté PAUSED pos=0 (pas de harnais skip).
- Fuel téléphone encore **1.4.165**.
- STREAM_MUSIC : mute ADB incomplet sur ce Samsung (Muted false) — pas de harnais long.

## À faire (kanban)

- Overlay Maps/Music sur Blackview dès ADB.
- Builder + overlay Pass Autofill.
- Fuel 1.4.166+ overlay + budget unique.
- Paroles : vérification visuelle du scroll 8 s sur un titre avec LRC.
- Mail / Drive / Jobs / ID : smoke HTTP OK, cutover Cloudity plus tard.
