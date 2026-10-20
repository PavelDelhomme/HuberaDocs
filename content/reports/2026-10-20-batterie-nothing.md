# Batterie Nothing — Music et Fuel (20 oct 2026)

Lecture seule de `dumpsys batterystats` sur le Nothing `192.168.1.44:5555` (USB `00145153K001434`). Pas de reset, pas de `pm clear`.

Au moment de la lecture, `dumpsys battery` : pas de secteur, pas d’USB, pas de charge sans fil. Niveau affiché 30. La fenêtre « since last charge » démarre le 20 oct à 03:58 et est marquée 100 % sur batterie (13 h). Ce n’est pas une mesure de labo câble branché. Les chiffres ci-dessous sont des compteurs de cette fenêtre, pas une vérité de consommation à publier comme un pourcentage de décharge.

## Hubera Music (`cloud.hubera.music`, u0a417)

- Radio mobile active 27 min 51 s (35 fois). Wi-Fi surtout en sommeil (13 h), réception 8 s, émission 17 s.
- Pas de ligne GPS sur ce uid.
- Wakelock partiel le plus long : notifications `NotificationManagerService:post:cloud.hubera.music`, 1 h 14 min, 42 758 fois. Total wake blâmé 1 h 14 min.
- `ExoPlayer:WakeLockManager` et `AudioMix` sont listés, sans durée partielle séparée.
- Alarme de réveil `MAIN` : 0 fois.
- CPU du process ~45 min. 5 démarrages, 3 plantages dans la fenêtre (le certificat d’un portail Wifirst, corrigé dans 1.3.377).
- Service de lecture créé 19 s.

## Hubera Fuel (`cloud.hubera.fuel`, u0a420)

- GPS : 17 min 41 s blâmées, 34 min 11 s réel, 16 fois. Presque pas en arrière-plan (709 ms).
- Wakelock localisation `*location*` : 1 s blâmée.
- Job `TaskJobService` : 155 réussites, 14 s au total.
- Scan Wi-Fi blâmé 4 min, 139 fois. Radio mobile active 3 min 31 s.
- Alarmes de réveil listées (localisation, notifications) : 0 fois.
- CPU du process ~8 min. 5 démarrages.
