package cloud.hubera.docs.ui.kanban

/**
 * Brouillon d’une carte. Tant que l’identifiant ne change pas, le texte déjà saisi
 * reste, même si la fiche serveur est relue ou si la feuille se recompose.
 */
data class TaskDraft(
    val taskId: String,
    val title: String,
    val body: String,
    val columnId: String,
    val project: String,
    val priority: Int = 2,
    val targets: List<String> = emptyList(),
)

fun keepTaskDraft(
    current: TaskDraft?,
    taskId: String,
    title: String,
    body: String,
    columnId: String,
    project: String,
    priority: Int = 2,
    targets: List<String> = emptyList(),
): TaskDraft {
    if (current != null && current.taskId == taskId) return current
    val p = priority.coerceIn(1, 5)
    return TaskDraft(taskId, title, body, columnId, project, p, targets)
}
