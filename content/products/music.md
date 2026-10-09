# Hubera Music

Priorité 1. Live **p+1.3.366** vc 10666. OTA : autoriser l’install **avant** le téléchargement (plus de boucle). Rapport : `content/reports/2026-10-09-chrome-ota-samsung.md`. Overlay Samsung dual 9 oct. Nothing : pas d’ADB (vidéos). Blackview ADB down. Sweeper jouabilité : `content/reports/2026-10-08-music-playability-sweep.md`.

- Domaine : https://music.hubera.cloud
- Paquets : `cloud.hubera.music` + `ovh.delhomme.ytmusic`
- OTA : `GET /api/version` · `forceUpdate: false` · `mandatory: false` · `apkAvailable: true` pour un client **1.3.365**
- **1.3.365** : plus de tiroir grille Hubera ; Accueil retrouve logo + « Hubera Music ». Les autres apps restent dans Compte.
- **1.3.359** : un titre déjà sur le téléphone se joue en `file://` même en Wi‑Fi. Cause : `demoteCurrentLocalIfOnline` recâblait le .m4a local vers le proxy + SimpleCache HTTP empoisonné. Plus de cache Exo sur `file://`. Amsterdam recuit sur disque VPS.
- **1.3.358** : picker « Continuer avec [e-mail] » (AccountManager `cloud.hubera.id` + ContentProvider). Voir le guide SSO Android.
- **1.3.356** (`ca18bf1`) : paroles toutes scrollables, retour auto **8 s**
- **1.3.357** (`748032c`) : offset perso prioritaire (pas d’écrasement crowd / restretch), next/prev en karaoké, `.m4a` local même online
- API : docker cp `stream.ts` + `playbackPolicy.ts` + VERSION + restart `ytmusic`. Watchtower **OFF**. Volume `ytmusic_ytmusic_data` intact.
- Stream : VPS + proxies HTTP, **pas** le PC maison. Grosse Bléta : disque atlas `J-OWpqvcPYk`.
- Blackview : overlay **1.3.361** OK (`EEA9700PRO0014587`, `-r` Success)
