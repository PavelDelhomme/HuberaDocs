# Mises à jour des dépendances et CVE

Demandé le 6 oct 2026. À brancher dans ce cockpit (pas Watchtower à l’aveugle).

## Idée

- Inventaire : yt-dlp, youtubei.js, APIs YouTube/Innertube, Hubera ID, images Docker, libs npm/go.
- Une fois par jour : comparer versions connues vs live.
- Si écart ou CVE : **tâche kanban** (catégorie infra) + **mail** du même type que les recaps.
- Music : ne jamais laisser Watchtower recréer `ytmusic` tout seul (overlay manuel).

Pas encore automatisé : cette page + les tâches seedées « Veille yt-dlp / CVE ».
