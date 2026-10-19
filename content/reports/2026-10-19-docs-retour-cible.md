# Docs 0.2.25 — retour : cible et dates (19 oct)

Le formulaire Retours demande d’abord l’application, puis la cible : API, web, mobile, ou une combinaison. Ce choix est enregistré sur le retour et sur la tâche créée. Créé le est l’instant d’enregistrement. Modifié le avance à chaque changement. La priorité 1 à 5 reste. Le lanceur reste Hubera Docs.

Samsung `R5CT7263YJL` : `cloud.hubera.docs` puis `ovh.delhomme.hubera.docs`, **0.2.25** (versionCode 225), overlay `adb install -r`. Blackview `EEA9700PRO0014587` absent d’adb (un appareil MediaTek est branché sans interface de débogage). Nothing non touché.

OTA `GET /api/version?clientVersion=0.2.24&clientVersionCode=224&clientPackage=cloud.hubera.docs` : version 0.2.25, code 225, `apkAvailable` true, `forceUpdate` false, `mandatory` false. Un client déjà en 0.2.25 / 225 voit `apkAvailable` false. Legacy à la même version. Magic `504b0304`. `https://docs.hubera.cloud/updates.json` annonce `cloud.hubera.docs` en premier. Conteneur `hubera-docs` inchangé (`docker cp` + restart, pas de `down -v`). Textes et priorités des tâches déjà posées non réécrits.
