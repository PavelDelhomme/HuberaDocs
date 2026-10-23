package cloud.hubera.docs.data

/**
 * Retour téléphone : une liste revient à l'accueil, une fiche revient à sa liste,
 * un second retour très rapide depuis l'accueil passe l'app en arrière-plan.
 */
object DocsBack {
    const val DOUBLE_MS = 600L
    const val HOME = "home"
    val LIST_TABS = setOf("kanban", "docs", "pdf")

    enum class Step { Detail, Account, Home, Stay, Background }

    fun step(
        hasDetail: Boolean,
        showAccount: Boolean,
        tab: String,
        lastHomeBackMs: Long,
        nowMs: Long,
        windowMs: Long = DOUBLE_MS,
    ): Step = when {
        hasDetail -> Step.Detail
        showAccount -> Step.Account
        tab != HOME -> Step.Home
        lastHomeBackMs > 0L && nowMs - lastHomeBackMs in 1..windowMs -> Step.Background
        else -> Step.Stay
    }
}
