package cloud.hubera.docs.data

fun parseApps(raw: String, known: List<String>): List<String> {
    val parts = raw.split(Regex("\\s*[,·+]\\s*|\\s+et\\s+"))
        .map { it.trim().lowercase() }
        .filter { it.isNotEmpty() }
        .toSet()
    val ordered = known.filter { it in parts }
    if (ordered.isNotEmpty()) return ordered
    val single = raw.trim()
    if (single.isEmpty()) return listOf("docs")
    return listOf(single)
}

fun joinApps(selected: Iterable<String>, known: List<String>): String {
    val want = selected.map { it.trim().lowercase() }.filter { it.isNotEmpty() }.toSet()
    val ordered = known.filter { it in want }
    if (ordered.isNotEmpty()) return ordered.joinToString(", ")
    return "docs"
}
