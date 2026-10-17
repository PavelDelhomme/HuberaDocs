package cloud.hubera.docs.ui.kanban

import org.junit.Assert.assertEquals
import org.junit.Test

class TaskDraftTest {
    @Test
    fun premiereOuverture_prendLeTexteServeur() {
        val draft = keepTaskDraft(null, "t1", "Titre", "Détail", "todo", "docs")
        assertEquals("Titre", draft.title)
        assertEquals("Détail", draft.body)
    }

    @Test
    fun memeCarte_gardeLeTexteNonEnregistre() {
        val typed = TaskDraft("t1", "Brouillon", "pas encore sauvé", "doing", "music")
        val again = keepTaskDraft(typed, "t1", "Titre serveur", "Détail serveur", "todo", "docs")
        assertEquals(typed, again)
    }

    @Test
    fun autreCarte_oublieLAncienBrouillon() {
        val typed = TaskDraft("t1", "Brouillon", "secret", "todo", "docs")
        val next = keepTaskDraft(typed, "t2", "Autre", "", "todo", "maps")
        assertEquals("t2", next.taskId)
        assertEquals("Autre", next.title)
        assertEquals("", next.body)
    }
}
