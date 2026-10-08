# 7 oct 2026 soir — Music 1.3.357, Maps 0.1.76, suite git

Fenêtre après le récap après-midi. Samsung USB overlay. Blackview **hors ADB**. Nothing **non touché**. `STREAM_MUSIC=0`. Watchtower Music **OFF**.

## Music

- **1.3.356** `ca18bf1996eee149cf27ed489ceb58ea606b4fdd` : paroles toutes scrollables, retour auto **8 s**.
- **1.3.357** `748032c3ee132df9e1041257e8dac7c4c6a25d5c` vc 10657 : offset perso prioritaire (pas d’écrasement crowd / restretch), next/prev en karaoké (bords + chip zIndex), `.m4a` local même online.
- Overlay Samsung dual `cloud.hubera.music` + `ovh.delhomme.ytmusic`. OTA `forceUpdate: false`. `apkAvailable: true` pour un client 1.3.356.
- API `lyricOffsets.ts` : docker cp ytmusic + restart. Pas de recreate.
- **Grosse Bléta** PLAYING Samsung. `X-PLM-Stream-Cache: atlas-disk`.

## Maps

- **0.1.75** `f7c3205` : GPS arrêt OK, puis crash Overpass XML → `JSONException` (tests `daa8d5e0`) — **done**.
- **0.1.76** `509c2bd5b76008e741f9bde4f4c32565af574ea2` : parse durci. SHA APK `7eca83f0b872d835143036d79c38c9eb76093fd374d60b3a37d50e60a07df46f`. Overlay Samsung cloud+legacy. `mandatory: false`.
- Overlay Blackview 0.1.76 : **todo** (ADB absent).
- P1 : Fuel `hubera-maps://` 2 icônes — noté.

## Fuel

Samsung encore **1.4.165** (pas de 166). Smoke accueil **OK**. Pause / trajet sans compte : **FAIL volontaire**.

## Suite git (agent 6f64d1b5)

| Repo | SHA | Note |
|---|---|---|
| Maps | f7c3205 puis 509c2bd | 0.1.75 puis 0.1.76 |
| Pass | 009ceb8 + 0e03acd | Autofill + bouton settings. APK tél **0.1.2** |
| Docs | 8f9270d | Rapports, fiche Pass, visionneuse PDF |
| Fuel | 577f814 | Générateur PDF 7 oct |
| Calendar | 4954d1b | Pointeur Docs |
| Mail | 7efc46a | Citation / Cc |
| Drive | 6d25a47 | HEAD share — **pas déployé** Cloudity |
