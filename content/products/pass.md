# Hubera Pass

Coffre chiffré (Argon2id + XChaCha20). Extension navigateur déjà autofill au clic.

## 17 oct 2026 — 0.1.10

Mobile `cloud.hubera.pass` **0.1.10** / code **11**. Premier lancement : création du mot de passe maître seule. Ensuite un PIN à 6 chiffres, puis l’empreinte (ou le code d’appareil s’il n’y a pas d’empreinte). Le PIN et l’empreinte rouvrent le coffre ; ils ne remplacent pas le maître. Android authentifie l’empreinte, Pass ne la stocke pas. Les réglages ne montrent que le coffre : plus de lien web, plus de liste des autres apps. Bouton « Chercher une mise à jour » en plus de la détection automatique : proposée, jamais forcée, message clair s’il n’y a rien de plus récent. OTA `https://pass.hubera.cloud/updates.json` : `apkAvailable` true, `forceUpdate` false, `mandatory` false. Rapport `content/reports/2026-10-17-pass-0.1.10.md`.

## 17 oct 2026 — 0.1.9

Mobile `cloud.hubera.pass` **0.1.9** / code **10**. Le compte Hubera ID déjà sur l’appareil est ouvert (fournisseur de contenu, hors du fil UI). L’empreinte déverrouille via BiometricPrompt ; sans empreinte, le code d’appareil reste possible. OTA `https://pass.hubera.cloud/updates.json` : `apkAvailable` true, `forceUpdate` false, `mandatory` false. Rapport `content/reports/2026-10-17-pass-0.1.9.md`.

## 7 oct 2026

Service **Autofill Android** (champs login type Bitwarden) : `PassAutofillService` + cache mémoire 5 min après ouverture d’un coffre. Paramètres Android → Remplissage auto → Hubera Pass.

APK debug **0.1.2** overlay Samsung 7 oct (`cloud.hubera.pass` + `PassAutofillService`). À activer : Paramètres Android → Remplissage automatique → Hubera Pass. Nothing non touché.

Master key jamais écrite sur disque. Cache autofill vidé au cadenas explicite.
