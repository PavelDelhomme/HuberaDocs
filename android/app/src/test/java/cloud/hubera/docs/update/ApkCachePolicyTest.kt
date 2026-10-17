package cloud.hubera.docs.update

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ApkCachePolicyTest {
    @Test
    fun zipMagicPkOnly() {
        assertTrue(ApkCachePolicy.looksLikeZip(0x50, 0x4B, 2))
        assertFalse(ApkCachePolicy.looksLikeZip(0x3C, 0x68, 2))
        assertFalse(ApkCachePolicy.looksLikeZip(0x50, 0x4B, 1))
    }

    @Test
    fun reusesNewerParsedPackage() {
        assertEquals(
            ApkCacheAction.REUSE,
            ApkCachePolicy.decide(
                exists = true,
                size = 8_000_000L,
                zipMagic = true,
                packageName = "cloud.hubera.docs",
                apkVersionCode = 220,
                localVersionCode = 212,
            ),
        )
    }

    @Test
    fun resumesPartialZipWithoutPackage() {
        assertEquals(
            ApkCacheAction.RESUME,
            ApkCachePolicy.decide(
                exists = true,
                size = 2_000_000L,
                zipMagic = true,
                packageName = null,
                apkVersionCode = 0,
                localVersionCode = 212,
            ),
        )
    }

    @Test
    fun discardsHtmlAndOlderApk() {
        assertEquals(
            ApkCacheAction.DISCARD,
            ApkCachePolicy.decide(
                exists = true,
                size = 9_000_000L,
                zipMagic = false,
                packageName = null,
                apkVersionCode = 0,
                localVersionCode = 212,
            ),
        )
        assertEquals(
            ApkCacheAction.DISCARD,
            ApkCachePolicy.decide(
                exists = true,
                size = 8_000_000L,
                zipMagic = true,
                packageName = "cloud.hubera.docs",
                apkVersionCode = 200,
                localVersionCode = 212,
            ),
        )
    }

    @Test
    fun messagesAreVisible() {
        assertEquals(
            ApkCachePolicy.DISCARD_MESSAGE,
            ApkCachePolicy.progressMessage(
                ApkCacheAction.DISCARD,
                fileExisted = true,
                olderThanPhone = false,
            ),
        )
        assertEquals(
            ApkCachePolicy.OLDER_MESSAGE,
            ApkCachePolicy.progressMessage(
                ApkCacheAction.DISCARD,
                fileExisted = true,
                olderThanPhone = true,
            ),
        )
        assertEquals(
            ApkCachePolicy.RESUME_MESSAGE,
            ApkCachePolicy.progressMessage(
                ApkCacheAction.RESUME,
                fileExisted = true,
                olderThanPhone = false,
            ),
        )
        assertEquals(
            null,
            ApkCachePolicy.progressMessage(
                ApkCacheAction.DISCARD,
                fileExisted = false,
                olderThanPhone = false,
            ),
        )
    }
}
