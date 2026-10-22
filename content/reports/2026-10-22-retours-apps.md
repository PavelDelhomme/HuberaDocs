# Docs 0.2.38 — liste des applications du retour

Le formulaire Retour (web et app) propose maintenant Notes, Tasks, Stream, Budget, Taskflow, CMS, Office et VTCBuilder, avec les applications déjà présentes. La copie de cette liste dans le cockpit Admin est alignée. Les tâches et les textes de retours déjà enregistrés n’ont pas été modifiés.

Priorité 1 à 5, créé le, modifié le, cible API / web / mobile, sous-tâches et lanceur Hubera Docs restent.

OTA `GET /api/version?clientVersion=0.2.37&clientVersionCode=237&clientPackage=cloud.hubera.docs` : version 0.2.38, code 238, `apkAvailable` true, `forceUpdate` false, `mandatory` false. Un client déjà en 0.2.38 / 238 voit `apkAvailable` false. Legacy `ovh.delhomme.hubera.docs` à la même version. Magic `504b0304`. `https://docs.hubera.cloud/updates.json` annonce `cloud.hubera.docs` en premier. Conteneur `hubera-docs` inchangé (`docker cp` + restart, pas de `down -v`). `docs.sqlite` non réécrit (249 tâches, 85 retours).

Samsung `R5CT7263YJL` et Blackview `EEA9700PRO0014587` : `cloud.hubera.docs` puis legacy, `p+0.2.38`, `adb install -r`. Le formulaire Retour montre `notes` et `tasks`. Nothing non touché.
