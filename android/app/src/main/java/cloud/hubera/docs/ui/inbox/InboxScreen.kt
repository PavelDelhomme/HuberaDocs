package cloud.hubera.docs.ui.inbox

import android.content.Context
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.AlertDialog
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
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
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.Remark
import cloud.hubera.docs.data.SURFACE_LABEL
import cloud.hubera.docs.data.SURFACE_ORDER
import cloud.hubera.docs.data.Task
import cloud.hubera.docs.data.directSubtasks
import cloud.hubera.docs.data.normalizeTargets
import cloud.hubera.docs.data.stampLine
import cloud.hubera.docs.data.targetsLabel
import cloud.hubera.docs.ui.kanban.PriorityPicker
import cloud.hubera.docs.ui.kanban.SubtaskDialog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

val inboxApps = listOf(
    "music", "maps", "fuel", "docs", "admin", "pass", "drive", "mail", "contacts",
    "photos", "calendar", "cook", "jobs", "id", "ops", "platform",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InboxScreen(
    api: DocsApi,
    kindIntent: String? = null,
    onKindConsumed: () -> Unit = {},
) {
    val ctx = LocalContext.current
    val prefs = remember { ctx.getSharedPreferences("hubera_docs_inbox", Context.MODE_PRIVATE) }
    var remarks by remember { mutableStateOf<List<Remark>>(emptyList()) }
    var tasks by remember { mutableStateOf<List<Task>>(emptyList()) }
    var subParentId by remember { mutableStateOf<String?>(null) }
    var editTask by remember { mutableStateOf<Task?>(null) }
    var appName by remember { mutableStateOf(prefs.getString("last_app", "docs") ?: "docs") }
    var body by remember { mutableStateOf(prefs.getString("draft", "") ?: "") }
    var kind by remember { mutableStateOf(prefs.getString("kind", "retour") ?: "retour") }
    var targets by remember {
        mutableStateOf(normalizeTargets((prefs.getString("targets", "") ?: "").split(",")).toSet())
    }
    var filter by remember { mutableStateOf(prefs.getString("filter", "all") ?: "all") }
    var editing by remember { mutableStateOf<Remark?>(null) }
    val scope = rememberCoroutineScope()
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    fun persist() {
        prefs.edit()
            .putString("last_app", appName)
            .putString("draft", body)
            .putString("kind", kind)
            .putString("targets", normalizeTargets(targets).joinToString(","))
            .putString("filter", filter)
            .apply()
    }

    suspend fun reload() {
        val loaded = withContext(Dispatchers.IO) {
            runCatching { api.remarks() }.getOrDefault(emptyList()) to
                runCatching { api.tasks() }.getOrDefault(emptyList())
        }
        remarks = loaded.first
        tasks = loaded.second
    }

    LaunchedEffect(kindIntent) {
        if (kindIntent != null) {
            kind = kindIntent
            persist()
            onKindConsumed()
        }
    }
    LaunchedEffect(appName, body, kind, targets, filter) { persist() }
    LaunchedEffect(Unit) { reload() }
    val shown = remarks.filter { filter == "all" || it.kind == filter }
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            "Choisis d’abord l’application, puis la cible. Un tap modifie le retour et la tâche liée.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        AppKindFields(
            appName,
            { appName = it },
            targets,
            { targets = it },
            kind,
            { kind = it },
        )
        OutlinedTextField(
            body,
            { body = it },
            label = { Text("Ce qui cloche") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            enabled = body.isNotBlank() && targets.isNotEmpty(),
            onClick = {
                if (body.isBlank() || targets.isEmpty()) return@Button
                val savedApp = appName.trim()
                val savedKind = kind
                val savedBody = body.trim()
                val savedTargets = normalizeTargets(targets)
                scope.launch {
                    withContext(Dispatchers.IO) { api.addRemark(savedApp, savedBody, savedKind, savedTargets) }
                    body = ""
                    persist()
                    reload()
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Enregistrer → tâche") }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = filter == "all", onClick = { filter = "all" }, label = { Text("Tous") })
            FilterChip(selected = filter == "retour", onClick = { filter = "retour" }, label = { Text("Retours") })
            FilterChip(selected = filter == "note", onClick = { filter = "note" }, label = { Text("Notes") })
        }
        shown.forEach { r ->
            Card(
                Modifier
                    .fillMaxWidth()
                    .clickable { editing = r },
            ) {
                Column(Modifier.padding(12.dp)) {
                    val cible = targetsLabel(r.targets)
                    Text(
                        "${r.app} · ${r.kind}" + if (cible.isNotEmpty()) " · $cible" else "",
                        fontWeight = FontWeight.SemiBold,
                    )
                    val whenLine = stampLine(r.createdAt, r.updatedAt)
                    if (whenLine.isNotEmpty()) {
                        Text(whenLine, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(r.body, style = MaterialTheme.typography.bodyMedium)
                    Text("Modifier", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }

    editing?.let { r ->
        ModalBottomSheet(onDismissRequest = { editing = null }, sheetState = sheet) {
            RemarkEditSheet(
                remark = r,
                children = directSubtasks(tasks, r.taskId),
                onOpenChild = { editTask = it },
                onAddSubtask = { subParentId = r.taskId },
                onCancel = { editing = null },
                onSave = { app, k, text, picked ->
                    scope.launch {
                        withContext(Dispatchers.IO) { api.patchRemark(r.id, app, text, k, picked) }
                        editing = null
                        reload()
                    }
                },
            )
        }
    }

    val subParent = tasks.firstOrNull { it.id == subParentId }
    if (subParent != null) {
        SubtaskDialog(
            parentTitle = subParent.title,
            initialTargets = subParent.targets.ifEmpty { editing?.targets.orEmpty() },
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
                    subParentId = null
                    reload()
                }
            },
        )
    }
    editTask?.let { task ->
        TaskQuickEdit(
            task = task,
            onDismiss = { editTask = null },
            onAddChild = {
                editTask = null
                subParentId = task.id
            },
            onSave = { title, body, prio ->
                scope.launch {
                    withContext(Dispatchers.IO) {
                        api.patchTask(task.id, title, body, task.columnId, task.project, prio)
                    }
                    editTask = null
                    reload()
                }
            },
        )
    }
}

@Composable
fun AppKindFields(
    appName: String,
    onApp: (String) -> Unit,
    targets: Set<String>,
    onTargets: (Set<String>) -> Unit,
    kind: String,
    onKind: (String) -> Unit,
) {
    Text("Application", style = MaterialTheme.typography.labelMedium)
    Row(
        Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        inboxApps.forEach { p ->
            OutlinedButton(onClick = { onApp(p) }) {
                Text(if (p == appName) "✓ $p" else p)
            }
        }
    }
    Text("Cible", style = MaterialTheme.typography.labelMedium)
    Text(
        "API, web, mobile, ou une combinaison.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        SURFACE_ORDER.forEach { id ->
            FilterChip(
                selected = id in targets,
                onClick = {
                    val next = targets.toMutableSet()
                    if (id in next) next.remove(id) else next.add(id)
                    onTargets(next)
                },
                label = { Text(SURFACE_LABEL[id] ?: id) },
            )
        }
    }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FilterChip(selected = kind == "retour", onClick = { onKind("retour") }, label = { Text("Retour") })
        FilterChip(selected = kind == "note", onClick = { onKind("note") }, label = { Text("Note") })
    }
}

@Composable
private fun RemarkEditSheet(
    remark: Remark,
    children: List<Task>,
    onOpenChild: (Task) -> Unit,
    onAddSubtask: () -> Unit,
    onCancel: () -> Unit,
    onSave: (String, String, String, List<String>) -> Unit,
) {
    var appName by remember { mutableStateOf(remark.app) }
    var kind by remember { mutableStateOf(remark.kind.ifBlank { "retour" }) }
    var body by remember { mutableStateOf(remark.body) }
    var targets by remember { mutableStateOf(remark.targets.toSet()) }
    val whenLine = stampLine(remark.createdAt, remark.updatedAt)
    Column(
        Modifier.padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Modifier le ${if (kind == "note") "note" else "retour"}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (whenLine.isNotEmpty()) {
            Text(whenLine, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        AppKindFields(appName, { appName = it }, targets, { targets = it }, kind, { kind = it })
        OutlinedTextField(
            body,
            { body = it },
            label = { Text("Texte") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
        )
        if (remark.taskId.isNotBlank()) {
            Text("Sous-tâches", fontWeight = FontWeight.SemiBold)
            if (children.isEmpty()) {
                Text("Aucune sous-tâche pour l’instant.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            children.forEach { child ->
                Column(
                    Modifier
                        .fillMaxWidth()
                        .clickable { onOpenChild(child) },
                ) {
                    Text("${child.priority.coerceIn(1, 5)}  ${child.title}")
                    val line = stampLine(child.createdAt, child.updatedAt)
                    if (line.isNotEmpty()) {
                        Text(line, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (remark.taskId.isNotBlank()) {
                Button(onClick = onAddSubtask) { Text("Sous-tâche") }
            }
            Button(
                enabled = body.isNotBlank() && targets.isNotEmpty(),
                onClick = {
                    val picked = normalizeTargets(targets)
                    if (body.isNotBlank() && picked.isNotEmpty()) onSave(appName, kind, body.trim(), picked)
                },
            ) { Text("Enregistrer") }
            TextButton(onClick = onCancel) { Text("Annuler") }
        }
    }
}

@Composable
private fun TaskQuickEdit(
    task: Task,
    onDismiss: () -> Unit,
    onAddChild: () -> Unit,
    onSave: (String, String, Int) -> Unit,
) {
    var title by remember { mutableStateOf(task.title) }
    var body by remember { mutableStateOf(task.body) }
    var priority by remember { mutableStateOf(task.priority.coerceIn(1, 5)) }
    val whenLine = stampLine(task.createdAt, task.updatedAt)
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Modifier la sous-tâche") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (whenLine.isNotEmpty()) {
                    Text(whenLine, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                OutlinedTextField(title, { title = it }, label = { Text("Titre") })
                OutlinedTextField(body, { body = it }, label = { Text("Détail") })
                PriorityPicker(priority) { priority = it }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                if (title.isBlank()) return@TextButton
                onSave(title.trim(), body, priority.coerceIn(1, 5))
            }) { Text("Enregistrer") }
        },
        dismissButton = {
            Row {
                TextButton(onClick = onAddChild) { Text("Sous-tâche") }
                TextButton(onClick = onDismiss) { Text("Annuler") }
            }
        },
    )
}
