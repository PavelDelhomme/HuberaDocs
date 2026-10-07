# Hubera Pass

Coffre chiffré (Argon2id + XChaCha20). Extension navigateur déjà autofill au clic.

## 7 oct 2026

Service **Autofill Android** (champs login type Bitwarden) : `PassAutofillService` + cache mémoire 5 min après ouverture d’un coffre. Paramètres Android → Remplissage auto → Hubera Pass.

APK debug **0.1.2** overlay Samsung 7 oct (`cloud.hubera.pass` + `PassAutofillService`). À activer : Paramètres Android → Remplissage automatique → Hubera Pass. Nothing non touché.

Master key jamais écrite sur disque. Cache autofill vidé au cadenas explicite.
