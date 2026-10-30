# Music — roadmap cache + heal (30 oct 2026)

Aligné avec l’audit Copilot / architecture déjà dans le dépôt.

## Objectif

Pas « tout YouTube instantané ». Objectif réel :

**catalogue YouTube + cache local (.m4a) + health auto + remplacement auto = lecture quasi instantanée.**

## Déjà en place

| Brique | Fichier | Rôle |
|--------|---------|------|
| Health biblio | `libraryHealth.ts` | ok / pending / dead / replaced |
| Auto-heal | `streamHeal.ts` | stall, prefetch_miss, load_skip, 5xx → re-warm + replace |
| Digest | `playbackDigest.ts` | mails titres qui cassent |
| Remplacement | `trackReplacement.ts` | ID mort → autre vidéo (soft Extended→original depuis 1.3.403) |
| Ensure disque | `ensurePlayable.ts` | .m4a local avant écoute |
| Prefetch mobile | `StreamPrefetcher.kt` | warm + têtes Exo |

## Progressive (1.3.404)

1. **Préfixe chaud** : 2 suivants (têtes), pas 1 seul — jamais 6–8 fichiers entiers pendant l’écoute.
2. **Preflight serveur** : fenêtre 3 titres ; .m4a complets ×2 au repos, 0 pendant lecture.
3. **Rekkt / Laisse Nous Raver** (1.3.403) : Extended/Radio timeout → original `PcpOcHlHiog`.

## Suite (pas ce sprint)

- Indicateur UI « cache chaud / froid » (Compte ou Now Playing).
- CDN / proxy résidentiel sticky (tâche Docs déjà ouverte).
- Package hors-ligne commun Hubera ID (file + sync) — backlog suite.

## Règle produit

Lecture prioritaire depuis le **cache disque** ; YouTube = résolution + téléchargement en fond ; skip sec seulement si ensure + replace ont échoué.
