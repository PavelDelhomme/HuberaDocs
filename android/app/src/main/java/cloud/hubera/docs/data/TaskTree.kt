package cloud.hubera.docs.data

fun directSubtasks(tasks: List<Task>, parentId: String): List<Task> {
    if (parentId.isBlank()) return emptyList()
    return tasks.filter { it.parentId == parentId }.sortedBy { it.createdAt }
}
