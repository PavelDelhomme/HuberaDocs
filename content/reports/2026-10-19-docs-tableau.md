# Docs 0.2.31 — tableau des tâches (19 oct)

Le filtre du tableau ne montrait dans une colonne que les cartes sans parent. Une sous-tâche, ou une sous-sous-tâche, disparaissait de À faire dès que son parent était ailleurs, par exemple déjà en Fait.

Chaque tâche est de nouveau dans la colonne de son état. Si le parent est dans la même colonne, la carte est groupée dessous. Sinon elle reste visible dans sa colonne, avec la mention du parent. Ouvrir une carte montre ses sous-tâches et permet d’en ajouter. Priorité 1 à 5, créé le, modifié le, cible API / web / mobile, lanceur Hubera Docs.

Les 200 tâches déjà présentes sont restées. Une tâche priorité 4 a été ajoutée (tests de toute la suite, non traitée). Le flux Jobs `updates.json`, déjà en JSON avec le paquet canonique en premier et une mise à jour non forcée, est passé en Fait après vérification. Total 201. Répartition lue ensuite : 71 À faire, 1 En cours, 115 Fait, 14 Plus tard. Le placement du tableau retrouve ces quatre comptes, sans carte manquante.

Tests du tableau : une tâche à faire apparaît dans À faire, une sous-tâche et une sous-sous-tâche aussi, une faite ne masque pas les autres, créer une sous-tâche la montre. Node 5/5, test Android du même placement réussi.

OTA `GET /api/version?clientVersion=0.2.30&clientVersionCode=230&clientPackage=cloud.hubera.docs` : version 0.2.31, code 231, `apkAvailable` true, `forceUpdate` false, `mandatory` false. Un client déjà en 0.2.31 / 231 voit `apkAvailable` false. Legacy à la même version. Magic `504b0304` sur les deux fichiers du volume. `https://docs.hubera.cloud/updates.json` annonce `cloud.hubera.docs` en premier. Conteneur `hubera-docs` inchangé (`docker cp` + restart, pas de `down -v`).

Samsung `R5CT7263YJL` : `cloud.hubera.docs` puis `ovh.delhomme.hubera.docs`, **0.2.31** (code 231), `adb install -r`. Blackview `EEA9700PRO0014587` et Nothing : paquet canonique **0.2.31**. Le paquet legacy n’était pas installé sur ces deux-là. Nothing : écran Docs, pas d’appel, lecture en pause, pas de `pm clear`.
