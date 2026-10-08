# Hubera Docs — Android natif

Kotlin Compose. **Pas** de WebView de `docs.hubera.cloud`.

```bash
cd android
ANDROID_HOME="$HOME/Android/Sdk" ./gradlew :app:assembleRelease
# dual APK
ANDROID_HOME="$HOME/Android/Sdk" ./gradlew :app:assembleRelease -PlegacyAppId
```

- `cloud.hubera.docs`
- `ovh.delhomme.hubera.docs` (`-PlegacyAppId`)

OTA : `GET /api/version` → `forceUpdate: false`, `mandatory: false`.

Overlay labo : Samsung `adb install -r` uniquement. Jamais Nothing. Blackview si ADB.
