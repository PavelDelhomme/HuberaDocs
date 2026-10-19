package cloud.hubera.docs.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RemarkGroupsTest {
    private fun remark(id: String, taskId: String = "", kind: String = "retour") = Remark(
        id = id,
        app = "docs",
        body = id,
        kind = kind,
        taskId = taskId,
    )

    private fun task(
        id: String,
        columnId: String,
        title: String = id,
        priority: Int = 2,
    ) = Task(
        id = id,
        title = title,
        body = "",
        project = "docs",
        category = "bug",
        columnId = columnId,
        priority = priority,
    )

    @Test
    fun separeNonTraitePuisTraite() {
        val remarks = listOf(
            remark("a", "done1"),
            remark("b", ""),
            remark("c", "todo1", kind = "note"),
            remark("d", "missing"),
            remark("e", "done2"),
        )
        val tasks = listOf(
            task("done1", "done", "Déjà classé", 1),
            task("todo1", "doing", "Encore là", 4),
            task("done2", "done", "Second fait", 2),
        )
        val sections = remarkSections(remarks, tasks)
        assertEquals(listOf("b", "c", "d"), sections.open.map { it.remark.id })
        assertEquals(listOf("a", "e"), sections.done.map { it.remark.id })
        assertEquals("Pas de tâche liée", taskStateLabel(sections.open[0]))
        assertEquals("Encore là · En cours", taskStateLabel(sections.open[1]))
        assertEquals("Déjà classé · Fait", taskStateLabel(sections.done[0]))
        assertEquals("Encore là", tasks[1].title)
        assertEquals(4, tasks[1].priority)
        assertEquals("doing", tasks[1].columnId)
    }

    @Test
    fun basculeDansTraitesQuandLaTachePasseEnDone() {
        val remarks = listOf(remark("c", "todo1"), remark("b", ""))
        val openTask = task("todo1", "todo", "Encore là", 4)
        val before = remarkSections(remarks, listOf(openTask))
        assertEquals(listOf("c", "b"), before.open.map { it.remark.id })
        assertTrue(before.done.isEmpty())
        val moved = openTask.copy(columnId = "done")
        val after = remarkSections(remarks, listOf(moved))
        assertEquals(listOf("b"), after.open.map { it.remark.id })
        assertEquals(listOf("c"), after.done.map { it.remark.id })
        assertEquals("Encore là · Fait", taskStateLabel(after.done[0]))
        assertEquals("Encore là", moved.title)
        assertEquals(4, moved.priority)
    }

    @Test
    fun pasDePlaceholderTapeUnRetour() {
        assertEquals("", InboxCopy.bodyPlaceholder)
        assertFalse(InboxCopy.bodyPlaceholder.contains("Tape un retour", ignoreCase = true))
        assertEquals("À traiter", InboxCopy.openTitle)
        assertEquals("Traités", InboxCopy.doneTitle)
        assertTrue(InboxCopy.doneSubtitle.contains("Fait"))
    }

    @Test
    fun uneSousTacheEtUneSousSousTacheRestentDansLeurColonne() {
        val tasks = listOf(
            task("p", "todo", "Carte"),
            task("c", "todo", "Sous-tâche").copy(parentId = "p"),
            task("g", "doing", "Sous-sous-tâche").copy(parentId = "c"),
        )
        assertEquals(listOf("p", "c"), boardTaskIds(columnBoard(tasks, "todo")))
        assertEquals(listOf("g"), boardTaskIds(columnBoard(tasks, "doing")))
        assertEquals("p", tasks[1].parentId)
        assertEquals("c", tasks[2].parentId)
    }
}
