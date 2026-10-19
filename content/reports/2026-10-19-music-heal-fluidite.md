# Music — réparation des titres et fluidité (19 oct ~20h)

Pas de mail. Le PDF `Hubera-2026-10-19-music.pdf` reste celui de la preuve des 2000 titres, déjà lancée (un titre à la fois). Aucun second balayage. Conteneur `ytmusic` non recréé, pas de pull d’image, `ALLOW_STREAM_UPSTREAM` laissé à 1, pas de rafale yt-dlp, pas de proxy sur le téléphone. Nothing non touché. Tâches kanban non supprimées.

## Réparation (serveur)

Le conteneur tourne depuis **2026-10-19 16:32:06Z** (18:32 Paris), image `ytmusic:search-durable`, même identifiant après contrôle. Le correctif y est encore : lecture par une route audio publique (autre client, autre itag) pour **n’importe quel compte**, sans tunnel réservé à un compte, et remplacement seulement si c’est **la même version** du morceau (`sameVersion`). Les fichiers `yt.ts`, `stream.ts`, `publicAudioRoutes.ts`, `publicAudioRoutesLive.ts`, `trackReplacement.ts` et `trackMatch.ts` ont le même condensé que le dépôt. Rien à remettre.

`VERSION` du conteneur aligné sur **1.3.376** (copie de fichier, sans redémarrage).

OTA `GET /api/version` :

| Client | apkAvailable | forceUpdate | mandatory |
|---|---|---|---|
| 1.3.375 / 10675 `cloud.hubera.music` | true, APK p+1.3.376 code 10676 | false | false |
| 1.3.376 / 10676 | false | false | false |

## Téléphones

`adb install -r` des deux paquets, Hubera d’abord. Volume musique à 0, lecture coupée dès que l’écran avait répondu. Pas d’ANR dans logcat.

Les deux téléphones ont **48 titres épinglés**. Après « Aléatoire » de l’accès rapide, la file média fait **48** : les titres entendus dans la sonde sont dans cet ensemble (Samsung : GROSSE BLETA puis Hollywood ; Blackview : THÉMISTOCLE, puis Dai Dai). Pas de titre hors épingles dans cette file.

| Geste | Samsung | Blackview |
|---|---|---|
| Ouvrir le lecteur | ~3,4 s (dump UI 2,4 s) | un dump ~10,5 s |
| Suivant | dump UI 2,6 s | ~11 s depuis la page artiste |
| Artiste | Scylla ~3,0 s, page artiste ouverte | GIMS, page artiste ouverte |
| Album | feuille Plus ~2,1 s, « Accéder à l’album » ~2,9 s ; l’écran visible restait le lecteur Hollywood | non mesuré (page artiste) |

Samsung en pause vers 12 s de position (tampon du titre déjà là). Blackview en pause vers 11 s (`state=2`). Le premier octet n’a pas été isolé : la sonde lisait l’état du lecteur, volume à 0.

## Encore lent ou pas confirmé

- Blackview : ouvrir ou enchaîner depuis la page artiste peut prendre une dizaine de secondes avant que l’interface réponde à l’automate. Pas d’ANR.
- Samsung : « Accéder à l’album » répond vite, mais une page album distincte n’a pas été vue (retour visuel = lecteur).
- Le libellé « À suivre » existe encore dans le code du panneau file. Sur l’aléatoire de l’accès rapide, la file active ne dépasse pas les épingles.
