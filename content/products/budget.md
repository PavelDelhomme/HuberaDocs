# Hubera Budget

Pas de client Android aujourd’hui. Package réservé : `cloud.hubera.budget`.

Hook Hubera ID : module `android-sso`, picker « Continuer avec », `saveSession(issuer = "budget")`. Voir [SSO Android](../guides/hubera-id-sso-android.md).

Ne pas clone Google / injecter d’e-mail en dur.

Web live : `https://budget.hubera.cloud/login` (la racine `/` est encore la landing www). Stack Portainer **`budgetai`** — ne pas `down -v`. Premier compte via `/setup` si la base est vide. Enveloppes créables depuis l’app ; totaux = somme des plafonds du mode.
