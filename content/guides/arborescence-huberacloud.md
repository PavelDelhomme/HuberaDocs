# Arborescence HuberaCloud

Guide de navigation du dépôt **meta** `Hubera` (workspace Cursor `HuberaCloud`, lien symbolique vers le même arbre). Ce document décrit les six piliers demandés pour le Lot 0 — sans remplacer la doc produit détaillée, qui vit dans **Hubera Docs**.

## Vue d’ensemble

| Dossier | Rôle |
|---------|------|
| [`apps/`](#apps) | Vitrine holding et reliquats ops — **pas** le code des apps utilisateur |
| [`products/`](#products) | Un lien ou dossier = **un produit Git** (code réel, souvent repo séparé) |
| [`packages/`](#packages) | Chrome partagé (barre, tiroir, waffle) pour mobile |
| [`platform/`](#platform) | Contrats, identité, OTA, tokens — couche transverse |
| [`kits/`](#kits) | Usines / labos (AllInOne, backoffice, mail) |
| [`docs/`](#docs-racine-legacy) | Notes meta **périmées** — ne pas y ajouter de contenu canonique |

À la racine du meta-repo existent aussi `scripts/`, `updates/`, `catalog.json`, `Makefile`, etc. : orchestration déploiement et catalogue OTA, pas des produits.

Documentation **canonique** : repo [`PavelDelhomme/HuberaDocs`](https://github.com/PavelDelhomme/HuberaDocs), monté ici sous `products/docs` → contenu éditorial dans `products/docs/content/`. Application : [docs.hubera.cloud](https://docs.hubera.cloud) (auth Hubera ID, allowlist Paul).

---

## `apps/`

**Ce n’est pas le catalogue des applications Hubera.** Les apps Mail, Music, Drive, etc. vivent sous `products/`.

| Enfant | Contenu (niveau 1) |
|--------|---------------------|
| `www/` | Vitrine `hubera.cloud` : `public/`, `landings.json`, `products.json`, nginx/Docker, scripts de génération, flux **`/updates/*.json`** (catalogue OTA côté holding) |
| `admin/` | Reliquat vide / placeholder — l’administration CMS opérationnelle passe par **HuberaPress** (`products/cms` + runtime) |
| *(fichier)* | PDF d’étude Fuel×Maps (sept. 2026) |

### `apps/www` en détail

- **Marketing / landings** : pages statiques ou générées pour présenter l’écosystème.
- **Catalogue OTA** : JSON publics alignés sur les versions servies par chaque API produit — ce n’est **pas** l’APK ni le backend Music/Mail/etc.
- **Lien miroir** : `products/www` → `../apps/www` pour que le catalogue `products/` reste complet.

### `apps/admin`

Ops historiques ; ne pas confondre avec le cockpit **Hubera Docs** ni HuberaPress.

---

## `products/`

**Source de vérité du code applicatif.** Chaque entrée est en général un **lien symbolique** vers un dépôt Git voisin (`../../YTMusic`, `../../HuberaMail`, …). Exceptions : dossiers réellement versionnés dans le meta (ex. `cook/`).

### Enfants (niveau 1)

| Lien / dossier | Cible locale typique | Produit |
|----------------|----------------------|---------|
| `budget` | `BudgetAi` | Hubera Budget |
| `calendar` | `HuberaCalendar` | Hubera Calendar |
| `cloudity` | `Cloudity/Cloudity` | Archive kernel / historique — **ne pas** traiter comme Mail ou Drive live |
| `cms` | `HuberaWordPress` | HuberaPress |
| `contacts` | `HuberaContacts` | Hubera Contacts |
| `cook` | *(dans meta)* | Legacy Cook |
| `docs` | `HuberaDocs` | Hubera Docs (cockpit + ce contenu) |
| `drive` | `HuberaDrive` | Hubera Drive |
| `fuel` | `GasoilTracking` | Hubera Fuel |
| `id` | `HuberaID` | Hubera ID |
| `jobs` | `JobbingTrack` | Hubera Jobs |
| `mail` | `HuberaMail` | Hubera Mail |
| `maps` | `Maps` | Hubera Maps |
| `music` | `YTMusic` | Hubera Music |
| `notes` | `HuberaNotes` | Hubera Notes |
| `office` | `HuberaOffice` | Hubera Office |
| `pass` | `HuberaPass` | Hubera Pass |
| `photos` | `HuberaPhotos` | Hubera Photos |
| `stream` | `StreamMake` | Hubera Stream |
| `taskflow` | `taskflow/taskflow` | Hubera Tasks |
| `vtcbuilder` | `VTCBuilder` | VTC métier chauffeurs |
| `www` | `../apps/www` | Miroir vitrine |

Fichiers meta : `README.md`, `DOCS.md` (pointeur vers Hubera Docs).

### Double copie : meta Hubera vs repo produit

1. **Dépôt produit** (ex. `YTMusic/`) : historique Git, CI, releases, volumes Docker nommés d’après l’ancien nom (`ytmusic_ytmusic_data`, `gasoil_api_data`, …). **Ne pas renommer** les dossiers locaux ni fusionner les repos sans plan de migration.
2. **Hubera meta** : agrège les liens, workspace multi-root, règles Cursor, `catalog.json`, scripts de déploiement transverses.

Travailler le code **dans le repo produit** ; commiter la doc canonique **dans HuberaDocs** (`products/docs/content/`). Les `NOTES.md` / `STATUS.md` à la racine meta ou dans un produit doivent **renvoyer** vers Docs plutôt que dupliquer des rapports longs.

---

## `packages/`

Bibliothèques **chrome** réutilisables (pattern Google-like documenté dans `content/guides/hubera-chrome-google-like.md`).

| Enfant | Rôle |
|--------|------|
| `hubera-chrome-android` | Compose / Android — `HuberaScaffold`, tiroir app, compte |
| `hubera-chrome-flutter` | Flutter — scaffold partagé avec apps Cloudity/Drive/etc. |

Copié ou dépendance path selon l’app ; objectif : hamburger = **navigation de l’app courante** ; droite = notifications, waffle 9 points (suite Hubera), puce compte.

---

## `platform/`

Couche **identité et contrats**, indépendante de Cloudity comme « propriétaire ».

| Enfant | Rôle |
|--------|------|
| `app-contract/` | Manifeste commun apps (`users` / `data` / greenfield) |
| `design-tokens/` | Tokens CSS/JSON (`@hubera/design-tokens`) |
| `identity-sdk/` | Lien vers SDK SSO (extraction Cloudity en cours) |
| `mobile_ota_installer/` | Installation / flux OTA mobile |
| `mobile_update/` | Logique mise à jour (modèle Music : jamais forcé) |
| `ops/` | Scripts ops plateforme |
| `theme/` | Lien `@allinone/theme` — évolution vers `@hubera/theme` |

Règle OTA : bump `VERSION` API ↔ publication APK dual (`cloud.hubera.*` + legacy) sur la **même** version.

---

## `kits/`

**Usines** et labos, pas des produits finaux utilisateur.

| Enfant | Rôle |
|--------|------|
| `allinone` | `AllInOne` — monorepo outillage / thème |
| `backoffice-lab` | Kit backoffice Jobs |
| `mail` | Labo / stack mail expérimental |

Voir `kits/README.md` pour le détail des stacks Portainer associées.

---

## `docs/` (racine, legacy)

Dossier **à la racine de Hubera**, distinct de `products/docs` :

| Enfant / fichier | État |
|------------------|------|
| `ARCHITECTURE.md`, `DEPLOY.md`, `PLAN*.md`, `REGLES-ZERO-PERTE.md` | Plans meta sept.–oct. 2026 — **stale** si non recopiés dans Hubera Docs |
| `reports/` | Anciens rapports meta |
| `tests/` | Tests transverses meta |

**Ne pas** y ajouter de nouvelle doc produit. Porter vers `products/docs/content/guides/`, `content/products/`, `content/reports/`.

---

## Schéma mental

```text
hubera.cloud (apps/www)          → marketing + JSON OTA catalogue
music.hubera.cloud (products/music → YTMusic) → API + APK + données
packages/hubera-chrome-*         → UI commune mobile
platform/*                       → ID, tokens, OTA installer
docs.hubera.cloud (products/docs → HuberaDocs/content) → cockpit Paul
```

## Liens utiles

- Chrome Google-like : [`hubera-chrome-google-like.md`](hubera-chrome-google-like.md)
- Stacks Portainer : [`portainer-stacks.md`](portainer-stacks.md)
- Labo DA vague 1 : [`../design/labo-da-vague1.html`](../design/labo-da-vague1.html)

---

*Lot 0 — 12 oct. 2026. Maintenu dans Hubera Docs ; le dossier `HuberaCloud/docs/` reste un miroir historique.*
