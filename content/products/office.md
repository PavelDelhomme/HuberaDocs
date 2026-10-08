# Hubera Office

Domaine : `office.hubera.cloud`. **Pas** un clone Excel / Word / PowerPoint aujourd’hui.

Trois sous-apps Android (socle Hubera ID + picker « Continuer avec ») :

| Sous-app | Package | Rôle |
|---|---|---|
| **Row** | `cloud.hubera.row` | tableur (shell) |
| **Docs édition** | `cloud.hubera.office.docs` | traitement de texte — **distinct** du cockpit [Hubera Docs](./docs.md) (`cloud.hubera.docs`, `docs.hubera.cloud`) |
| **Slides** | `cloud.hubera.slides` | présentations (shell) |

Sources : `HuberaOffice/android/` (flavors Gradle). Login = Hubera ID. Kanban suite : moteur tableur / édition / diapos.

OTA `forceUpdate: false`. Overlay Samsung seulement, jamais Nothing.
