package cloud.hubera.docs.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class TaskTreeTest {
    private fun task(
        id: String,
        parentId: String = "",
        createdAt: Long = 0,
        columnId: String = "todo",
    ) = Task(
        id = id,
        title = id,
        body = "",
        project = "docs",
        category = "feature",
        columnId = columnId,
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

    @Test
    fun uneTacheAFaireApparaitDansAFaire() {
        val tasks = listOf(task("a"))
        assertEquals(listOf("a"), boardTaskIds(columnBoard(tasks, "todo")))
        assertEquals(0, columnBoard(tasks, "doing").size)
        assertEquals(0, columnBoard(tasks, "done").size)
    }

    @Test
    fun uneSousTacheAFaireApparaitDansAFaire() {
        val tasks = listOf(
            task("p"),
            task("c", "p"),
            task("g", "c"),
        )
        val tree = columnBoard(tasks, "todo")
        assertEquals(1, tree.size)
        assertEquals("p", tree[0].task.id)
        assertEquals("c", tree[0].children[0].task.id)
        assertEquals("g", tree[0].children[0].children[0].task.id)
        assertEquals(listOf("p", "c", "g"), boardTaskIds(tree))
    }

    @Test
    fun uneFaiteNeMasquePasLesAutres() {
        val tasks = listOf(
            task("fait", columnId = "done"),
            task("encore"),
            task("suite", "fait"),
            task("autre", columnId = "done"),
        )
        assertEquals(listOf("encore", "suite"), boardTaskIds(columnBoard(tasks, "todo")))
        val done = boardTaskIds(columnBoard(tasks, "done"))
        assertEquals(listOf("fait", "autre"), done)
        assertFalse(done.contains("encore"))
        assertFalse(done.contains("suite"))
    }

    @Test
    fun creerUneSousTacheLaMontre() {
        val before = listOf(task("p"))
        assertEquals(listOf("p"), boardTaskIds(columnBoard(before, "todo")))
        val after = before + task("n", "p")
        val tree = columnBoard(after, "todo")
        assertEquals(listOf("p", "n"), boardTaskIds(tree))
        assertEquals("n", tree[0].children[0].task.id)
    }
}
