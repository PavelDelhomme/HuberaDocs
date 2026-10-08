# Sélecteur de compte Hubera ID (Android)

Un login dans **une** app Hubera doit apparaître dans les autres : « Continuer avec [e-mail] », sans ressaisir le mot de passe quand le jeton est encore bon.

## Architecture

Deux couches, même signature APK (clé labo) :

1. **ContentProvider** `content://${applicationId}.hubera.id/accounts`  
   Permission signature `cloud.hubera.permission.READ_ID_ACCOUNT` / `WRITE_ID_ACCOUNT`.  
   Chaque app a sa copie chiffrée ; au login on **propage** vers tous les peers installés (comme le broker Cloudity Mail/Drive).
2. **AccountManager** type `cloud.hubera.id`  
   Visible dans Paramètres Android → Comptes. Authenticator dans le module `android-sso` (premier APK installé gagne le bind système).

Le broker Cloudity (`*.cloudity.auth`) **lit et écrit** aussi `*.hubera.id` : Mail/Drive/Pass/Photos/Calendar/Contacts/Notes/Cook voient Music/ID et inversement.

Les JWT ne sont **pas** interchangeables (Music HS256 ≠ Hubera ID EdDSA).  
- Même issuer : on reprend access + refresh.  
- Cross-issuer : `POST /api/auth/login/hubera-sso` (Music, Fuel, Jobs) et Docs `POST /api/auth/login/sso` valident le Bearer chez Hubera ID, puis n’ouvrent le compte **que s’il existe déjà**. Docs refuse hors allowlist Paul.

Ne **jamais** écrire `paul@delhomme.ovh` en dur sur le Nothing. Overlay `-r` Samsung seulement. OTA `forceUpdate: false` / `mandatory: false`. **Jamais overlay ADB Nothing** — Docs cockpit Nothing = OTA uniquement.

## Module

Canonique : `HuberaID/android-sso` (`cloud.hubera.id.sso.HuberaIdAccounts`).

```kotlin
HuberaIdAccounts.listAccounts(context) // picker
HuberaIdAccounts.saveSession(context, email, access, refresh, issuer = "music")
HuberaIdAccounts.clearAccount(context, email)
```

## Apps — picker réel vs documenté

| App | Picker UI | Overlay Samsung ce lot | Notes |
|---|---|---|---|
| **Hubera ID** `cloud.hubera.id` | oui | déjà 0.1.2 | authenticator |
| **Music** | oui | déjà 1.3.358 | `hubera-sso` API |
| **Docs cockpit** `cloud.hubera.docs` | oui (Flutter WebView + Compose natif 0.2.2) | Compose à overlay | Nothing = OTA only |
| **Maps** | adopt + `HuberaSuite.huberaEmails()` | 0.1.81 (SSO hors UI) | pas d’écran login dédié ; Nothing = APK directe |
| **Fuel** | oui | 1.4.168 | `hubera-sso` API |
| **Jobs** | oui | 1.0.59 | `hubera-sso` auth-service |
| **Mail / Drive / Pass / Photos / Calendar / Contacts / Notes / Cook** | oui (CloudityLoginScreen) | Photos si rebuild | broker lit `*.hubera.id` ; rebuild APK pour voir Music |
| **Office Row** `cloud.hubera.row` | oui (shell) | 0.1.1 | pas un clone Excel |
| **Office Docs édition** `cloud.hubera.office.docs` | oui (shell) | 0.1.1 | ≠ Docs cockpit |
| **Office Slides** `cloud.hubera.slides` | oui (shell) | 0.1.1 | pas un clone PPT |
| **Budget / Stream / CMS** | **documenté seulement** | — | pas de client Android |
| **products/cook** web | documenté | — | le picker Cook = app Cloudity `cloud.hubera.cook` |

## Hook (apps encore sans APK)

1. Dépendre de `:hubera-id-sso` (ou copier les sources + `security-crypto` + manifeste provider).
2. `<queries>` packages + authorities `*.hubera.id` (Android 11+ sinon liste vide).
3. Écran login : `listAccounts()` → « Continuer avec … » + « Utiliser un autre compte ».
4. Après mot de passe : `saveSession(..., issuer = "…")`.
5. Ne jamais injecter un e-mail en dur.

Budget (`cloud.hubera.budget`), Stream (`cloud.hubera.stream`), CMS (`cloud.hubera.cms`) : packages réservés, login ID à brancher dès qu’il y a un client Android.

## Tests 8 oct 2026 — Samsung `R5CT7263YJL` overlay `-r`

Nothing non connecté, **aucun overlay Nothing**. OTA `forceUpdate: false`. Watchtower Music OFF. Pas de `down -v`.

| APK | version | SHA-256 |
|---|---|---|
| Maps `cloud.hubera.maps` | 0.1.78 vc 79 | `6c594e9258a7532c34133e916468502e31f371829127b6397441db4aed241524` |
| Maps `ovh.delhomme.maps` | 0.1.78 vc 79 | `1bdadd0f4564ca1b94869189d9e000db5bb99c56e2d4d034396f11e039b17358` |
| Docs cockpit | p+0.2.2 vc 202 | `de74636934e243b938b25e586975af1930eb9d19beb7bca27c5e68adcdbb7a40` |
| Jobs | 1.0.59 vc 59 | `2175ec39ed2c8901164e6c69c42f09dad84554d2ef8257ce1d66f4df12273ae5` |
| Fuel | 1.4.168 vc 192 | `1b5f67008a095d8796b3478dd7c0c23803effe52dbf86fc72df2e1010023193c` |
| Office Row | 0.1.1 vc 101 | `241ce3db992ebed32d2ef241cac12fa06d462c105dba9036df3c88d40fe9f726` |
| Office Docs édition | 0.1.1 vc 101 | `f306a78a44ae10cc1b4b1e9d8f9b28c7d20fb1f4c459ba35e213946a57462360` |
| Office Slides | 0.1.1 vc 101 | `cfdc8ea3b498f71876511e6bcb5fdd4299bbc21bdbfdfcb13872a9c7f2665978` |

Fuel est signé avec la clé Expo (pas le debug labo Music/Maps). Le mesh ContentProvider signature avec Music n’est donc pas possible tant que Fuel n’est pas resigné labo ; le picker Fuel liste les comptes Fuel + peers même clé.

Mail/Drive/Pass/Photos/Calendar/Contacts/Notes/Cook : picker déjà dans `CloudityLoginScreen` ; rebuild APK (même clé labo) pour voir Music/ID via `*.hubera.id`.
