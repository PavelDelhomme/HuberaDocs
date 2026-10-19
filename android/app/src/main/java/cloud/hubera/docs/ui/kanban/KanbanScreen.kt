package cloud.hubera.docs.ui.kanban

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.BoardNode
import cloud.hubera.docs.data.Column
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.Task
import cloud.hubera.docs.data.columnBoard
import cloud.hubera.docs.data.directSubtasks
import cloud.hubera.docs.data.stampLine
import cloud.hubera.docs.data.targetsLabel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val TaskDraftSaver = Saver<TaskDraft?, List<String>>(
    save = { value ->
        val d = value ?: return@Saver emptyList()
        listOf(d.taskId, d.title, d.body, d.columnId, d.project, d.priority.toString())
    },
    restore = { saved ->
        if (saved.size < 5) null
        else TaskDraft(
            saved[0],
            saved[1],
            saved[2],
            saved[3],
            saved[4],
            saved.getOrNull(5)?.toIntOrNull()?.coerceIn(1, 5) ?: 2,
        )
    },
)

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
    var panelId by rememberSaveable { mutableStateOf<String?>(null) }
    var editing by rememberSaveable { mutableStateOf(false) }
    var draft by rememberSaveable(stateSaver = TaskDraftSaver) { mutableStateOf<TaskDraft?>(null) }
    var showNew by remember { mutableStateOf(false) }
    var showCol by remember { mutableStateOf(false) }
    var colLabel by rememberSaveable { mutableStateOf("") }
    var newTitle by rememberSaveable { mutableStateOf("") }
    var newBody by rememberSaveable { mutableStateOf("") }
    var subParentId by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

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

    fun openCard(task: Task) {
        draft = keepTaskDraft(draft, task.id, task.title, task.body, task.columnId, task.project, task.priority)
        panelId = task.id
        editing = false
    }

    Box(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            Text(
                "À faire, En cours, Fait. Une sous-tâche reste dans sa colonne, sous son parent.",
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
                        columnBoard(tasks, col.id).forEach { node ->
                            val task = node.task
                            Card(
                                Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp)
                                    .clickable { openCard(task) },
                            ) {
                                Column(Modifier.padding(10.dp)) {
                                    Text("${task.priority.coerceIn(1, 5)}  ${task.title}", fontWeight = FontWeight.SemiBold)
                                    Text("${task.project} · ${task.category}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    val parent = tasks.firstOrNull { it.id == task.parentId }
                                    if (parent != null && parent.columnId != task.columnId) {
                                        Text(
                                            "Sous ${parent.title}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                    TaskWhen(task)
                                    node.children.forEach { child -> BoardChild(child) { openCard(it) } }
                                }
                            }
                        }
                    }
                }
                OutlinedButton(onClick = { showCol = true }) { Text("+ Colonne") }
            }
        }
        val open = tasks.firstOrNull { it.id == panelId }
        if (open != null) {
            val current = draft?.takeIf { it.taskId == open.id }
                ?: keepTaskDraft(null, open.id, open.title, open.body, open.columnId, open.project, open.priority)
            BackHandler {
                panelId = null
                editing = false
            }
            Surface(
                Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .imePadding(),
                tonalElevation = 6.dp,
                shadowElevation = 8.dp,
            ) {
                if (!editing) {
                    Column(Modifier.fillMaxWidth()) {
                    Column(
                        Modifier
                            .heightIn(max = 420.dp)
                            .verticalScroll(rememberScrollState())
                            .padding(start = 20.dp, end = 20.dp, top = 20.dp),
                    ) {
                        Text(open.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        val parent = tasks.firstOrNull { it.id == open.parentId }
                        if (parent != null) {
                            Text(
                                "Sous-tâche de ${parent.title}",
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.clickable {
                                    draft = keepTaskDraft(draft, parent.id, parent.title, parent.body, parent.columnId, parent.project, parent.priority)
                                    panelId = parent.id
                                    editing = false
                                },
                            )
                        }
                        Text("${open.project} · ${open.category}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        TaskWhen(open)
                        PriorityPicker(open.priority.coerceIn(1, 5)) { p ->
                            scope.launch {
                                withContext(Dispatchers.IO) { api.patchPriority(open.id, p) }
                                reload()
                            }
                        }
                        Text(
                            current.body.ifBlank { open.body }.ifBlank { "Pas encore de détail." },
                            Modifier.padding(top = 12.dp),
                        )
                        Text("Sous-tâches", Modifier.padding(top = 16.dp), fontWeight = FontWeight.SemiBold)
                        val kids = directSubtasks(tasks, open.id)
                        if (kids.isEmpty()) {
                            Text("Aucune sous-tâche pour l’instant.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        kids.forEach { child ->
                            Column(
                                Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp)
                                    .clickable {
                                        draft = keepTaskDraft(draft, child.id, child.title, child.body, child.columnId, child.project, child.priority)
                                        panelId = child.id
                                        editing = false
                                    },
                            ) {
                                Text("${child.priority.coerceIn(1, 5)}  ${child.title}")
                                TaskWhen(child)
                            }
                        }
                    }
                        Row(
                            Modifier
                                .horizontalScroll(rememberScrollState())
                                .padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 20.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            androidx.compose.material3.Button(onClick = { subParentId = open.id }) { Text("Sous-tâche") }
                            androidx.compose.material3.Button(onClick = {
                                draft = current
                                editing = true
                            }) { Text("Modifier") }
                            TextButton(onClick = {
                                panelId = null
                                editing = false
                            }) { Text("Fermer") }
                        }
                    }
                } else {
                    TaskEditForm(
                        draft = current,
                        columns = columns,
                        onChange = { draft = it },
                        onCancel = { editing = false },
                        onSave = { title, body, col, proj, prio ->
                            scope.launch {
                                withContext(Dispatchers.IO) { api.patchTask(open.id, title, body, col, proj, prio) }
                                draft = null
                                panelId = null
                                editing = false
                                reload()
                            }
                        },
                    )
                }
            }
        }
    }

    if (showNew) {
        NewTaskDialog(
            columns = columns,
            title = newTitle,
            body = newBody,
            onTitle = { newTitle = it },
            onBody = { newBody = it },
            onDismiss = { showNew = false },
            onCreate = { title, body, proj, cat, col, prio ->
                scope.launch {
                    withContext(Dispatchers.IO) { api.createTask(title, body, proj, cat, col, prio) }
                    newTitle = ""
                    newBody = ""
                    showNew = false
                    reload()
                }
            },
        )
    }
    val subParent = tasks.firstOrNull { it.id == subParentId }
    if (subParent != null) {
        SubtaskDialog(
            parentTitle = subParent.title,
            initialTargets = subParent.targets,
            onDismiss = { subParentId = null },
            onCreate = { title, body, prio, picked ->
                scope.launch {
                    withContext(Dispatchers.IO) {
                        api.createTask(
                            title,
                            body,
                            subParent.project,
                            subParent.category,
                            subParent.columnId,
                            prio,
                            subParent.id,
                            picked,
                        )
                    }
                    panelId = subParent.id
                    editing = false
                    subParentId = null
                    reload()
                }
            },
        )
    }
    if (showCol) {
        AlertDialog(
            onDismissRequest = { showCol = false },
            title = { Text("Nouvelle colonne") },
            text = { OutlinedTextField(value = colLabel, onValueChange = { colLabel = it }, label = { Text("Nom") }) },
            confirmButton = {
                TextButton(onClick = {
                    val l = colLabel.trim()
                    if (l.isEmpty()) return@TextButton
                    scope.launch {
                        withContext(Dispatchers.IO) { api.createColumn(l) }
                        colLabel = ""
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
private fun BoardChild(node: BoardNode, onOpen: (Task) -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(top = 6.dp, start = 8.dp)
            .clickable { onOpen(node.task) },
    ) {
        Text("${node.task.priority.coerceIn(1, 5)}  ${node.task.title}", style = MaterialTheme.typography.bodyMedium)
        TaskWhen(node.task)
        node.children.forEach { child -> BoardChild(child, onOpen) }
    }
}

@Composable
private fun TaskEditForm(
    draft: TaskDraft,
    columns: List<Column>,
    onChange: (TaskDraft) -> Unit,
    onCancel: () -> Unit,
    onSave: (String, String, String, String, Int) -> Unit,
) {
    Column(
        Modifier
            .padding(20.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Modifier la carte", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(
            draft.title,
            { onChange(draft.copy(title = it)) },
            label = { Text("Titre") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            draft.body,
            { onChange(draft.copy(body = it)) },
            label = { Text("Détail") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
        )
        Text("Colonne", style = MaterialTheme.typography.labelMedium)
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            columns.forEach { c ->
                OutlinedButton(onClick = { onChange(draft.copy(columnId = c.id)) }) {
                    Text(if (c.id == draft.columnId) "✓ ${c.label}" else c.label)
                }
            }
        }
        Text("Projet", style = MaterialTheme.typography.labelMedium)
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            projects.forEach { p ->
                OutlinedButton(onClick = { onChange(draft.copy(project = p)) }) {
                    Text(if (p == draft.project) "✓ $p" else p)
                }
            }
        }
        PriorityPicker(draft.priority.coerceIn(1, 5)) { onChange(draft.copy(priority = it)) }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            androidx.compose.material3.Button(onClick = {
                onSave(draft.title, draft.body, draft.columnId, draft.project, draft.priority.coerceIn(1, 5))
            }) { Text("Enregistrer") }
            TextButton(onClick = onCancel) { Text("Annuler") }
        }
    }
}

@Composable
private fun NewTaskDialog(
    columns: List<Column>,
    title: String,
    body: String,
    onTitle: (String) -> Unit,
    onBody: (String) -> Unit,
    onDismiss: () -> Unit,
    onCreate: (String, String, String, String, String, Int) -> Unit,
) {
    val ctx = LocalContext.current
    val prefs = ctx.getSharedPreferences("hubera_docs_inbox", android.content.Context.MODE_PRIVATE)
    var proj by rememberSaveable { mutableStateOf(prefs.getString("last_app", "docs") ?: "docs") }
    var cat by rememberSaveable { mutableStateOf("feature") }
    var col by rememberSaveable { mutableStateOf(columns.firstOrNull()?.id ?: "todo") }
    var priority by rememberSaveable { mutableStateOf(2) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nouvelle tâche") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(title, onTitle, label = { Text("Titre") })
                OutlinedTextField(body, onBody, label = { Text("Détail") })
                PriorityPicker(priority) { priority = it }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                if (title.isBlank()) return@TextButton
                prefs.edit().putString("last_app", proj).apply()
                onCreate(title.trim(), body, proj, cat, col, priority)
            }) { Text("Créer") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } },
    )
}

@Composable
private fun TaskWhen(task: Task) {
    val whenLine = stampLine(task.createdAt, task.updatedAt)
    val cible = targetsLabel(task.targets)
    if (whenLine.isNotEmpty()) {
        Text(whenLine, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
    if (cible.isNotEmpty()) {
        Text(cible, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
internal fun PriorityPicker(value: Int, onChange: (Int) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Priorité · 1 la plus importante", style = MaterialTheme.typography.labelMedium)
        Row(
            Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            (1..5).forEach { n ->
                OutlinedButton(onClick = { onChange(n) }) {
                    Text(if (n == value) "✓ $n" else "$n")
                }
            }
        }
    }
}
