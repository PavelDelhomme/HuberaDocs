package cloud.hubera.docs.data

import org.junit.Assert.assertEquals
import org.junit.Test

class TaskTreeTest {
    private fun task(id: String, parentId: String = "", createdAt: Long = 0) = Task(
        id = id,
        title = id,
        body = "",
        project = "docs",
        category = "feature",
        columnId = "todo",
        priority = 2,
        createdAt = createdAt,
        parentId = parentId,
    )

    @Test
    fun sousTachesDirectes_dansLOrdreDeCreation() {
        val tasks = listOf(
            task("root"),
            task("b", "root", 20),
            task("a", "root", 10),
            task("other", "x", 5),
        )
        val kids = directSubtasks(tasks, "root")
        assertEquals(listOf("a", "b"), kids.map { it.id })
        assertEquals(0, directSubtasks(tasks, "").size)
    }
}
