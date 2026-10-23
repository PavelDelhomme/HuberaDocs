package cloud.hubera.docs.data

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ReturnSwipeTest {
    @Test
    fun gaucheADroiteSupprime() {
        assertTrue(returnSwipeDeletes(startToEnd = true))
    }

    @Test
    fun droiteAGaucheModifie() {
        assertFalse(returnSwipeDeletes(startToEnd = false))
    }
}
