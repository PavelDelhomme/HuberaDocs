# Plan unique Hubera — 13 oct 2026

**Ce fichier est la seule source.** Lots 0–10 du 12 oct : **clos** (livrés). Les anciens plans Cursor / `docs/PLAN.md` méta : **remplacés**. On n’en crée plus d’autres.

Test réel Paul (13 oct, 206 grise essence, labo + compte). Rien n’est « déjà bon » sans re-test.

Contraintes inchangées : pas de `docker compose down -v`, OTA `forceUpdate: false` / `mandatory: false`, overlay Samsung + Blackview `-r`, **pas d’ADB Nothing**, Watchtower OFF, dual APK. Secrets jamais dans git/Docs/mail.

Modèle UX : **Google** (Gmail / Maps / Calendar / Keep / Drive) + chrome **Hubera Music** (OTA, compte, retour). Palette par app, même mécanique.

Ordre : **A (Maps / Fuel / OTA / retour)** → **B (notifs, contacts, partage)** → **C (chrome Google, Keep, Admin, Pass, Cook FR, DA)** → **D (perf ID)**. DA Contacts/Cook/Drive **après A**, pas avant les bugs jauge / voix / sombre / OTA.

```mermaid
flowchart TD
  a[A Bugs Maps Fuel OTA retour]
  b[B Notifs Contacts Partage]
  c[C Chrome Google Keep Admin Pass Cook DA]
  d[D Perf Hubera ID]
  a --> b
  b --> c
  a --> d
```

---

## A — Maintenant (Maps, Fuel, OTA, bouton retour)

### A1. Maps : mode sombre en guidage — **livré 0.1.94 overlay Samsung+BV**
HUD / tuiles / chrome restent sombres une fois l’itinéraire démarré (`body.nav.night`). Auto = thème système **ou** 21h–6h.

### A2. Maps : commandes vocales — **livré 0.1.94 overlay Samsung+BV**
TTS recréé au retour premier plan, file d’attente, AudioFocus (duck Music), réannonce de la manœuvre. Plus de `speak` silencieusement perdu si le moteur Android a été coupé.

### A3. Fuel : jauge vs litres saisis (206 grise) — **livré 1.4.173 overlay Samsung+BV**
« Plein jusqu’au bouchon » **décoché par défaut**. Jauge = reste + litres. Jamais 100 % sans confirmation. Cas réel : 50,12 € · ~20 L · 1,990 €/L ≠ plein.

### A4. Fuel : trajet arrêté mais notif encore là — **livré 1.4.173 overlay Samsung+BV**
`stopBackgroundTracking` arrête **toujours** le FGS (même si l’OS dit « pas démarré ») et retire la notif « Hubera Fuel — suivi en cours ».

### A5. Fuel : essence basse → trajets réguliers — **livré 1.4.173 overlay Samsung+BV**
Si jauge warn/critique : « Encore ~N allers-retours Domicile ↔ Travail » selon **cette** voiture, km réels du corridor, sinon haversine × 1,35.

### A6. Fuel : plein > capacité réservoir — **livré 1.4.173 overlay Samsung+BV**
Plus de plafond silencieux. Si litres (ou reste+litres) > capacité : valider **Corriger** / **Réajuster le réservoir** / (si les litres seuls rentrent) **Jauge = litres saisis**.

### A7. OTA unique type Music, partout — **code 13 oct (dialogue spinner + cache DL)**
Maps (et le reste) : **même popup** que Music (titre, notes, barre, **icône qui tourne**, Continuer / Télécharger), couleurs de l’app. Apps : Mail, Docs, Drive, Contacts, Pass, Jobs, Budget, Tasks, ID, Photos, Cook, Fuel, Notes, Office, Calendar, Maps, Music, Stream, CMS.

Téléchargement **en arrière-plan** : tuer le process ne relance pas un DL déjà commencé ; reprise du fichier cache.

### A8. Bouton retour ≠ quitter l’app — **code 13 oct (PopScope / moveTaskToBack)**
Cook (Paramètres), Calendar (Paramètres) et **toutes** les apps Hubera : Retour / Up → écran précédent ou accueil, **jamais** `finish()` de toute l’activité racine.

---

## B — Permissions, Contacts, partage, notifs

### B1. Mail — **code 13 oct**
Au démarrage : vérifier **notifications**. Demander **fichiers** seulement au besoin. **Contacts** (Hubera Contacts **et** carnet téléphone) pour afficher les **noms** plutôt que les seules adresses.

