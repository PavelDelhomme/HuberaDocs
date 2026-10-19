package cloud.hubera.docs.data

import android.content.Context
import cloud.hubera.id.sso.HuberaIdAccounts

/**
 * Ouvre Docs avec le jeton frais du compte demandé, lu chez Hubera ID.
 */
object DocsIdSession {
    fun signInFresh(ctx: Context, api: DocsApi, email: String): String? {
        val want = email.trim().lowercase()
        if (want.isEmpty()) return null
        val fresh = HuberaIdAccounts.freshFromId(ctx, want)
        if (fresh != null) {
            open(api, want, fresh.accessToken, fresh.refreshToken)?.let { return it }
        }
        val copies = runCatching { HuberaIdAccounts.listAllCopies(ctx) }.getOrDefault(emptyList())
            .filter { it.email.equals(want, ignoreCase = true) }
        val candidates = copies
            .filter { DocsSignIn.acceptIdAccess(want, HuberaIdAccounts.jwtEmail(it.accessToken), it.accessToken) }
            .sortedByDescending { it.updatedAt }
            .distinctBy { it.accessToken }
            .take(3)
        for (copy in candidates) {
            open(api, want, copy.accessToken, copy.refreshToken)?.let { return it }
        }
        val refreshes = copies
            .map { it.refreshToken.trim() }
            .filter { it.isNotEmpty() }
            .distinct()
            .take(3)
        for (refresh in refreshes) {
            val renewed = api.renewHuberaAccess(refresh) ?: continue
            open(api, want, renewed.first, renewed.second.ifBlank { refresh })?.let { return it }
        }
        return null
    }

    private fun open(api: DocsApi, email: String, access: String, refresh: String): String? {
        if (!DocsSignIn.acceptIdAccess(email, HuberaIdAccounts.jwtEmail(access), access)) return null
        return runCatching { api.loginSso(access, refresh) }.getOrElse { error ->
            if (error.message == "allowlist") throw error
            null
        }
    }

    fun trySilent(ctx: Context, api: DocsApi, storedEmail: String?): String? {
        val accounts = runCatching { HuberaIdAccounts.listAccounts(ctx) }.getOrDefault(emptyList())
        val target = DocsSignIn.silentTarget(storedEmail, accounts.map { it.email }) ?: return null
        return runCatching { signInFresh(ctx, api, target) }.getOrNull()
    }
}
