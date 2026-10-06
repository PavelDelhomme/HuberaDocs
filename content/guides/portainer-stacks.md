# Stacks Portainer (état 6 octobre 2026)

Inventaire SSH + API Portainer. **Jamais `down -v`.** Ne pas renommer les volumes.

## Ce qui tourne vraiment

| Stack / projet | Rôle réel | Verdict |
|---|---|---|
| ytmusic | Hubera Music (API+web) | **Prod**. Volume `ytmusic_ytmusic_data`. |
| gasoil-tracking | Hubera Fuel | **Prod**. Volume `gasoil_api_data`. Le nom Git/Portainer reste Gasoil tant que le volume n’est pas migrable. |
| jobbingtrack-prod | Hubera Jobs | **Prod** |
| jobbingtrack-preprod | Jobs preprod (plein de micro-services) | Garder jusqu’à validation ; c’est le coût « trop de stacks » |
| cloudity | postgres/redis + mail/drive/contacts/calendar/photos/pass/notes/tasks/admin | **Encore le backend live** des apps cloud. Les stacks `hubera-mail-web` etc. sont surtout **nginx**. Ne **pas** éteindre Cloudity maintenant. |
| hubera-id / calendar / contacts / drive / mail / notes / pass / photos / office / maps / stream / www / vtcbuilder | nginx Git unitaire | OK comme façade ; le métier est souvent encore Cloudity ou le repo produit |
| hubera-cms | nginx Git HuberaPress | façade |
| hubera-cms-runtime | **vrai** Django + Next + postgres/redis | le CMS qui marche (`cms.hubera.cloud/admin`) |
| hubera-taskflow + projet `deploy` | Tasks TDAH | le compose s’appelle encore `deploy` pour une partie des conteneurs — à recoller plus tard **sans** toucher le volume postgres |
| hubera-cook-web | Cook nginx | 4 jours |
| cooking-recipes | ancienne app recettes | **redondant**. Stopper après smoke Cook. **Garder** volumes. |
| budgetai | Hubera Budget live | Pas de stack `hubera-budget`. Ne pas supprimer avant cutover. |
| watchtower | pull images toutes les 5 min si label enable=true | **Arrêté le 6 oct** : `ytmusic` était enable=true → aurait pu écraser l’overlay Music. |
| n8n / nextcloud / NPM / portainer | ops perso | hors suite Hubera utilisateur |

## Compromis (garder l’unitaire, réduire le chaos)

1. **Un Git + un volume + une stack par produit** (déjà la règle). On ne fusionne pas Music+Fuel+Jobs.
2. **Deux couches assumées** le temps du cutover : `hubera-*-web` (façade) + `cloudity` (API). Une ligne dans Docs, pas 15 « produits ».
3. **Jobs** : une prod. Preprod = labo, pas un deuxième Hubera Jobs.
4. **Noms affichés** Portainer (label) : « Hubera Fuel » sur la stack `gasoil-tracking` **sans** renommer le volume.
5. **CMS** : `hubera-cms-runtime` = moteur ; `hubera-cms` = Git/nginx. VTCBuilder reste le métier chauffeur (abos, logique riche). HuberaPress reprend le CMS générique / landings / plus tard www.
6. **www** : vitrine aujourd’hui ; gestion via CMS **plus tard**.
7. **Office** : stack nginx, produit plus tard.
8. **Cloudity** : archive Git + runtime encore nécessaire. Pas un produit utilisateur. On l’éteint **produit par produit** quand l’API Hubera* est réellement branchée.

## Ne pas faire cette semaine

Supprimer budgetai, cloudity, cooking-recipes, jobbingtrack-preprod, ou renommer `ytmusic` / `gasoil_api_data`.
