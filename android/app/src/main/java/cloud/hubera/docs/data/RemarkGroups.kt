package cloud.hubera.docs.data

data class RemarkRow(
    val remark: Remark,
    val taskTitle: String,
    val columnId: String,
    val columnLabel: String,
    val treated: Boolean,
)

data class RemarkSections(
    val open: List<RemarkRow>,
    val done: List<RemarkRow>,
)

object InboxCopy {
    const val openTitle = "À traiter"
    const val openSubtitle = "La tâche liée n’est pas en Fait."
    const val doneTitle = "Traités"
    const val doneSubtitle = "La tâche liée est en Fait."
    const val bodyPlaceholder = ""
}

private val fallbackLabels = mapOf(
    "todo" to "À faire",
    "doing" to "En cours",
    "done" to "Fait",
    "later" to "Plus tard",
)

fun shortTaskTitle(title: String, max: Int = 72): String {
    val t = title.trim().replace(Regex("\\s+"), " ")
    if (t.length <= max) return t
    return t.take(max - 1).trimEnd() + "…"
}

fun columnLabelOf(columnId: String, columns: List<Column> = emptyList()): String {
    val found = columns.firstOrNull { it.id == columnId }?.label?.trim().orEmpty()
    if (found.isNotEmpty()) return found
    return fallbackLabels[columnId] ?: columnId
}

/**
 * À traiter : pas de tâche liée, ou tâche dont la colonne n’est pas done.
 * Traités : la tâche liée est dans la colonne done.
 * L’ordre d’arrivée est gardé. Les tâches ne sont pas modifiées.
 */
fun remarkSections(
    remarks: List<Remark>,
    tasks: List<Task>,
    columns: List<Column> = emptyList(),
): RemarkSections {
    val byId = tasks.associateBy { it.id }
    val open = ArrayList<RemarkRow>()
    val done = ArrayList<RemarkRow>()
    for (remark in remarks) {
        val task = remark.taskId.takeIf { it.isNotBlank() }?.let { byId[it] }
        val columnId = task?.columnId.orEmpty()
        val treated = task != null && columnId == "done"
        val row = RemarkRow(
            remark = remark,
            taskTitle = if (task == null) "" else shortTaskTitle(task.title),
            columnId = if (task == null) "" else columnId,
            columnLabel = if (task == null) "" else columnLabelOf(columnId, columns),
            treated = treated,
        )
        if (treated) done.add(row) else open.add(row)
    }
    return RemarkSections(open, done)
}

fun taskStateLabel(row: RemarkRow): String {
    if (row.taskTitle.isEmpty() && row.columnId.isEmpty()) return "Pas de tâche liée"
    val title = row.taskTitle.ifBlank { "Tâche" }
    if (row.columnLabel.isEmpty()) return title
    return "$title · ${row.columnLabel}"
}
