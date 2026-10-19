package cloud.hubera.docs.data

data class BoardNode(val task: Task, val children: List<BoardNode>)

fun directSubtasks(tasks: List<Task>, parentId: String): List<Task> {
    if (parentId.isBlank()) return emptyList()
    return tasks.filter { it.parentId == parentId }.sortedBy { it.createdAt }
}

/**
 * Une tâche est dans la colonne de son columnId.
 * Elle est groupée sous son parent seulement si le parent est dans la même colonne.
 * Un parent dans une autre colonne ne la retire pas de la sienne.
 */
fun columnBoard(tasks: List<Task>, columnId: String): List<BoardNode> {
    val inCol = tasks.filter { it.columnId == columnId }.map { it.id }.toSet()
    fun nest(parentId: String): List<BoardNode> =
        tasks
            .filter { it.parentId == parentId && it.columnId == columnId }
            .map { BoardNode(it, nest(it.id)) }
    return tasks
        .filter { t ->
            t.columnId == columnId && (t.parentId.isBlank() || t.parentId !in inCol)
        }
        .map { BoardNode(it, nest(it.id)) }
}

fun boardTaskIds(nodes: List<BoardNode>): List<String> {
    val ids = ArrayList<String>()
    fun walk(list: List<BoardNode>) {
        for (n in list) {
            ids.add(n.task.id)
            walk(n.children)
        }
    }
    walk(nodes)
    return ids
}
