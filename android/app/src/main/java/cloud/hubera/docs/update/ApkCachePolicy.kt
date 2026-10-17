package cloud.hubera.docs.update

/**
 * Décision OTA sans Android : un cache PK + paquet plus récent s’installe,
 * un zip incomplet reprend, un fichier qui n’est pas une APK est jeté.
 */
enum class ApkCacheAction {
    REUSE,
    RESUME,
    DISCARD,
}

object ApkCachePolicy {
    const val MIN_BYTES = 100_000L

    const val REUSE_MESSAGE =
        "Fichier déjà téléchargé — installation, sans nouveau téléchargement"
    const val RESUME_MESSAGE = "Reprise du téléchargement…"
    const val DISCARD_MESSAGE =
        "Le fichier en cache n’est pas une APK valide. Nouveau téléchargement affiché."
    const val OLDER_MESSAGE =
        "Le fichier en cache est plus ancien que cette app. Nouveau téléchargement affiché."
    const val REJECT_MESSAGE =
        "Téléchargement rejeté (le serveur n’a pas envoyé une APK). Rien n’a été installé."

    fun looksLikeZip(head0: Int, head1: Int, bytesRead: Int): Boolean =
        bytesRead >= 2 && head0 == 0x50 && head1 == 0x4B

    fun decide(
        exists: Boolean,
        size: Long,
        zipMagic: Boolean,
        packageName: String?,
        apkVersionCode: Int,
        localVersionCode: Int,
    ): ApkCacheAction {
        if (!exists || size <= 0L || !zipMagic || size < MIN_BYTES) return ApkCacheAction.DISCARD
        val pkg = packageName?.takeIf { it.isNotBlank() }
        if (pkg != null && apkVersionCode > localVersionCode) return ApkCacheAction.REUSE
        if (pkg != null && apkVersionCode in 1..localVersionCode) return ApkCacheAction.DISCARD
        return ApkCacheAction.RESUME
    }

    fun progressMessage(
        action: ApkCacheAction,
        fileExisted: Boolean,
        olderThanPhone: Boolean,
    ): String? = when {
        action == ApkCacheAction.REUSE -> REUSE_MESSAGE
        action == ApkCacheAction.RESUME -> RESUME_MESSAGE
        action == ApkCacheAction.DISCARD && fileExisted && olderThanPhone -> OLDER_MESSAGE
        action == ApkCacheAction.DISCARD && fileExisted -> DISCARD_MESSAGE
        else -> null
    }
}
