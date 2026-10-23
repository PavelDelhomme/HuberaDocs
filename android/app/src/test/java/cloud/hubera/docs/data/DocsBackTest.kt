package cloud.hubera.docs.data

import org.junit.Assert.assertEquals
import org.junit.Test

class DocsBackTest {
    @Test
    fun listeVersAccueilEtFicheVersListe() {
        assertEquals(DocsBack.Step.Home, DocsBack.step(false, false, "kanban", 0L, 1_000L))
        assertEquals(DocsBack.Step.Home, DocsBack.step(false, false, "docs", 0L, 1_000L))
        assertEquals(DocsBack.Step.Home, DocsBack.step(false, false, "pdf", 0L, 1_000L))
        assertEquals(DocsBack.Step.Detail, DocsBack.step(true, false, "kanban", 0L, 1_000L))
        assertEquals(DocsBack.Step.Detail, DocsBack.step(true, false, "docs", 0L, 1_000L))
        assertEquals(DocsBack.Step.Account, DocsBack.step(false, true, "home", 0L, 1_000L))
    }

    @Test
    fun unSeulRetourDepuisAccueilNeQuittePas() {
        assertEquals(DocsBack.Step.Stay, DocsBack.step(false, false, "home", 0L, 5_000L))
        assertEquals(DocsBack.Step.Stay, DocsBack.step(false, false, "home", 1_000L, 2_000L))
    }

    @Test
    fun secondRetourRapidePasseEnArrierePlan() {
        assertEquals(DocsBack.Step.Background, DocsBack.step(false, false, "home", 5_000L, 5_400L))
        assertEquals(DocsBack.Step.Stay, DocsBack.step(false, false, "home", 5_000L, 5_900L))
    }
}