### B2. Maps ↔ Hubera Contacts — **pont SuiteBridge déjà live, re-vérifié**
Adresses enregistrées / suggestions : compte Hubera Contacts (déjà prévu, à re-vérifier). Pas une 2ᵉ base d’adresses.

### B3. Calendar — **code 13 oct (lieu Contacts, paramètres in-app)**
Notifs + contacts. Barre de recherche de **lieu** : propositions Maps (lieux enregistrés) **et** Contacts. Paramètres **dans Calendar**, pas ceux de Hubera ID.

### B4. Notes = Google Keep — **code 13 oct (FAB note / liste / rappel)**
Rappels sur note / liste → **notifications**. Bouton **+** : note, liste, rappel. Mobile **et** web. Analyser Keep (compte Google Paul) pour coller le comportement, pas inventer.

### B5. Jobs — **code 13 oct (import Hubera Contacts) ; mails métier à retester**
- Notifications à envoyer (candidatures, relances) : **in-app + FCM existent** dans le code ; **mail métier : à confirmer en test** (pas « déjà bon »).
- Liste **contacts professionnels** Jobs (propre).
- Pouvoir **récupérer / proposer** une fiche depuis Hubera Contacts, et **créer** un contact Hubera depuis un candidat.

### B6. Photos — **partage Android (Share.share) live**
Partage vers Contacts (et flux partage Android).

### B7. Drive — **code 13 oct (Hubera Contacts ou lien externe)**
Partager un fichier : personne **Hubera** (lien / droit) **ou** personne **externe** (lien). Rien de ça aujourd’hui dans l’app.

---

## C — Chrome type Google, Keep, Admin, Pass, Cook, DA

### C1. Calendar chrome — **code 13 oct (FAB, vues drawer, plus de bottom nav)**
Création d’événement = **FAB / menu FAB**, pas le bordel actuel. Vues (jour / semaine / mois / agenda) dans le **drawer**, **pas** une bottom nav. **Retirer** les autres apps Hubera du drawer Calendar.

### C2. Chip compte (toutes les apps) — **code 13 oct (popup réglages / ajouter / ID)**
Comme Gmail / Maps Google, en haut à droite :
- popup **plusieurs comptes** ;
- accès **paramètres de cette app** ;
- **ajouter un compte** ;
- Hubera ID = confidentialité / gestion du compte (Hub), pas les réglages Calendar/Drive/etc.

### C3. Pass — **code 13 oct (empreinte, PIN 6, mot de passe périodique)**
Déverrouillage coffre : **empreinte** si dispo, **code 6 chiffres** (web + extension). De temps en temps redemander le **mot de passe complet**.

### C4. Admin — tâches natives — **DocsCockpit natif (pas de WebView)**
La partie **tâches** d’Hubera Admin = **vrai code mobile** (comme le web Docs/kanban), **pas** un navigateur / WebView dans l’app. Les tâches projet restent dans **Hubera Docs** (`docs.hubera.cloud`) ; Admin les affiche en natif.

### C5. Cook FR — **code 13 oct (filtre French + ingrédients FR)**
Recettes / ingrédients : **traduire en français**. Illisible tel quel.

### C6. DA / kit commun — **tokens Cloudity existants ; pas de redraw Music/Maps/Fuel**
Contacts (actuel : illisible), Cook, Drive Paramètres, Calendar Paramètres : viser la **propreté Music / Fuel**. Socle graphique commun web+mobile **déjà demandé** — on l’applique ici, on ne redessine pas Music/Maps/Fuel tant que A n’est pas stable.

---

## D — Perf Hubera ID

Mail, Photos, Drive (et cousins) : chargement **trop long**. SSO Hubera ID : détecter le compte déjà connecté **sans** bloquer 10 s. Optimiser cold start + session.

**Code 13 oct** : `loadValidatedSession` saute la boucle gateway si le JWT d’accès n’expire pas dans 10 min (`ensureValidTokens` déjà skip réseau).

---

## Hors scope de ce plan (déjà noté, pas maintenant)

Hubera Hub produit « compte Google », Contacts type Google Contacts **en produit neuf**, Calendar invitations riches : **après A+B**. Mesh ADB 3 téléphones : quand ADB Nothing est de retour.

---

## Live de référence (13 oct soir)

| App | Version | Note |
|-----|---------|------|
| Maps | 0.1.94 vc 95 | Overlay Samsung+BV. A1 A2 livrés. |
| Music | 1.3.369 vc 10669 | OTA référence. Logo → apps. |
| Fuel | 1.4.173 vc 197 | Overlay Samsung+BV. A3–A6 livrés. |

OTA jamais forcée. Catalogue `hubera.cloud/updates.json` aligné.
