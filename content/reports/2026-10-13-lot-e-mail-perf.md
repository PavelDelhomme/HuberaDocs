# 13 oct soir — Lot E : Mail lent, IMAP OVH, OTA, DA suite

Paul : Hubera Mail charge trop longtemps, OTA au démarrage, mot de passe IMAP à chaque action, compte OVH pas relié. Notes / Photos / Drive pas au niveau Music. Plan unique : `content/PLAN.md`.

Secrets **jamais** dans ce fichier ni dans le mail.

## Causes Mail (vérifiées live + code)

1. Prefs + OTA au 1er frame (déjà corrigé E1 : OTA ≥ 20 s).
2. Sync IMAP **séquentielle de toutes les boîtes** à chaque tap / refresh — timeout **45 s** par boîte sans secret.
3. POST sync envoyait `password: ""` si aucun mdp → IMAP tentait un login vide.
4. `paul@delhomme.ovh` : `imap_auth_ready=false`. Le mot de passe **NIC Manager** et le mot de passe **Hubera ID** sont **refusés** par IMAP OVH. Ce n’est pas le mot de passe de la boîte.

## Live IMAP (seed serveur, pas d’APK)

| Boîte | `imap_auth_ready` |
|---|---|
| candidatures@delhomme.ovh | true |
| paul@delhomme.ovh | false — identifiants refusés |
| dev@delhomme.ovh | false — mot de passe requis |

**Paul, une fois** : OVH Manager → E-mails → `paul@delhomme.ovh` → coller le mot de passe IMAP dans Mail (bandeau). Ensuite chiffré serveur, plus de resaisie.

## Correctifs code (13 oct soir)

- Mail **1.0.6** : skip sync des boîtes non prêtes, sync prêtes en parallèle, refresh = DB, FAB toujours actif, pas de spinner plein écran, dual `legacyAppId`.
- Photos **1.0.13** : cache timeline locale, Workmanager après 1er frame.
- Notes **0.1.7** : FAB Keep (note / liste / rappel) + dual APK.
- Drive **1.0.7** : accueil sans vider la liste.
- Calendar **0.1.8** : même chrome.

## Overlay E6

Dual APK + `-r` Samsung `R5CT7263YJL` + Blackview `EEA9700PRO0014587`. **Pas d’ADB Nothing.** OTA `forceUpdate: false`.

Tâches kanban : E1–E6.
