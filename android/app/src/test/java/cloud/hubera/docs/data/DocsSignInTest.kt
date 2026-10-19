package cloud.hubera.docs.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DocsSignInTest {
    @Test
    fun compteEnregistre_memeApresMiseAJour() {
        val emails = listOf("owner@example.com", "qa.lab@example.com")
        assertEquals("owner@example.com", DocsSignIn.silentTarget("owner@example.com", emails))
    }

    @Test
    fun autreCompte_neFournitPasLeJeton() {
        assertNull(DocsSignIn.silentTarget("owner@example.com", listOf("qa.lab@example.com")))
        assertFalse(DocsSignIn.acceptIdAccess("owner@example.com", "qa.lab@example.com", "access-b"))
    }

    @Test
    fun reinstall_unSeulCompteId() {
        assertEquals("owner@example.com", DocsSignIn.silentTarget(null, listOf("owner@example.com")))
        assertEquals("owner@example.com", DocsSignIn.silentTarget("", listOf(" Owner@Example.com ")))
    }

    @Test
    fun reinstall_plusieursComptes_choix() {
        assertNull(DocsSignIn.silentTarget(null, listOf("owner@example.com", "qa.lab@example.com")))
    }

    @Test
    fun jetonSansEmail_refuse() {
        assertFalse(DocsSignIn.acceptIdAccess("owner@example.com", "", "docs-session"))
        assertTrue(DocsSignIn.acceptIdAccess("owner@example.com", "owner@example.com", "hubera-access"))
    }
}
