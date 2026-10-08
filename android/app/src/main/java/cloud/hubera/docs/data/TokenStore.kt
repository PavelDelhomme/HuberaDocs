package cloud.hubera.docs.data

import android.content.Context
import cloud.hubera.id.sso.HuberaIdAccounts

class TokenStore(context: Context) {
    private val app = context.applicationContext
    private val prefs = app.getSharedPreferences("hubera_docs", Context.MODE_PRIVATE)

    fun token(): String? = prefs.getString("token", null)?.takeIf { it.isNotBlank() }
    fun email(): String? = prefs.getString("email", null)

    fun save(token: String, email: String) {
        prefs.edit().putString("token", token).putString("email", email).apply()
        HuberaIdAccounts.saveSession(app, email, token, "", issuer = "docs")
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
}
