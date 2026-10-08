# Hubera ID

Identité commune. Domaine : https://id.hubera.cloud  
SSO **opt-in** (login local Music / Fuel inchangé). Stack `hubera-id`, nginx → gateway Cloudity `/auth`.

## Android (sélecteur inter-apps)

Type de compte `cloud.hubera.id` + ContentProvider signature. Détail et hook Maps/Fuel/Pass/Mail/Drive : [guide SSO Android](../guides/hubera-id-sso-android.md).

App native `cloud.hubera.id` : `HuberaID/mobile-android`. Module partagé : `HuberaID/android-sso`.

Suite entière (Music, Docs cockpit, Maps, Fuel, Jobs, Mail/Drive/Pass/Photos/Calendar/Contacts/Notes/Cook, Office Row/Docs-édition/Slides) : [guide SSO Android](../guides/hubera-id-sso-android.md).

Budget / Stream / CMS : hook documenté, pas d’APK.

Ne pas injecter `paul@` sur le Nothing. Overlay Nothing interdit ; Docs cockpit Nothing = OTA uniquement.
