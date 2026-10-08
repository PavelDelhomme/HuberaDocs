package cloud.hubera.docs.ui.account

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.BuildConfig
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.VersionNote
import cloud.hubera.docs.update.UpdateChecker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DocsAccountScreen(
    email: String,
    api: DocsApi,
    checker: UpdateChecker,
    onBack: () -> Unit,
    onLogout: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var notes by remember { mutableStateOf<List<VersionNote>>(emptyList()) }
    var updateMsg by remember { mutableStateOf("Installée ${BuildConfig.VERSION_NAME}") }
    var available by remember { mutableStateOf(false) }
    var remoteName by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var progress by remember { mutableFloatStateOf(0f) }

    BackHandler(onBack = onBack)

    LaunchedEffect(Unit) {
        notes = withContext(Dispatchers.IO) { runCatching { api.versionNotes() }.getOrDefault(emptyList()) }
        val check = withContext(Dispatchers.IO) { checker.check(respectSnooze = false) }
        available = check.available
        remoteName = check.info?.apkVersion
        updateMsg = check.message ?: "Installée ${BuildConfig.VERSION_NAME}"
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Compte Hubera", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(email.ifBlank { "Connecté" }, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            "Installée ${BuildConfig.VERSION_NAME} · mise à jour jamais forcée.",
            style = MaterialTheme.typography.bodySmall,
        )
        HorizontalDivider(Modifier.padding(vertical = 4.dp))
        ListItem(
            headlineContent = {
                Text(
                    when {
                        busy -> "Téléchargement… ${(progress * 100).toInt()} %"
                        available -> "Mettre à jour l’application"
                        else -> "Application à jour"
                    },
                )
            },
            supportingContent = { Text(updateMsg) },
            leadingContent = {
                Icon(Icons.Default.SystemUpdate, contentDescription = null)
            },
        )
        if (busy) {
            LinearProgressIndicator(
                progress = { progress.coerceIn(0.02f, 1f) },
                modifier = Modifier.fillMaxWidth(),
            )
        }
        if (available || busy) {
            Button(
                onClick = {
                    if (busy) return@Button
                    busy = true
                    progress = 0f
                    scope.launch {
                        val msg = runCatching {
                            checker.install { progress = it }
                        }.getOrElse { it.message ?: "Échec" }
                        updateMsg = msg
                        busy = false
                    }
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (busy) "En cours…" else "Télécharger / installer ${remoteName ?: ""}".trim())
            }
        }
        Text("Notes de version", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        if (notes.isEmpty()) {
            Text("Pas encore de notes.", style = MaterialTheme.typography.bodySmall)
        } else {
            notes.take(4).forEach { n ->
                Column(Modifier.padding(vertical = 4.dp)) {
                    Text("${n.version} — ${n.title}", fontWeight = FontWeight.SemiBold)
                    Text(n.date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    n.notes.forEach { line ->
                        Text("• $line", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
        TextButton(
            onClick = {
                scope.launch {
                    withContext(Dispatchers.IO) { api.logout() }
                    onLogout()
                }
            },
        ) {
            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, modifier = Modifier.padding(end = 8.dp))
            Text("Quitter")
        }
    }
}
