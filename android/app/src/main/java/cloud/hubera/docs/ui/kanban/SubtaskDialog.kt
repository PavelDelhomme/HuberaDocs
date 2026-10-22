package cloud.hubera.docs.ui.kanban

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.Row
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.SURFACE_LABEL
import cloud.hubera.docs.data.SURFACE_ORDER
import cloud.hubera.docs.data.normalizeTargets

@Composable
fun SubtaskDialog(
    parentTitle: String,
    initialTargets: List<String>,
    onDismiss: () -> Unit,
    onCreate: (title: String, body: String, priority: Int, targets: List<String>) -> Unit,
) {
    var title by rememberSaveable { mutableStateOf("") }
    var body by rememberSaveable { mutableStateOf("") }
    var priority by rememberSaveable { mutableIntStateOf(2) }
    var targets by remember { mutableStateOf(normalizeTargets(initialTargets).toSet()) }
    var err by rememberSaveable { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Sous-tâche") },
        text = {
            Column(
                Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    "De $parentTitle",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(title, { title = it }, label = { Text("Titre") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    body,
                    { body = it },
                    label = { Text("Détail") },
                    minLines = 3,
                    maxLines = 8,
                    modifier = Modifier.fillMaxWidth(),
                )
                PriorityPicker(priority) { priority = it }
                Text("Cible", style = MaterialTheme.typography.labelMedium)
                Text(
                    "API, web, mobile, ou une combinaison.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(
                    Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    SURFACE_ORDER.forEach { id ->
                        FilterChip(
                            selected = id in targets,
                            onClick = {
                                val next = targets.toMutableSet()
                                if (id in next) next.remove(id) else next.add(id)
                                targets = next
                            },
                            label = { Text(SURFACE_LABEL[id] ?: id) },
                        )
                    }
                }
                if (err.isNotEmpty()) {
                    Text(err, color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val picked = normalizeTargets(targets)
                if (title.isBlank()) return@TextButton
                if (picked.isEmpty()) {
                    err = "Choisis au moins une cible : API, web ou mobile."
                    return@TextButton
                }
                onCreate(title.trim(), body, priority.coerceIn(1, 5), picked)
            }) { Text("Créer") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } },
    )
}
