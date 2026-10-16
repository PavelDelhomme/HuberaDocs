# Mail 1.0.20 — bandeau de synchro et gestes Gmail

Nothing `192.168.1.44:5555` et Blackview `EEA9700PRO0014587` : `cloud.hubera.mail` **1.0.20** (versionCode 21). Samsung non touché. Pas de paquet legacy installé. Pas de `pm clear`.

Le bandeau « Synchronisation interrompue » s’affichait alors que la boîte en cache était là. Le rafraîchissement HTTP (400) posait une erreur, et un succès suivant ne l’effaçait pas. Le bandeau ne reste que si le transport a vraiment échoué et que le rafraîchissement n’est pas revenu. Même règle sur Notes 0.1.13, Contacts 0.1.10, Agenda 0.1.15 et Drive 1.0.12. Sur le Nothing, ces quatre écrans s’ouvrent avec leurs données, sans bandeau.

Mail : répondre, répondre à tous, transférer, brouillon créé, rouvert et envoyé (reçu à 15:38). Les fils visibles de la réception sont à un message, donc pas de pastille de nombre. Mise à jour jamais forcée.

OTA canonical : `https://mail.hubera.cloud/updates.json` 1.0.20, `https://notes.hubera.cloud/updates.json` 0.1.13, `https://contacts.hubera.cloud/updates.json` 0.1.10, `https://calendar.hubera.cloud/updates.json` 0.1.15, `https://drive.hubera.cloud/updates.json` 1.0.12. `apkAvailable` true, `forceUpdate` false, `mandatory` false, APK magic `504b0304`.
