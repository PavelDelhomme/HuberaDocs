# Rapport — Lot 0 arborescence + DA vague 1

**Date :** 12 octobre 2026  
**Périmètre :** documentation structure HuberaCloud et premier catalogue de direction artistique (sans implémentation code produit).

## Livrables

| Fichier | Rôle |
|---------|------|
| `content/guides/arborescence-huberacloud.md` | Guide FR : `apps`, `products`, `packages`, `platform`, `kits`, `docs/` racine ; enfants niveau 1 ; double copie meta vs Git produit ; lien vers labo DA |
| `content/design/labo-da-vague1.html` | Labo interactif imprimable : 7 apps, mocks web + mobile, variantes A/B/C, clair/sombre, validation localStorage |
| `content/design/README.md` | Index design, description des variantes et chrome cible |

## Contenu labo DA

- **Apps :** Music, Fuel, Drive, Mail, Contacts, Maps, Photos.
- **Variantes :** A Keep aéré (`#0E4D5C` / `#C9782A`), B Gmail dense, C Maps plein écran.
- **Chrome :** hamburger = navigation app courante ; droite = notifications, waffle 9 points, avatar Hubera ID.
- **Vues :** connexion, écrans métier (inbox Mail, trajet Fuel, carte Maps, onglets Photos, etc.), compte — chaque bloc « Avant » décrit l’existant oct. 2026.

## Fiches produit mises à jour

Pointeurs courts vers le labo ajoutés dans `content/products/` pour **music**, **fuel**, **drive**, **maps** (pas de fiche `mail`, `contacts`, `photos` à cette date).

## Hors scope (volontaire)

- Aucune modification des repos produit, APK, stacks Portainer.
- Pas de refonte tokens `@hubera/theme` ni migration chrome Android/Flutter.
- Dossier `Hubera/docs/` racine non migré ligne à ligne (marqué stale dans le guide).

## Prochaines étapes suggérées

1. Revue Paul sur le HTML (cases « vue validée » + export PDF).
2. Créer fiches `mail.md`, `contacts.md`, `photos.md` si besoin, avec le même pointeur design.
3. Kanban Hubera Docs : tâches dérivées des vues non validées → specs par app.

---

*Lot 0 — agent HuberaCloud.*
