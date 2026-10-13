# Hubera Music

**DA vague 1 :** maquettes web/mobile (A/B/C, clair/sombre) → [`../design/labo-da-vague1.html`](../design/labo-da-vague1.html) · [`../design/README.md`](../design/README.md)

Priorité 1. Live **p+1.3.369** vc 10669. Logo Accueil → menu apps Hubera. OTA avec icône qui tourne. Skip Maps via commande custom (plus de boucle DASH). Overlay Samsung + Blackview 13 oct. Nothing : pas d’ADB.

- Domaine : https://music.hubera.cloud
- Paquets : `cloud.hubera.music` + `ovh.delhomme.ytmusic`
- SHA cloud `16d3e4997c0438a8818f512be2fc3128f9fa6ba093a316bd742b0d82ed442df2` · legacy `9937c10d0816f82347e131457e57d8dff5e1c19cee3bb7eb26129d3cf9a1ba23`
- OTA : `GET /api/version` · `forceUpdate: false` · `mandatory: false` · `apkAvailable: true` pour un client **1.3.366**
- **1.3.365** : plus de tiroir grille Hubera ; Accueil retrouve logo + « Hubera Music ». Les autres apps restent dans Compte.
- **1.3.359** : un titre déjà sur le téléphone se joue en `file://` même en Wi‑Fi. Cause : `demoteCurrentLocalIfOnline` recâblait le .m4a local vers le proxy + SimpleCache HTTP empoisonné. Plus de cache Exo sur `file://`. Amsterdam recuit sur disque VPS.
- **1.3.358** : picker « Continuer avec [e-mail] » (AccountManager `cloud.hubera.id` + ContentProvider). Voir le guide SSO Android.
- **1.3.356** (`ca18bf1`) : paroles toutes scrollables, retour auto **8 s**
- **1.3.357** (`748032c`) : offset perso prioritaire (pas d’écrasement crowd / restretch), next/prev en karaoké, `.m4a` local même online
- API : docker cp `stream.ts` + `playbackPolicy.ts` + VERSION + restart `ytmusic`. Watchtower **OFF**. Volume `ytmusic_ytmusic_data` intact.
- Stream : VPS + proxies HTTP, **pas** le PC maison. Grosse Bléta : disque atlas `J-OWpqvcPYk`.
- Blackview : overlay **1.3.361** OK (`EEA9700PRO0014587`, `-r` Success)
