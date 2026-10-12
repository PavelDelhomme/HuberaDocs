# Design — Hubera Docs

Espace **charte et maquettes** pour valider la direction artistique avant refonte globale (cf. règle workspace : pas de refonte DA massive tant que Music / Maps / Fuel OTA+hors-ligne ne sont pas stables).

## Vague 1 (oct. 2026)

| Ressource | Description |
|-----------|-------------|
| [`labo-da-vague1.html`](labo-da-vague1.html) | Labo interactif **imprimable** : variantes A / B / C, clair / sombre, mocks web + mobile |

### Apps couvertes

Music, Fuel, Drive, Mail, Contacts, Maps, Photos.

### Variantes

| Id | Nom | Intent |
|----|-----|--------|
| **A** | Keep aéré | Teal `#0E4D5C`, orange `#C9782A`, respiration type Keep / Hubera actuel |
| **B** | Gmail dense | Listes denses, barres compactes, priorité à l’information |
| **C** | Maps plein écran | Contenu edge-to-edge, chrome flottant minimal |

Chaque vue propose une colonne **Avant** (description de l’existant), puis les trois rendus CSS. Cases **« vue validée »** persistées en `localStorage` sur le poste de revue.

### Chrome commun (cible)

- **Gauche** : hamburger → navigation **de l’app courante** (pas la grille suite dans le tiroir principal).
- **Droite** : cloche notifications · waffle 9 points (launcher apps Hubera) · puce avatar / compte Hubera ID.

Guide technique chrome : [`../guides/hubera-chrome-google-like.md`](../guides/hubera-chrome-google-like.md).

Tokens plateforme (import futur) : `platform/design-tokens/` dans le meta-repo Hubera.

## Usage

1. Ouvrir le HTML localement ou via docs.hubera.cloud (fichier statique servi avec le reste du contenu).
2. Choisir variante **A / B / C** et thème **clair / sombre** en tête de page.
3. Cocher les vues validées avant de figer une spec produit.
4. Imprimer ou « Enregistrer en PDF » pour archiver une revue (styles `@media print` inclus).

## Vague 2 (12 oct. 2026)

| Ressource | Description |
|-----------|-------------|
| [`labo-da-vague2.html`](labo-da-vague2.html) | Calendar, Pass, Jobs, Budget, Tasks, Stream, Office, Notes, Cook, Docs, Press, ID — A/B/C, clair/sombre |

Pas de remplacement UI prod tant que les cases « vue validée » ne sont pas cochées.

## Suite

- Unification `@hubera/theme` : hors scope tant que Music / Maps / Fuel OTA+hors-ligne restent le tronc.
- Vague 1 gel : tu coches dans le labo 1.
