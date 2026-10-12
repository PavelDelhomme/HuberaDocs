# 12 oct 2026 — Suite lots : labo DA ouvrable + Photos web 4 onglets

OTA jamais forcée. Pas de `down -v`. Pas d’ADB Nothing. Pas de nouvel APK ce lot (web Docs + Photos).

## Fait

1. **Docs 0.2.12** — `GET /labo/labo-da-vague1.html` et `/labo/labo-da-vague2.html` (HTML brut, 200). Accueil Docs : liens Labo DA. Plus de capture par la SPA.
2. **Photos web** — barre Photos / Collections / Créer / Recherche (comme le mobile 1.0.12). Collections = tuiles Albums, partagés, appareil, lieux, archive, corbeille, verrouillé. Créer = import + nouvel album, paliers collage/GIF/vidéo notés, **sans** Veo/Remix. Recherche = filtre local nom, pas Gemini.

## Tests

| Check | Résultat |
|---|---|
| `https://docs.hubera.cloud/labo/labo-da-vague1.html` | **PASS** 200 HTML ~89 k |
| `…/labo/labo-da-vague2.html` | **PASS** 200 HTML ~68 k |
| Photos bundle live `Collections` / `Recherche` / `Créer` | **PASS** |
| Vitest PhotosPage | **21/21** |
| Drive `/health` JSON | **PASS** (inchangé) |

## Hors ce lot

Mock GPS physique Samsung, overlay APK, Moments/Personnes Photos, DA prod (tu coches d’abord les labos).
