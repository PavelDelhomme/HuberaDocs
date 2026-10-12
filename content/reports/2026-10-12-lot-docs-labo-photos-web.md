# 12 oct 2026 — Lot Docs labo DA + Photos 4 onglets (tests + labo)

OTA jamais forcée. Pas de `down -v`. Pas d’ADB Nothing. Pas de nouvel APK ce lot (web Docs + Photos ; mobile 1.0.12 déjà en barre 4 onglets).

## Fait

1. **Docs 0.2.12** — `GET /labo/labo-da-vague1.html` et `/labo/labo-da-vague2.html` (HTML brut, whitelist `isAllowedLaboFile`). Accueil Docs : liens Labo DA. Plus de capture par la SPA.
2. **Photos web** — barre Photos / Collections / Créer / Recherche. Collections = tuiles Albums, partagés, appareil, lieux, archive, corbeille, verrouillé. Créer = import + nouvel album, paliers collage/GIF/vidéo, **sans** Veo/Remix. Recherche = filtre local nom, pas Gemini.
3. **Contrat mobile** — `photos_nav.dart` (mêmes 4 labels + recherche locale nom/date/album). Timeline branchée dessus.

## Tests automatiques

| Suite | Résultat |
|---|---|
| Vitest PhotosPage + PhotosBottomNav | **26/26** |
| `node --test` `labo-files` (whitelist + path traversal) | **2/2** |
| Flutter `photos_nav_test.dart` | **2/2** |
| Albums / archive / corbeille / verrouillé (régression) | **PASS** dans les 26 Vitest |

## Prod

| Check | Résultat |
|---|---|
| `https://docs.hubera.cloud/labo/labo-da-vague1.html` | **PASS** 200 HTML ~89 k |
| `…/labo/labo-da-vague2.html` | **PASS** 200 HTML ~68 k |
| Photos bundle `PhotosPage-B9zgS2Qj.js` Collections / Recherche / Créer / Zéro Veo | **PASS** |
| Drive `/health` JSON | **PASS** |
| Music `/api/version` 1.3.368 `forceUpdate: false` | **PASS** |
| Maps 0.1.89 | **PASS** |

## Samsung `R5CT7263YJL` + Blackview `EEA9700PRO0014587`

| App | Samsung | Blackview |
|---|---|---|
| Photos 1.0.12 barre Photos / Collections / Créer / Rechercher | **PASS** (galerie appareil + cloud) | **PASS** (timeline cloud + 4 onglets parcourus) |
| Maps 0.1.89 tuiles, recherche, chips Fuel, pastille GPS | **PASS** | **PASS** |
| Music p+1.3.368 accueil / mix / mini-lecteur | **PASS** | **PASS** |

Compte labo Photos : session existante Blackview ; Samsung reconnecté via Hubera ID (passkey proposée, plus tard). Mot de passe **non** recopié ici.

## Hors ce lot (enchaîné ensuite)

Mock GPS physique `cmd location` (plus `adb emu geo`, inopérant sur téléphone). Overlay APK seulement si bump. Moments/Personnes Photos, DA prod (tu coches d’abord les labos).
