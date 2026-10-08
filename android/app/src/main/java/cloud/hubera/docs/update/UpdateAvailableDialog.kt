package cloud.hubera.docs.update

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun UpdateAvailableDialog(
    versionName: String?,
    busy: Boolean,
    progress: Float,
    message: String?,
    onInstall: () -> Unit,
    onSnooze: (UpdateChecker.SnoozeOption) -> Unit,
    onDismiss: () -> Unit,
) {
    var showSnooze by remember { mutableStateOf(false) }
    if (showSnooze) {
        AlertDialog(
            onDismissRequest = { showSnooze = false },
            title = { Text("Me le rappeler…") },
            text = {
                Column {
                    UpdateChecker.SnoozeOption.entries.forEach { opt ->
                        TextButton(onClick = { onSnooze(opt); showSnooze = false }) {
                            Text(opt.label)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showSnooze = false }) { Text("Annuler") }
            },
        )
        return
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                when {
                    busy && progress > 0f -> "Téléchargement… ${(progress * 100).toInt()} %"
                    busy -> "Téléchargement…"
                    else -> "Mise à jour disponible"
                },
            )
        },
        text = {
            Column {
                Text(
                    message?.takeIf { it.isNotBlank() }
                        ?: versionName?.let { "Version $it prête à installer. Jamais forcée." }
                        ?: "Une nouvelle version de Hubera Docs est disponible.",
                )
                if (busy) {
                    Spacer(Modifier.height(12.dp))
                    if (progress > 0f) {
                        LinearProgressIndicator(
                            progress = { progress.coerceIn(0.02f, 1f) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    } else {
                        LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                    }
                }
            }
        },
        confirmButton = {
            TextButton(enabled = !busy, onClick = onInstall) {
                Text(if (busy) "En cours…" else "Télécharger")
            }
        },
        dismissButton = {
            TextButton(enabled = !busy, onClick = { showSnooze = true }) {
                Text("Plus tard")
            }
        },
    )
}
