# Hubera Docs

Cahier unique Paul. Web `https://docs.hubera.cloud` + app Android native Compose **et** le même cockpit dans **Hubera Admin** (plus une page web).

- Sous-tâches : depuis une tâche ou un retour, on en ajoute, on continue, on les modifie. Créé le et modifié le restent. Priorité 1 à 5. Cible API / web / mobile. Lanceur **Hubera Docs**. Live **0.2.26**.
- Retours : d’abord l’application, puis la cible API / web / mobile (ou une combinaison). Le choix est sur le retour et sur la tâche. Créé le à l’enregistrement, modifié le à chaque changement. Priorité 1 à 5.
- Auth Hubera ID, allowlist.
- Vues : dashboard → kanban (popup carte, FAB, colonnes) → docs → PDF/md du compte → Gantt → retours.
- Dual APK `cloud.hubera.docs` / `ovh.delhomme.hubera.docs`. Live **0.2.10**. En-tête sous la barre d’état (chrome Music). OTA jamais forcée (`forceUpdate: false` / `mandatory: false`). Overlay Samsung 10 oct. Pas Nothing.
- Chrome type Music : hamburger, header compact, compte haut droite, nav bas Accueil · Tâches · Docs · Rapports.
- Pas de WebView du site. Overlay Samsung `-r` seulement. Pas Nothing.
