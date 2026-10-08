package cloud.hubera.docs.ui.kanban

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.Column
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.Task
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val projects = listOf(
    "music", "maps", "fuel", "docs", "pass", "drive", "mail", "ops", "platform", "admin",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KanbanScreen(
    api: DocsApi,
    openNew: Boolean = false,
    onOpenNewConsumed: () -> Unit = {},
) {
    var tasks by remember { mutableStateOf<List<Task>>(emptyList()) }
    var columns by remember { mutableStateOf<List<Column>>(emptyList()) }
    var selected by remember { mutableStateOf<Task?>(null) }
    var editing by remember { mutableStateOf(false) }
    var showNew by remember { mutableStateOf(false) }
    var showCol by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    fun reload() {
        scope.launch {
            val (t, c) = withContext(Dispatchers.IO) { api.tasks() to api.columns() }
            tasks = t
            columns = c
        }
    }
    LaunchedEffect(Unit) { reload() }
    LaunchedEffect(openNew) {
        if (openNew) {
            showNew = true
            onOpenNewConsumed()
        }
    }

    Box(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            Text(
                "Tape une carte pour la fiche — l’édition se fait depuis la popup.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall,
            )
            Row(
                Modifier
                    .horizontalScroll(rememberScrollState())
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                columns.forEach { col ->
                    Column(
                        Modifier
                            .width(240.dp)
                            .fillMaxHeight()
                            .verticalScroll(rememberScrollState()),
                    ) {
                        Text(col.label.uppercase(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                        tasks.filter { it.columnId == col.id }.forEach { task ->
                            Card(
                                Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp)
                                    .clickable {
                                        selected = task
                                        editing = false
                                    },
                            ) {
                                Column(Modifier.padding(10.dp)) {
                                    Text(task.title, fontWeight = FontWeight.SemiBold)
                                    Text("${task.project} · ${task.category}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
                OutlinedButton(onClick = { showCol = true }) { Text("+ Colonne") }
            }
        }
    }

    selected?.let { task ->
        ModalBottomSheet(onDismissRequest = { selected = null; editing = false }, sheetState = sheet) {
            if (!editing) {
                Column(Modifier.padding(20.dp)) {
                    Text(task.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("${task.project} · ${task.category} · prio ${task.priority}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(task.body.ifBlank { "Pas encore de détail." }, Modifier.padding(top = 12.dp))
                    Row(Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        androidx.compose.material3.Button(onClick = { editing = true }) { Text("Modifier") }
                        TextButton(onClick = { selected = null }) { Text("Fermer") }
                    }
                }
            } else {
                TaskEditForm(
                    task = task,
                    columns = columns,
                    onCancel = { editing = false },
                    onSave = { title, body, col, proj ->
                        scope.launch {
                            withContext(Dispatchers.IO) { api.patchTask(task.id, title, body, col, proj) }
                            selected = null
                            editing = false
                            reload()
                        }
                    },
                )
            }
        }
    }

    if (showNew) {
        NewTaskDialog(
            columns = columns,
            onDismiss = { showNew = false },
            onCreate = { title, body, proj, cat, col ->
                scope.launch {
                    withContext(Dispatchers.IO) { api.createTask(title, body, proj, cat, col) }
                    showNew = false
                    reload()
                }
            },
        )
    }
    if (showCol) {
        var label by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showCol = false },
            title = { Text("Nouvelle colonne") },
            text = { OutlinedTextField(value = label, onValueChange = { label = it }, label = { Text("Nom") }) },
            confirmButton = {
                TextButton(onClick = {
                    val l = label.trim()
                    if (l.isEmpty()) return@TextButton
                    scope.launch {
                        withContext(Dispatchers.IO) { api.createColumn(l) }
                        showCol = false
                        reload()
                    }
                }) { Text("Ajouter") }
            },
            dismissButton = { TextButton(onClick = { showCol = false }) { Text("Annuler") } },
        )
    }
}

@Composable
private fun TaskEditForm(
    task: Task,
    columns: List<Column>,
    onCancel: () -> Unit,
    onSave: (String, String, String, String) -> Unit,
) {
    var title by remember { mutableStateOf(task.title) }
    var body by remember { mutableStateOf(task.body) }
    var col by remember { mutableStateOf(task.columnId) }
    var proj by remember { mutableStateOf(task.project) }
    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Modifier la carte", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(title, { title = it }, label = { Text("Titre") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(body, { body = it }, label = { Text("Détail") }, minLines = 4, modifier = Modifier.fillMaxWidth())
        Text("Colonne", style = MaterialTheme.typography.labelMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            columns.forEach { c ->
                OutlinedButton(onClick = { col = c.id }) { Text(if (c.id == col) "✓ ${c.label}" else c.label) }
            }
        }
        Text("Projet", style = MaterialTheme.typography.labelMedium)
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            projects.forEach { p ->
                OutlinedButton(onClick = { proj = p }) { Text(if (p == proj) "✓ $p" else p) }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            androidx.compose.material3.Button(onClick = { onSave(title, body, col, proj) }) { Text("Enregistrer") }
            TextButton(onClick = onCancel) { Text("Annuler") }
        }
    }
}

@Composable
private fun NewTaskDialog(
    columns: List<Column>,
    onDismiss: () -> Unit,
    onCreate: (String, String, String, String, String) -> Unit,
) {
    val ctx = LocalContext.current
    val prefs = ctx.getSharedPreferences("hubera_docs_inbox", android.content.Context.MODE_PRIVATE)
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var proj by remember { mutableStateOf(prefs.getString("last_app", "docs") ?: "docs") }
    var cat by remember { mutableStateOf("feature") }
    var col by remember { mutableStateOf(columns.firstOrNull()?.id ?: "todo") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nouvelle tâche") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(title, { title = it }, label = { Text("Titre") })
                OutlinedTextField(body, { body = it }, label = { Text("Détail") })
            }
        },
        confirmButton = {
            TextButton(onClick = {
                if (title.isBlank()) return@TextButton
                prefs.edit().putString("last_app", proj).apply()
                onCreate(title.trim(), body, proj, cat, col)
            }) { Text("Créer") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } },
    )
}
