# 8 oct 2026 — Vagues E / F leftovers + Vague G OTA / chrome / ID

Rien overlayé (Nothing interdit, Samsung `R5CT7263YJL` laissé au worker Music). Pas de `down -v`. Pas de force-push. `forceUpdate: false` / `mandatory: false`. Pas d’APK Flutter debug publié.

## Vague E — Budget

| Check | Résultat |
|---|---|
| `https://budget.hubera.cloud/` HTTP | **200** |
| `/login` | **200**, écran Connexion (capture `captures/budget/web-login.png`) |
| `/api/health` | `{"ok":true,"service":"budgetai"}` |
| `/api/setup-needed` | `{"needed":true}` — base vide, premier compte via `/setup` |
| Créer / lister / purger `[TEST]` | **SKIP** : pas de token ni script creds dans le repo. Ne pas inventer d’identifiants (et ne pas prendre le slot `/setup`). |
| Enveloppes / catégories / totaux mois | **PASS code** : `POST/GET/DELETE /api/envelopes`, totaux UI = somme des plafonds du mode (`totalCap`). Purge compte = `DELETE /api/me` (auth). |
| APK Android | **aucun** (web only). Pas de rebuild debug. |

Stack Portainer `budgetai` intacte. Git `4f89a84`.

## Vague F — Stream

| Check | Résultat |
|---|---|
| `stream.hubera.cloud/app/` | **200**, Pluto TV + Arte.tv (filtres, cartes live) |
| API Pluto | **200**, 147 chaînes (ex. Pluto TV Classic TV FR) |
| API Arte | **200** EMAC v4 ; titres Arte.tv visibles. Miniatures CDN parfois 400/429 (rate-limit), titres OK |
| Torrents / magnets / DeviantArt sur le live | **PASS** : `/app/app.js` Pluto+Arte only. `/admin/torrents` = landing légale (pas l’UI torrent) |
| Code produit live (`web/app`) | **PASS** — « Pas de torrent, pas de miroir, pas de contournement DRM » |
| Leftover repo StreamMake | backend `internal/torrent` + admin Next.js + scripts encore dans le Git (non servi par nginx `/app/`) |
| Batterie ADB | **SKIP** (consigne : ne pas se battre avec Samsung) |

Git `28ae71a`. Captures : `captures/stream/web-pluto.png`, `web-arte.png`.

## Vague G — OTA / chrome / ID

Catalogue `https://hubera.cloud/updates.json` régénéré (`make updates-build`) puis **docker cp JSON only** dans `hubera-www` (vitrine HTML inchangée). Feed ID docker-cp’d dans `hubera-id` (`/updates.json`). Pas de Git-redeploy Portainer Docs (live 0.2.4 ≥ tag). Stacks `hubera-cms`, `hubera-cms-runtime`, `cloudity` **non stoppées**.

ID **0.1.3** (vc 103, `cloud.hubera.id`) : VERSION réelle, **pas d’APK OTA** (binaire local signé debug labo, même cert `3cf6c532…` que le labo, on ne le publie pas).

Music catalogue **1.3.359 → 1.3.361** (live `apk-info`, APK via `/install`, pas d’URL HTML). Pas un downgrade.

Jobs : API prod toujours **1.0.56** release (~60 Mo). Téléphone labo **1.0.60** = **debug** 152 Mo (`kernel_blob.bin`). Release local = **1.0.59** seulement. Feed laissé **honnête à 1.0.56**.

Photos volume canonical **1.0.9** mais APK live **162 Mo** → DEBUG (bannière). On ne remplace pas un release par du debug ; on ne rebuild pas.

Drive **1.0.6** release (~54 Mo, pas de `kernel_blob`, feed aligné). Mail/Cook/Tasks : release OTA < téléphone debug — feed inchangé.

## Tableau

| App | Live | OTA feed | apkAvailable | debug? | git SHA | PASS/FAIL | Notes |
|---|---|---|---|---|---|---|---|
| Budget | web `/login` 200 | 0.0.0 (pas d’APK) | false | n/a | `4f89a84` | **PASS** | Health OK. Créer `[TEST]` SKIP (pas de token, setup-needed). |
| Stream | `/app/` Pluto+Arte | 0.1.0 | false | n/a | `28ae71a` | **PASS** | Live légal. Leftover torrent dans le repo backend, pas dans `/app/`. |
| Docs | 0.2.4 | 0.2.4 | false | n/a | `667e847` | **PASS** | Pas de Git-redeploy Portainer. |
| Drive | 1.0.6 | 1.0.6 / canon 1.0.6 | true | **non** (54 Mo) | `6d25a47` | **PASS** | Release, chrome Google Drive. |
| Jobs | API 1.0.56 | 1.0.56 | true | téléphone 1.0.60 **debug** | `fde6fcc3` | **PASS** honnête | Pas d’APK release 1.0.60. |
| ID | 0.1.3 web+app | 0.1.3 | false | APK local debug-signé, **non publié** | `7d6ef42`+VERSION | **PASS** | Plus de 0.0.0. `forceUpdate: false`. |
| Mail | canon 1.0.4 | 1.0.3 / 1.0.4 | true | téléphone 1.0.5 debug | `7efc46a` | **PASS** honnête | Pas de rebuild debug. |
| Contacts | canon 0.1.3 | 0.1.2 / 0.1.3 | true | non (release overlayé plus tôt) | — | **PASS** | Chrome/ID login. |
| Photos | canon 1.0.9 | 1.0.5 / 1.0.9 | true | **oui** volume 162 Mo | — | **WARN** | Bannière DEBUG. Ne pas remplacer par un autre debug. |
| Notes | canon 0.1.5 | 0.1.4 / 0.1.5 | true | non | — | **PASS** | |
| Cook | canon 0.1.1 | 0.1.0 / 0.1.1 | true | téléphone 0.1.2 debug | — | **PASS** honnête | |
| Tasks | canon 0.1.3 | 0.1.2 / 0.1.3 | true | téléphone 0.1.4 debug | — | **PASS** honnête | |
| Office | 0.1.1 | 0.1.1 | true | non | — | **PASS** | |
| CMS / Press | landing 200 + press login 200 | 0.0.0 | false | n/a | `26a2260` | **PASS** | Runtime CMS + cloudity intacts. |
| Maps | 0.1.81 | 0.1.81 | true | non | `c522059` | **PASS** | Déjà live. |
| Pass | 0.1.4 | 0.1.4 | true | non | `01bf6b7` | **PASS** | |
| Fuel | 1.4.169 | 1.4.169 | true | non | `e898dd2` | **PASS** | `forceUpdate: false`. |
| Music | 1.3.361 | 1.3.361 | via `/install` | non | `d7f426a` | **PASS** | Catalogue aligné live, pas d’overlay Samsung. |
| Calendar | 0.1.7 | 0.1.7 | true | non | — | **PASS** | Déjà live. |

## Captures web

`content/reports/captures/<app>/web-*.png` — budget, stream (Pluto + Arte), cms, id, drive, docs, mail, contacts, photos, notes, cook, tasks, office, jobs.

## Non fait

- Overlay Nothing / Samsung
- Rebuild / publication APK debug (Jobs 1.0.60, Mail 1.0.5, Cook 0.1.2, Tasks 0.1.4, Photos)
- Création compte Budget
- Profil batterie ADB
- Git-redeploy Docs / CMS / cloudity
