package cloud.hubera.docs.ui.theme

import android.content.Context
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val HuberaTeal = Color(0xFF0E4D5C)
val HuberaOrange = Color(0xFFC9782A)
val HuberaBg = Color(0xFFF4F7F8)
val HuberaInk = Color(0xFF1A2330)

enum class DocsThemeChoice { Dark, Light, System }

class DocsThemeStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("hubera_docs_ui", Context.MODE_PRIVATE)

    fun read(): DocsThemeChoice = when (prefs.getString(KEY, "system")) {
        "light" -> DocsThemeChoice.Light
        "dark" -> DocsThemeChoice.Dark
        else -> DocsThemeChoice.System
    }

    fun write(choice: DocsThemeChoice) {
        val value = when (choice) {
            DocsThemeChoice.Light -> "light"
            DocsThemeChoice.System -> "system"
            DocsThemeChoice.Dark -> "dark"
        }
        prefs.edit().putString(KEY, value).apply()
    }

    companion object {
        private const val KEY = "theme"
    }
}

fun DocsThemeChoice.isDark(systemDark: Boolean): Boolean = when (this) {
    DocsThemeChoice.Dark -> true
    DocsThemeChoice.Light -> false
    DocsThemeChoice.System -> systemDark
}

private val lightScheme = lightColorScheme(
    primary = HuberaTeal,
    onPrimary = Color.White,
    secondary = HuberaOrange,
    onSecondary = Color.White,
    background = HuberaBg,
    onBackground = HuberaInk,
    surface = Color.White,
    onSurface = HuberaInk,
    surfaceVariant = Color(0xFFEEF3F5),
    onSurfaceVariant = Color(0xFF5A6878),
    error = Color(0xFFB42318),
    outline = Color(0xFFDCE6EA),
)

private val darkScheme = darkColorScheme(
    primary = Color(0xFF8FD4E0),
    onPrimary = Color(0xFF0C1216),
    secondary = Color(0xFFE39A4A),
    onSecondary = Color(0xFF0C1216),
    background = Color(0xFF0C1216),
    onBackground = Color(0xFFE8EEF2),
    surface = Color(0xFF161E24),
    onSurface = Color(0xFFE8EEF2),
    surfaceVariant = Color(0xFF1C272E),
    onSurfaceVariant = Color(0xFF9AABBA),
    error = Color(0xFFFF7A6E),
    onError = Color(0xFF0C1216),
    outline = Color(0xFF2A3842),
)

@Composable
fun HuberaDocsTheme(
    choice: DocsThemeChoice = DocsThemeChoice.System,
    content: @Composable () -> Unit,
) {
    val dark = choice.isDark(isSystemInDarkTheme())
    MaterialTheme(colorScheme = if (dark) darkScheme else lightScheme, content = content)
}
