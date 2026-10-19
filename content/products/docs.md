# Hubera Docs

Cahier unique Paul. Web `https://docs.hubera.cloud` + app Android native Compose **et** le même cockpit dans **Hubera Admin** (plus une page web).

- Tableau : colonnes À faire, En cours, Fait. Chaque tâche, sous-tâche et sous-sous-tâche reste dans sa colonne, groupée sous son parent. On ouvre une carte, on voit ses sous-tâches, on peut en ajouter. Créé le et modifié le restent. Priorité 1 à 5. Cible API / web / mobile. Lanceur **Hubera Docs**. Live **0.2.31**.
- Retours : d’abord l’application, puis la cible API / web / mobile (ou une combinaison). Le choix est sur le retour et sur la tâche. Créé le à l’enregistrement, modifié le à chaque changement. Priorité 1 à 5.
- Auth Hubera ID, allowlist.
- Vues : dashboard → kanban (popup carte, FAB, colonnes) → docs → PDF/md du compte → Gantt → retours.
- Dual APK `cloud.hubera.docs` / `ovh.delhomme.hubera.docs`. Live **0.2.31** (code 231). OTA jamais forcée (`forceUpdate: false` / `mandatory: false`). Overlay Samsung, Blackview et Nothing le 19 oct.
- Chrome type Music : hamburger, header compact, compte haut droite, nav bas Accueil · Tâches · Docs · Rapports.
- Pas de WebView du site. Overlay Samsung `-r` seulement. Pas Nothing.
