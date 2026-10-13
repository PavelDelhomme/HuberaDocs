# Hubera Fuel

**DA vague 1 :** [`../design/labo-da-vague1.html`](../design/labo-da-vague1.html) (section Fuel · trajet / compte).

Priorité 3. Un budget global — **pas ce sprint**. Live **1.4.172** (vc 196) · overlay Samsung + Blackview `cloud.hubera.fuel` 13 oct · OTA `forceUpdate: false`. Popup MAJ avec icône qui tourne dès la vérification.

- Chrome hamburger + compte Hubera ID. Jauge → modèle conso (EMA) de 1.4.168 **inchangée**.
- Dual APK `cloud.hubera.fuel` (SHA `3a97447c…b46781`) + `com.gasoiltracking.app` (SHA `bb25fbbf…91570c`).
- OTA : client 1.4.168 voit `apkAvailable: true`, `forceUpdate: false`.
- Trajets depuis Maps 0.1.87 : suivi libre + GPS en fond (FGS). Enregistrement au déplacement, pas au `speed` GPS. `fuelArmed` seulement en roulant.
- Stack Portainer : `gasoil-tracking` (volume `gasoil_api_data` — ne pas renommer)
- Overlay Samsung USB `R5CT7263YJL` `-r`. **Pas Nothing.** Blackview ADB absent.

Notes d’usage → onglet **Noter**.
