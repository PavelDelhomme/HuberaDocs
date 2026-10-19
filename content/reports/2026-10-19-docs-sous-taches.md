# Docs 0.2.26 — sous-tâches (19 oct)

Retour ops `2f02ca58b4c4d401`, enregistré le 19 oct. 2026 à 15:41 (Paris), tâche `db64a835a2446091`, priorité 1, cibles API, web et mobile. Texte :

> quand je veux je peux pas créer de sous tâchew d'une tâche et sous sous tâche ect d'une tâche do c que tu as créé ou que j'ai créer dans hubera doc enfaite pour rajouter des sous eleotn a faire donc. en d'un créant colle une nouvelle tâche mais qui est une sous tâche d'une tâche principale ou une sous sous tâche et ainsi de suite donc a revoir genre un retour ou un sous retour d'une tâche bref

Depuis la fiche d’une tâche et depuis un retour, on crée une sous-tâche rattachée à la tâche. On peut en ajouter d’autres, y compris sous une sous-tâche, puis modifier titre, détail, colonne et priorité. Créé le reste l’instant de création. Modifié le avance. La priorité 1 à 5 et la cible API / web / mobile déjà posées ne sont pas réécrites. Le lanceur reste Hubera Docs.

Nothing `192.168.1.44:5555` et Samsung `R5CT7263YJL` : `cloud.hubera.docs` puis `ovh.delhomme.hubera.docs`, **0.2.26** (versionCode 226), overlay `adb install -r`. Le Nothing lit `versionName=p+0.2.26`. Blackview : un appareil MediaTek est branché sans interface de débogage, absent d’adb.

OTA `GET /api/version?clientVersion=0.2.25&clientVersionCode=225&clientPackage=cloud.hubera.docs` : version 0.2.26, code 226, `apkAvailable` true, `forceUpdate` false, `mandatory` false. Un client déjà en 0.2.26 / 226 voit `apkAvailable` false. Legacy à la même version. Magic `504b0304`. `https://docs.hubera.cloud/updates.json` annonce `cloud.hubera.docs` en premier. Conteneur `hubera-docs` inchangé (`docker cp` + restart, pas de `down -v`). Textes et priorités des tâches déjà posées non réécrits.
