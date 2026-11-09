# Mises à jour des dépendances et CVE

Demandé le 6 oct 2026. Automatisé côté **images Docker live** via Fleet Watch (pas Watchtower à l’aveugle).

## Fleet Watch (VPS)

- Code : `kits/fleet-watch/` (HuberaCloud)
- Runtime : `/data/fleet-watch` → conteneur `fleet-watch`
- Chaque jour **06:30 Europe/Paris** : inventaire dynamique de tous les conteneurs running, scan **Trivy HIGH/CRITICAL**, comparaison des digests registry (**sans pull**).
- Mail si nouveautés (ou digest forcé le **dimanche**) via SMTP `noreply@maily.ovh` → `FLEET_WATCH_MAIL_TO`.
- Rapports : volume `fleet-watch-data` → `/data/reports/YYYY-MM-DD.json`
- **Notify-only** : aucun recreate. Music / overlays : intervention manuelle.

Scan manuel :

```bash
docker exec fleet-watch /opt/fleet-watch/scan.sh --once
```

## Hors Fleet Watch

- yt-dlp / youtubei.js / Innertube : veille manuelle + tâches kanban seedées.
- Cloudity : OSV côté admin-service (dépendances source).
- Host OS : Lynis (timer systemd).
- Music : ne jamais laisser Watchtower recréer `ytmusic` (overlay manuel).
