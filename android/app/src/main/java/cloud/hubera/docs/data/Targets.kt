package cloud.hubera.docs.data

val SURFACE_ORDER = listOf("api", "web", "mobile")

val SURFACE_LABEL = mapOf(
    "api" to "API",
    "web" to "Web",
    "mobile" to "Mobile",
)

fun normalizeTargets(raw: Iterable<String>): List<String> {
    val want = raw.map { it.trim().lowercase() }.toSet()
    return SURFACE_ORDER.filter { it in want }
}

fun targetsLabel(raw: Iterable<String>): String =
    normalizeTargets(raw).joinToString(" · ") { SURFACE_LABEL[it] ?: it }
