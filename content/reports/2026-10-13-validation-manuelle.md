# 13 oct 2026 — Tests manuels à cocher (mise à jour)

Tu coches dans Hubera Docs : carte en **Fait** si le geste est bon, **À faire** sinon. Rien ci-dessous n’est déjà validé.

## Mail — lenteur Nothing (code, pas encore sur le téléphone)

Au second lancement, la dernière liste s’affiche sans attendre IMAP ni le réseau. La synchro IMAP part 8 secondes après l’ouverture, plus toutes les 25 secondes, sans remplacer la liste par un spinner. Le premier lancement (cache vide) attend encore le réseau. Pas d’overlay Nothing (pas d’ADB). APK Samsung / Blackview pas reconstruite dans ce lot : à recompiler avant de cocher la vitesse.

Gestes Mail à faire sur le Nothing, puis Samsung et Blackview :

- Deuxième ouverture : la liste de la fois d’avant est là tout de suite.
- Changer de dossier : l’ancienne liste reste visible pendant le chargement, pas d’écran vide.
- Tirer pour rafraîchir : la liste ne disparaît pas.
- Ouvrir un mail, revenir : pas de rechargement de toute l’app.
- Mot de passe IMAP demandé une seule fois.
- Envoi hors-ligne : un seul mail au retour du réseau.
- Nom du contact à la place de l’adresse seule.

## Versions vues le 13 oct (ADB, pas un test métier)

| App | Samsung | Blackview |
|-----|---------|-----------|
| Music | 10669 | 10669 |
| Maps | 95 | 95 |
| Fuel | 197 | 197 |
| Notes | 7 | 7 |
| Photos | 13 | 13 |
| Tasks | 5 | 5 |
| Contacts | 5 | 5 |
| Mail | 6 | 5 |
| Drive | 7 | 5 |
| Pass | 5 | 3 |
| Calendar | 8 | 5 |
| Cook | 5 | 4 |
| Docs | 210 | 209 |
| Jobs | 60 | 58 |
| ID | 103 | absent |
| Office | 101 | absent |
| Stream | absent | absent |

Blackview à aligner avant de cocher : Mail, Drive, Pass, Calendar, Cook, Docs, Jobs. Installer ID, Office, Stream. Overlay `-r`. OTA jamais forcée. Pas d’ADB Nothing.

## Grille commune (chaque app)

Compte : ouvrir sans compte, se connecter, ajouter un deuxième compte, basculer, déconnecter un seul compte. Jeton expiré : l’écran précédent reste lisible.

Démarrage : liste ou accueil déjà connu tout de suite. Tuer l’app et rouvrir : les données locales sont là.

OTA : popup avec Plus tard, pas de mise à jour forcée, pas une APK plus vieille que le téléphone.

Retour : écran précédent, ou accueil. À la racine, l’app passe derrière, elle ne se ferme pas.

Hors-ligne : lecture de ce qui est déjà là, écriture en file, au retour du réseau pas de doublon.

Permission refusée : demandée au geste, pas au premier écran. Refus = message, pas une boucle.

Liste vide, un élément, beaucoup d’éléments. Titre très long, emoji, champ vide.

## Music

Lecture, pause, suivant, précédent, file, reprise après kill. Titre déjà écouté en mode avion. Titre pas en cache : message clair. Notification écran verrouillé. Casque débranché. Guidage Maps baisse le volume. Chip compte. Logo vers les autres apps. OTA Plus tard.

## Maps

Recherche, itinéraire, démarrer le guidage, l’arrêter. Guidage sombre (carte et boutons). Voix au retour dans l’app, la manœuvre est répétée. Music baisse pendant la voix. Adresse prise dans Contacts. GPS refusé. Perte de signal en guidage. Retour ne quitte pas l’app et ne coupe pas le guidage par erreur. Tuiles déjà là hors-ligne.

## Fuel (206 grise)

Plein 50,12 €, environ 20 L, 1,990 €/L : la jauge n’est pas à 100 %. « Plein jusqu’au bouchon » est décoché. Litres au-dessus de la capacité : Corriger, Réajuster le réservoir, ou Jauge = litres saisis. Arrêt du trajet : la notification « suivi en cours » part. Essence basse : encore N allers-retours Domicile ↔ Travail. Prix à 0 et litres à 0 : message, pas un crash. Plein saisi hors-ligne : une seule fois au retour.

## Drive

Liste précédente tout de suite. Dossier, envoi, téléchargement, renommage, suppression, corbeille. Partage à une personne Hubera ou lien externe, puis révocation du lien. Envoi coupé au milieu : reprise sans doublon. Gros fichier : progression et annulation. Permission fichiers refusée.

## Calendar

Création par le bouton +, pas une barre du bas. Vues jour, semaine, mois, agenda dans le menu latéral. Lieu proposé par Maps et par Contacts. Rappel qui notifie. Réglages dans Calendar, pas dans Hubera ID. Journée vide. Événement à cheval sur minuit. Journée entière.

## Photos

Timeline tout de suite. Import d’une photo, de plusieurs, annulation au milieu. Album : ajouter, retirer, supprimer l’album. Corbeille : restaurer, supprimer. Partage Android annulé. Recherche par nom, aucun résultat. Permission refusée : bouton vers les réglages.

## Tasks

Créer, cocher, réordonner, échéance aujourd’hui et échéance passée. Rappel à une minute : notification réelle. Cocher hors-ligne puis sur l’autre appareil : un seul état. Filtre « faites » vide. Supprimer.

## Jobs

Notification de candidature ou de relance. Liste de contacts pro. Importer une fiche Hubera Contacts. Créer un contact Hubera depuis un candidat. Mail métier : le noter seulement si tu l’as vu partir.

## Notes

Bouton + : note, liste, rappel. Rappel à une minute. Recherche titre et corps. Épingler, archiver, corbeille, restaurer. Liste : cocher, item vide. Deux téléphones, même note. Brouillon gardé si l’app est tuée dans l’éditeur.

## Office

Nouveau document, ouvrir, enregistrer, renommer. Quitter sans enregistrer : confirmation. Export. Coupure réseau : un seul brouillon. Fichier inconnu : message, pas un crash. Absent du Blackview tant qu’il n’est pas installé.

## Pass

Empreinte si le capteur existe, sinon code 6 chiffres. Mauvais code cinq fois, puis le bon. De temps en temps le mot de passe complet, le coffre reste fermé tant qu’il n’est pas saisi. Créer, modifier, supprimer une entrée. Copier le mot de passe : pas dans une notification. Coffre fermé quand l’écran se verrouille. Mauvais mot de passe maître : le coffre n’est pas vidé.

## ID

Connexion, passkey, ajout d’un compte, révocation d’une session. Les réglages de Mail, Calendar ou Drive ne sont pas dans ID. Absent du Blackview tant qu’il n’est pas installé.

## Docs

Ouvrir le kanban, passer une carte de À faire à Fait, la remettre à À faire. Ouvrir ce rapport. Un retour d’usage crée une tâche.
