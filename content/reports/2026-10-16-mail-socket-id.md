# Mail 1.0.21 — socket Hubera ID sur le Nothing

Nothing `192.168.1.44:5555` (`cloud.hubera.mail` 1.0.21, versionCode 22). Samsung non touché. Pas de `pm clear`. Pas de paquet legacy réinstallé.

Logcat avant correctif :

`ClientException with SocketException: Failed host lookup: 'id.hubera.cloud' (OS Error: No address associated with hostname, errno = 7), uri=https://id.hubera.cloud/mail/me/accounts`

Au même moment, `ping` et `curl` du téléphone résolvaient `id.hubera.cloud` en `95.111.227.204` et obtenaient HTTP 200. Chaque appel Dart ouvrait puis fermait un client HTTP, d’où les échecs DNS (errno 7) et les aborts de socket (errno 103, « Software caused connection abort ») pendant la jonction ID et la synchro.

Correctif : un client HTTP unique, résolution IPv4 mise en cache, nouvel essai si le DNS ou la socket lâche. `GET /mail/me/accounts` répond 200. Synchros IMAP 200. Aucun `ClientException` / `SocketException` dans le processus Mail. Liste affichée, message ouvert, recherche Bouygues servie par l’API. Notification d’arrivée émise.

OTA `https://mail.hubera.cloud/updates.json` : canonical 1.0.21 / code 22, `apkAvailable` true, `forceUpdate` false, `mandatory` false. APK `https://mail.hubera.cloud/apk/hubera-mail.apk` magic `504b0304`.
