# Mail 1.0.17 — liste, swipe, notification

Nothing `192.168.1.44:5555` et Blackview `EEA9700PRO0014587` : `cloud.hubera.mail` **1.0.17** (versionCode 18). Samsung non touché. Pas de paquet legacy installé.

OTA `https://mail.hubera.cloud/updates.json` : canonical 1.0.17, `forceUpdate` false, `mandatory` false, `apkAvailable` true. APK `https://mail.hubera.cloud/apk/hubera-mail.apk` magic `504b0304`. Le flux legacy reste en 1.0.11.

ANR 13:11 sur le Nothing (1.0.16) : le fil principal bloqué dans `ContentResolver.insert` pendant que la liste réécrivait la session Hubera ID chez tous les peers, même si le jeton n’avait pas changé. `refreshIfNeeded` ne propage plus une session inchangée. Les lectures et écritures du broker partent hors du fil UI, et seulement vers les paquets installés.

Gmail de ce téléphone : balayage droite = marquer lu/non lu (bleu, enveloppe), balayage gauche = supprimer (corail, corbeille). Hubera Mail reprend ces deux gestes, avec Annuler. Une notification part seulement pour un non-lu vraiment nouveau, avec l’expéditeur et l’objet reçus.
