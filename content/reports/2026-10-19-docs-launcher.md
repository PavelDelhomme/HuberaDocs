# Docs 0.2.23 — lanceur Hubera Docs (19 oct)

Nothing `192.168.1.44:5555` (`00145153K001434`) et Samsung `R5CT7263YJL` : `cloud.hubera.docs` **0.2.23** (versionCode 223), overlay `adb install -r`. Samsung a aussi le paquet legacy à la même version. Blackview `EEA9700PRO0014587` ne répondait pas. Pas de `pm clear`.

Le lanceur lit `android:label` / `app_name` : **Hubera Docs**. APK installée sur le Nothing : `application-label:'Hubera Docs'`.

OTA `GET /api/version?clientVersion=0.2.22&clientVersionCode=222&clientPackage=cloud.hubera.docs` : version 0.2.23, code 223, `apkAvailable` true, `forceUpdate` false, `mandatory` false. Un client déjà en 223 voit `apkAvailable` false. Legacy `ovh.delhomme.hubera.docs` à la même version. Magic `504b0304`. `https://docs.hubera.cloud/updates.json` annonce `cloud.hubera.docs` en premier. Conteneur `hubera-docs` inchangé (`docker cp`, pas de `down -v`). `docs.sqlite` non touché.
