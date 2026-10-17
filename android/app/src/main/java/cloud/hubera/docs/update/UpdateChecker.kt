package cloud.hubera.docs.update

import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import cloud.hubera.docs.BuildConfig
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.VersionInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.TimeUnit

/** OTA jamais forcée (`forceUpdate` / `mandatory` false). Ne bloque jamais l’app. */
class UpdateChecker(
    private val api: DocsApi,
    private val context: Context,
) {
    private val prefs = context.applicationContext.getSharedPreferences("docs_updates", Context.MODE_PRIVATE)

    data class CheckResult(
        val available: Boolean,
        val info: VersionInfo? = null,
        val message: String? = null,
    )

    enum class SnoozeOption(val label: String) {
        ONE_HOUR("Dans 1 heure"),
        LATER_TODAY("Plus tard aujourd’hui"),
        TOMORROW("Demain"),
        THREE_DAYS("Dans 3 jours"),
        ONE_WEEK("Dans 1 semaine"),
    }

    fun snooze(option: SnoozeOption, versionCode: Int, now: Long = System.currentTimeMillis()) {
        val until = when (option) {
            SnoozeOption.ONE_HOUR -> now + TimeUnit.HOURS.toMillis(1)
            SnoozeOption.LATER_TODAY -> now + TimeUnit.HOURS.toMillis(4)
            SnoozeOption.TOMORROW -> now + TimeUnit.DAYS.toMillis(1)
            SnoozeOption.THREE_DAYS -> now + TimeUnit.DAYS.toMillis(3)
            SnoozeOption.ONE_WEEK -> now + TimeUnit.DAYS.toMillis(7)
        }
        prefs.edit()
            .putInt(KEY_SNOOZE_CODE, versionCode)
            .putLong(KEY_SNOOZE_UNTIL, until)
            .apply()
    }

    fun isSnoozed(versionCode: Int, now: Long = System.currentTimeMillis()): Boolean {
        if (versionCode <= 0) return false
        val until = prefs.getLong(KEY_SNOOZE_UNTIL, 0L)
        val code = prefs.getInt(KEY_SNOOZE_CODE, 0)
        if (until <= 0L || code != versionCode) return false
        if (now >= until) {
            prefs.edit().remove(KEY_SNOOZE_UNTIL).remove(KEY_SNOOZE_CODE).apply()
            return false
        }
        return true
    }

    suspend fun check(respectSnooze: Boolean = true): CheckResult = withContext(Dispatchers.IO) {
        runCatching {
            val info = api.version(
                BuildConfig.VERSION_NAME,
                BuildConfig.VERSION_CODE,
                context.packageName,
            )
            val remote = info.apkVersionCode
            val newer = info.apkAvailable &&
                !info.forceUpdate &&
                !info.mandatory &&
                (remote <= 0 || remote > BuildConfig.VERSION_CODE)
            when {
                !newer -> CheckResult(
                    available = false,
                    info = info,
                    message = "À jour — ${BuildConfig.VERSION_NAME}",
                )
                respectSnooze && remote > 0 && isSnoozed(remote) -> CheckResult(
                    available = false,
                    info = info,
                    message = "Reportée jusqu’à plus tard",
                )
                else -> CheckResult(
                    available = true,
                    info = info,
                    message = "v${info.apkVersion ?: info.version} disponible",
                )
            }
        }.getOrElse {
            CheckResult(available = false, message = it.message)
        }
    }

    suspend fun checkOnStartup(): CheckResult = check(respectSnooze = true)

    suspend fun install(
        onProgress: ((Float) -> Unit)? = null,
        onStatus: ((String) -> Unit)? = null,
    ): String = withContext(Dispatchers.IO) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !context.packageManager.canRequestPackageInstalls()
        ) {
            val last = prefs.getLong(KEY_PERM_ASKED_AT, 0L)
            if (System.currentTimeMillis() - last > 90_000L) {
                prefs.edit().putLong(KEY_PERM_ASKED_AT, System.currentTimeMillis()).apply()
                withContext(Dispatchers.Main) {
                    context.startActivity(
                        Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                            .setData(Uri.parse("package:${context.packageName}"))
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                    )
                }
            }
            return@withContext "Autorise l’installation pour Hubera Docs, puis réessaie — rien n’a encore été téléchargé"
        }
        val dest = File(File(context.cacheDir, "apk-updates"), "hubera-docs.apk")
        dest.parentFile?.mkdirs()
        val first = classify(dest)
        ApkCachePolicy.progressMessage(first.action, dest.exists() && dest.length() > 0L, first.older)?.let { note ->
            withContext(Dispatchers.Main) { onStatus?.invoke(note) }
        }
        if (first.action == ApkCacheAction.REUSE) {
            onProgress?.invoke(1f)
            return@withContext launchInstall(dest)
        }
        if (first.action == ApkCacheAction.DISCARD && dest.exists()) dest.delete()
        api.downloadApk(dest, context.packageName, onProgress)
        if (classify(dest).action != ApkCacheAction.REUSE) {
            if (dest.exists()) dest.delete()
            withContext(Dispatchers.Main) { onStatus?.invoke(ApkCachePolicy.DISCARD_MESSAGE) }
            api.downloadApk(dest, context.packageName, onProgress)
        }
        if (classify(dest).action != ApkCacheAction.REUSE) {
            dest.delete()
            return@withContext ApkCachePolicy.REJECT_MESSAGE
        }
        launchInstall(dest)
    }

    private data class Classified(val action: ApkCacheAction, val older: Boolean)

    private fun classify(dest: File): Classified {
        val existed = dest.isFile && dest.length() > 0L
        val zip = looksLikeZip(dest)
        val info = if (zip) archiveInfo(dest) else null
        val pkg = info?.packageName
        val code = info?.let { apkVersionCode(it) } ?: 0
        val older = !pkg.isNullOrBlank() && code in 1..BuildConfig.VERSION_CODE
        val action = ApkCachePolicy.decide(
            exists = existed,
            size = if (existed) dest.length() else 0L,
            zipMagic = zip,
            packageName = pkg,
            apkVersionCode = code,
            localVersionCode = BuildConfig.VERSION_CODE,
        )
        return Classified(action, older)
    }

    private fun looksLikeZip(file: File): Boolean {
        if (!file.isFile || file.length() < 4L) return false
        return runCatching {
            file.inputStream().use { input ->
                val b = ByteArray(2)
                val n = input.read(b)
                ApkCachePolicy.looksLikeZip(b[0].toInt() and 0xff, b[1].toInt() and 0xff, n)
            }
        }.getOrDefault(false)
    }

    private fun archiveInfo(file: File): PackageInfo? =
        runCatching { context.packageManager.getPackageArchiveInfo(file.absolutePath, 0) }.getOrNull()

    @Suppress("DEPRECATION")
    private fun apkVersionCode(info: PackageInfo): Int =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) info.longVersionCode.toInt()
        else info.versionCode

    private suspend fun launchInstall(dest: File): String {
        val uri = FileProvider.getUriForFile(context, context.packageName + ".fileprovider", dest)
        withContext(Dispatchers.Main) {
            context.startActivity(
                Intent(Intent.ACTION_INSTALL_PACKAGE).apply {
                    setDataAndType(uri, "application/vnd.android.package-archive")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                    putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true)
                    putExtra(Intent.EXTRA_RETURN_RESULT, false)
                },
            )
        }
        return "Installation lancée"
    }

    companion object {
        private const val KEY_SNOOZE_CODE = "snooze_version_code"
        private const val KEY_SNOOZE_UNTIL = "snooze_until_ms"
        private const val KEY_PERM_ASKED_AT = "perm_asked_at"
    }
}
