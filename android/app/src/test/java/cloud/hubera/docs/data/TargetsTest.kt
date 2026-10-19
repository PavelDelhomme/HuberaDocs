package cloud.hubera.docs.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TargetsTest {
    @Test
    fun ordreApiWebMobile() {
        assertEquals(listOf("api", "web", "mobile"), normalizeTargets(listOf("mobile", "api", "nope", "web")))
        assertEquals(listOf("api", "mobile"), normalizeTargets(listOf("mobile", "api")))
        assertEquals("", targetsLabel(emptyList()))
        assertEquals("API · Web", targetsLabel(listOf("web", "api")))
    }
}

class StampFormatTest {
    @Test
    fun horodatageReelPasUnePhraseFigee() {
        val a = formatHuberaStamp(1_700_000_000_000L)
        val b = formatHuberaStamp(1_700_000_060_000L)
        assertTrue(a.any { it.isDigit() })
        assertNotEquals(a, b)
        val line = stampLine(1_700_000_000_000L, 1_700_000_060_000L)
        assertTrue(line.startsWith("créé le "))
        assertTrue(line.contains("modifié le "))
        assertTrue(line.contains(a))
        assertTrue(line.contains(b))
    }

    @Test
    fun sansDate_ligneVide() {
        assertEquals("", stampLine(0L, 0L))
    }
}
