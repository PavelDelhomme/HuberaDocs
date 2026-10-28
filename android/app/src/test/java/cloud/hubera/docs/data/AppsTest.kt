package cloud.hubera.docs.data

import org.junit.Assert.assertEquals
import org.junit.Test

class AppsTest {
    private val known = listOf("music", "maps", "fuel", "docs")

    @Test
    fun uneApplicationResteUne() {
        assertEquals(listOf("maps"), parseApps("maps", known))
        assertEquals("maps", joinApps(listOf("maps"), known))
    }

    @Test
    fun deuxApplicationsDansLOrdreConnu() {
        assertEquals(listOf("music", "maps"), parseApps("maps, music", known))
        assertEquals(listOf("music", "fuel"), parseApps("fuel · music", known))
        assertEquals("music, maps", joinApps(listOf("maps", "music"), known))
    }

    @Test
    fun videRetombeSurDocs() {
        assertEquals(listOf("docs"), parseApps("  ", known))
        assertEquals("docs", joinApps(emptyList(), known))
    }
}
