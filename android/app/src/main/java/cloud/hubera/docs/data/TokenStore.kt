package cloud.hubera.docs.data

import android.content.Context

class TokenStore(context: Context) {
    private val app = context.applicationContext
    private val prefs = app.getSharedPreferences("hubera_docs", Context.MODE_PRIVATE)

    fun token(): String? = prefs.getString("token", null)?.takeIf { it.isNotBlank() }
    fun email(): String? = prefs.getString("email", null)

    fun save(token: String, email: String) {
        // La session Docs ne remplace pas le jeton Hubera ID.
        prefs.edit().putString("token", token).putString("email", email).apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
}
