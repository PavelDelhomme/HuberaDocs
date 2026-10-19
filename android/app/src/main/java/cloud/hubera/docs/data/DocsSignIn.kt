package cloud.hubera.docs.data

/**
 * Session Docs : le jeton vient de Hubera ID pour le compte demandé.
 * Un autre compte ne le fournit pas. Une session Docs locale ne remplace pas ID.
 */
object DocsSignIn {
    fun silentTarget(storedEmail: String?, idEmails: List<String>): String? {
        val stored = storedEmail?.trim()?.lowercase().orEmpty()
        val accounts = idEmails.map { it.trim().lowercase() }.filter { it.isNotEmpty() }.distinct()
        if (stored.isNotEmpty()) {
            if (accounts.isEmpty() || stored in accounts) return stored
            return null
        }
        return if (accounts.size == 1) accounts[0] else null
    }

    /** Vrai seulement si le JWT nomme exactement ce compte. */
    fun acceptIdAccess(accountEmail: String, tokenEmail: String, access: String): Boolean {
        val want = accountEmail.trim().lowercase()
        val got = tokenEmail.trim().lowercase()
        if (want.isEmpty() || access.isBlank()) return false
        return got.isNotEmpty() && got == want
    }
}
