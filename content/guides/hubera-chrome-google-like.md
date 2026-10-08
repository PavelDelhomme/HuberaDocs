# Chrome Google-like — suite mobile Hubera

Ticket kanban : **chrome Google-like** (squelette commun, identité par produit).

## Pattern

- Tiroir (hamburger) en haut à gauche : suite Hubera + Compte + version OTA
- Bouton compte en haut à droite (Hubera ID / avatar)
- Navigation bas 3–5 destinations propres à l’app
- Barre du haut avec titre (pas un vide)
- Recherche seulement si ça a du sens (Music, Mail, Docs) — pas sur la carte Maps
- Teal `#0E4D5C` / orange `#C9782A` (charte Docs)

## Module partagé

- Compose : `packages/hubera-chrome-android` (`HuberaScaffold`) — copié dans Music et Docs
- Flutter : `packages/hubera-chrome-flutter` + `cloudity_shared` (`HuberaScaffold`, `SuiteDrawerScaffold`)

## État par app (8 oct 2026)

| App | Chrome | Overlay Samsung | Notes |
|---|---|---|---|
| Music | fait | Samsung `-r` 1.3.360 | home / biblio / search |
| Maps | fait | Samsung `-r` 0.1.81 | carte / trajet / lieux — pas de search native |
| Fuel | fait (source) | APK Expo non rebuild | trajet / véhicules / stats — téléphone encore 1.4.168 |
| Docs | fait | Samsung `-r` 0.2.4 | Accueil / Tâches / Docs / Rapports · OTA launch |
| Calendar | fait | Samsung `-r` 0.1.6 | mois / semaine / jour / agenda |
| Mail | fait | Samsung `-r` 1.0.5 | boîte / envoyés / brouillons + search |
| Pass | fait | Samsung `-r` 0.1.3 | coffres / recherche / compte |
| Jobs | fait | Samsung `-r` 1.0.60 | accueil / candidatures / calendrier / profil |
| ID | fait | Samsung `-r` 0.1.3 | compte / apps / version |
| **Drive** | **exclu** (autre agent) | intact 1.0.6 | ne pas merger ici |

P1 restant : Contacts, Cook, Photos, Notes, Stream, CMS, Budget, Office.

OTA `forceUpdate: false` / `mandatory: false`. Overlay Samsung `-r` seulement. Jamais Nothing.
