package cloud.hubera.docs.update

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun UpdateAvailableDialog(
    versionName: String?,
    busy: Boolean,
    progress: Float,
    message: String?,
    releaseNotes: String? = null,
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
                    releaseNotes?.takeIf { it.isNotBlank() }
                        ?: message?.takeIf { it.isNotBlank() }
                        ?: versionName?.let { "Version $it — nouveautés et améliorations. Jamais forcée." }
                        ?: "Une nouvelle version de Hubera Docs est disponible.",
                )
                if (busy) {
                    Spacer(Modifier.height(12.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            strokeWidth = 2.5.dp,
                        )
                        Spacer(Modifier.width(10.dp))
                        if (progress > 0f) {
                            LinearProgressIndicator(
                                progress = { progress.coerceIn(0.02f, 1f) },
                                modifier = Modifier.weight(1f),
                            )
                        } else {
                            LinearProgressIndicator(modifier = Modifier.weight(1f))
                        }
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
