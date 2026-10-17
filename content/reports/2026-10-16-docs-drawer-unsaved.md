# Docs 0.2.20 — tiroir et brouillon (16 oct)

Nothing `192.168.1.44:5555` : `cloud.hubera.docs` **0.2.20** (versionCode 220). Overlay `adb install -r` déjà en place, pas réinstallé ensuite. Pas de `pm clear`. Pas de paquet legacy publié. APK magic `504b0304`.

OTA : `https://docs.hubera.cloud/updates.json` annonce **0.2.20** / code **220**, `apkAvailable` true, `forceUpdate` false, `mandatory` false. Un client **0.2.19** (code 219) voit `apkAvailable: true` sur `/api/version`. Un client déjà en 0.2.20 voit `apkAvailable: false`. Fichier copié dans le volume `hubera-docs-data` (`docker cp`, conteneur inchangé). `docs.sqlite` non touché. Legacy `ovh.delhomme.hubera.docs` laissé tel quel.

## Cause

- Le hamburger appelait `drawerState.open()`, mais `ModalNavigationDrawer` pose un geste horizontal sur tout l’écran. Ce geste prenait le clic avant le bouton : le tiroir ne s’ouvrait pas.
- La fiche tâche était un `ModalBottomSheet`. Son contenu (et le `remember` du titre / détail) disparaissait dès que la feuille se fermait ou se recomposait. Le texte non enregistré partait avec.

## Correctif

- Geste du tiroir actif seulement quand il est déjà ouvert (pour le refermer). Le bouton ouvre et referme.
- La fiche reste dans l’écran, sous la barre. Le brouillon est conservé tant que la carte n’est pas enregistrée, y compris si on ferme la fiche ou qu’on rouvre la même carte.

## Geste

À rejouer sur le Nothing : hamburger → menu (Retours, Gantt, Compte, version). Ouvrir une carte, Modifier, saisir un détail, Fermer, rouvrir la même carte : le détail saisi est encore là. Enregistrer l’efface du brouillon.
