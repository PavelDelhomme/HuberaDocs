package cloud.hubera.docs

import android.webkit.CookieManager
import cloud.hubera.id.sso.HuberaIdAccounts
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : FlutterActivity() {
    private val io = Executors.newSingleThreadExecutor()

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "listEmails" -> {
                        val emails = HuberaIdAccounts.listAccounts(this).map { mapOf("email" to it.email) }
                        result.success(emails)
                    }
                    "tryAutoSso" -> io.execute {
                        val out = runCatching { autoSso() }.getOrElse { mapOf("ok" to false, "error" to it.message) }
                        runOnUiThread { result.success(out) }
                    }
                    "sso" -> {
                        val email = call.argument<String>("email").orEmpty()
                        io.execute {
                            val out = runCatching { sso(email) }.getOrElse { mapOf("ok" to false, "error" to it.message) }
                            runOnUiThread { result.success(out) }
                        }
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun autoSso(): Map<String, Any?> {
        val accounts = HuberaIdAccounts.listAccounts(this)
            .filter { it.email.isNotBlank() && it.accessToken.isNotBlank() }
        if (accounts.size != 1) {
            return mapOf("ok" to false, "emails" to accounts.map { it.email })
        }
        return sso(accounts.first().email)
    }

    private fun sso(email: String): Map<String, Any?> {
        val acc = HuberaIdAccounts.listAccounts(this)
            .firstOrNull { it.email.equals(email.trim(), ignoreCase = true) }
            ?: return mapOf("ok" to false, "error" to "compte absent")
        val body = JSONObject()
            .put("access_token", acc.accessToken)
            .put("refresh_token", acc.refreshToken)
            .toString()
        val conn = (URL("$DOCS/api/auth/login/sso").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            doOutput = true
            connectTimeout = 12_000
            readTimeout = 12_000
        }
        conn.outputStream.use { it.write(body.toByteArray()) }
        val text = (if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream)
            .bufferedReader().readText()
        val json = JSONObject(text.ifBlank { "{}" })
        if (conn.responseCode !in 200..299 || !json.optBoolean("ok")) {
            return mapOf(
                "ok" to false,
                "error" to json.optString("error").ifBlank { "sso" },
                "email" to acc.email,
            )
        }
        val token = json.optString("token")
        val cm = CookieManager.getInstance()
        cm.setAcceptCookie(true)
        conn.headerFields["Set-Cookie"]?.forEach { cm.setCookie(DOCS, it) }
        if (token.isNotBlank()) {
            cm.setCookie(DOCS, "docs_session=$token; Path=/; SameSite=Lax")
        }
        cm.flush()
        return mapOf("ok" to true, "email" to json.optString("email", acc.email))
    }

    companion object {
        private const val CHANNEL = "hubera_id_sso"
        private const val DOCS = "https://docs.hubera.cloud"
    }
}
