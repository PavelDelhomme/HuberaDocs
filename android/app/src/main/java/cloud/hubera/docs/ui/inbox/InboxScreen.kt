package cloud.hubera.docs.ui.inbox

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.material3.AlertDialog
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import cloud.hubera.docs.ui.kanban.PriorityPicker
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.Column
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.joinApps
import cloud.hubera.docs.data.parseApps
import cloud.hubera.docs.data.InboxCopy
import cloud.hubera.docs.data.Remark
import cloud.hubera.docs.data.RemarkRow
import cloud.hubera.docs.data.returnSwipeDeletes
import cloud.hubera.docs.data.remarkSections
import cloud.hubera.docs.data.taskStateLabel
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
    "music", "maps", "fuel", "mail", "drive", "photos", "contacts", "calendar",
    "notes", "tasks", "pass", "cook", "id", "docs", "admin", "jobs",
    "stream", "budget", "taskflow", "cms", "office", "vtcbuilder",
    "ops", "platform",
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
    var columns by remember { mutableStateOf<List<Column>>(emptyList()) }
    var subParentId by remember { mutableStateOf<String?>(null) }
    var editTask by remember { mutableStateOf<Task?>(null) }
    var apps by remember {
        mutableStateOf(parseApps(prefs.getString("last_app", "docs") ?: "docs", inboxApps).toSet())
    }
    var body by remember { mutableStateOf(prefs.getString("draft", "") ?: "") }
    var kind by remember { mutableStateOf(prefs.getString("kind", "retour") ?: "retour") }
    var criticality by remember { mutableIntStateOf(1) }
    var priority by remember { mutableIntStateOf(5) }
    var targets by remember {
        mutableStateOf(normalizeTargets((prefs.getString("targets", "") ?: "").split(",")).toSet())
    }
    var filter by remember { mutableStateOf(prefs.getString("filter", "all") ?: "all") }
    var editing by remember { mutableStateOf<Remark?>(null) }
    var confirmDelete by remember { mutableStateOf<Remark?>(null) }
    val scope = rememberCoroutineScope()
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    fun persist() {
        prefs.edit()
            .putString("last_app", joinApps(apps, inboxApps))
            .putString("draft", body)
            .putString("kind", kind)
            .putString("targets", normalizeTargets(targets).joinToString(","))
            .putString("filter", filter)
            .apply()
    }

    suspend fun reload() {
        val loaded = withContext(Dispatchers.IO) {
            Triple(
                runCatching { api.remarks() }.getOrDefault(emptyList()),
                runCatching { api.tasks() }.getOrDefault(emptyList()),
                runCatching { api.columns() }.getOrDefault(emptyList()),
            )
        }
        remarks = loaded.first
        tasks = loaded.second
        columns = loaded.third
    }

    LaunchedEffect(kindIntent) {
        if (kindIntent != null) {
            kind = kindIntent
            persist()
            onKindConsumed()
        }
    }
    LaunchedEffect(apps, body, kind, targets, filter) { persist() }
    LaunchedEffect(Unit) { reload() }
    val shown = remarks.filter { filter == "all" || it.kind == filter }
    val sections = remarkSections(shown, tasks, columns)
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        AppKindFields(
            apps,
            { apps = it },
            targets,
            { targets = it },
            kind,
            { kind = it },
        )
        if (kind != "note") {
            CriticalityPicker(criticality) { criticality = it }
        }
        PriorityPicker(priority) { priority = it }
        Text(
            "5 est la plus basse. C’est le choix de départ.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedTextField(
            body,
            { body = it },
            label = { Text("Texte") },
            placeholder = if (InboxCopy.bodyPlaceholder.isEmpty()) null else {
                { Text(InboxCopy.bodyPlaceholder) }
            },
            minLines = 4,
            maxLines = 8,
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            enabled = body.isNotBlank() && targets.isNotEmpty(),
            onClick = {
                if (body.isBlank() || targets.isEmpty()) return@Button
                val savedApp = joinApps(apps, inboxApps)
                val savedKind = kind
                val savedBody = body.trim()
                val savedTargets = normalizeTargets(targets)
                val savedLevel = if (savedKind == "note") 1 else criticality.coerceIn(1, 5)
                val savedPriority = priority.coerceIn(1, 5)
                scope.launch {
                    withContext(Dispatchers.IO) {
                        api.addRemark(savedApp, savedBody, savedKind, savedTargets, savedLevel, savedPriority)
                    }
                    body = ""
                    priority = 5
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
        Text(InboxCopy.openTitle, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(InboxCopy.openSubtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (sections.open.isEmpty()) {
            Text("Aucun élément", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        sections.open.forEach { row ->
            SwipeRemarkCard(row, onEdit = { editing = row.remark }, onDelete = { confirmDelete = row.remark })
        }
        HorizontalDivider()
        Text(InboxCopy.doneTitle, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(InboxCopy.doneSubtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (sections.done.isEmpty()) {
            Text("Aucun élément", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        sections.done.forEach { row ->
            SwipeRemarkCard(row, onEdit = { editing = row.remark }, onDelete = { confirmDelete = row.remark })
        }
    }

    confirmDelete?.let { r ->
        AlertDialog(
            onDismissRequest = { confirmDelete = null },
            title = { Text("Supprimer ce retour ?") },
            text = { Text("La carte de retour part. La tâche du tableau reste.") },
            confirmButton = {
                TextButton(onClick = {
                    val id = r.id
                    confirmDelete = null
                    scope.launch {
                        withContext(Dispatchers.IO) { runCatching { api.deleteRemark(id) } }
                        reload()
                    }
                }) { Text("Supprimer") }
            },
            dismissButton = {
                TextButton(onClick = { confirmDelete = null }) { Text("Annuler") }
            },
        )
    }

    editing?.let { r ->
        ModalBottomSheet(onDismissRequest = { editing = null }, sheetState = sheet) {
            RemarkEditSheet(
                remark = r,
                initialPriority = tasks.firstOrNull { it.id == r.taskId }?.priority ?: 5,
                children = directSubtasks(tasks, r.taskId),
                onOpenChild = { editTask = it },
                onAddSubtask = { subParentId = r.taskId },
                onCancel = { editing = null },
                onSave = { app, k, text, picked, level, prio ->
                    scope.launch {
                        withContext(Dispatchers.IO) { api.patchRemark(r.id, app, text, k, picked, level, prio) }
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SwipeRemarkCard(row: RemarkRow, onEdit: () -> Unit, onDelete: () -> Unit) {
    if (row.remark.kind != "retour") {
        RemarkCard(row, onEdit)
        return
    }
    val state = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            val startToEnd = value == SwipeToDismissBoxValue.StartToEnd
            if (value == SwipeToDismissBoxValue.Settled) return@rememberSwipeToDismissBoxState false
            if (returnSwipeDeletes(startToEnd)) onDelete() else onEdit()
            false
        },
        positionalThreshold = { distance -> distance * 0.35f },
    )
    SwipeToDismissBox(
        state = state,
        enableDismissFromStartToEnd = true,
        enableDismissFromEndToStart = true,
        backgroundContent = {
            val deleting = state.targetValue == SwipeToDismissBoxValue.StartToEnd ||
                state.dismissDirection == SwipeToDismissBoxValue.StartToEnd
            Row(Modifier.fillMaxSize()) {
                Box(
                    Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .background(MaterialTheme.colorScheme.errorContainer),
                    contentAlignment = Alignment.CenterStart,
                ) {
                    if (deleting) {
                        Text(
                            "Supprimer",
                            modifier = Modifier.padding(start = 20.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
                Box(
                    Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.CenterEnd,
                ) {
                    if (!deleting && state.targetValue == SwipeToDismissBoxValue.EndToStart) {
                        Text(
                            "Modifier",
                            modifier = Modifier.padding(end = 20.dp),
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        },
        content = { RemarkCard(row, onEdit) },
    )
}

@Composable
private fun RemarkCard(row: RemarkRow, onClick: () -> Unit) {
    val r = row.remark
    Card(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
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
            Text(taskStateLabel(row), fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
            if (r.kind != "note") {
                Text(
                    "Criticité ${r.criticality.coerceIn(1, 5)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(r.body, style = MaterialTheme.typography.bodyMedium)
            Text("Modifier", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
fun AppKindFields(
    apps: Set<String>,
    onApps: (Set<String>) -> Unit,
    targets: Set<String>,
    onTargets: (Set<String>) -> Unit,
    kind: String,
    onKind: (String) -> Unit,
) {
    Text("Application", style = MaterialTheme.typography.labelMedium)
    Text(
        "Une ou plusieurs applications.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Row(
        Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        inboxApps.forEach { p ->
            val on = p in apps
            OutlinedButton(
                onClick = {
                    val next = apps.toMutableSet()
                    if (p in next) {
                        if (next.size <= 1) return@OutlinedButton
                        next.remove(p)
                    } else {
                        next.add(p)
                    }
                    onApps(next)
                },
                modifier = Modifier.semantics {
                    contentDescription = if (on) "Application $p cochée" else "Application $p"
                },
            ) {
                Text(if (on) "✓ $p" else p)
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
fun RemarkEditSheet(
    remark: Remark,
    initialPriority: Int = 5,
    children: List<Task>,
    onOpenChild: (Task) -> Unit,
    onAddSubtask: () -> Unit,
    onCancel: () -> Unit,
    onSave: (String, String, String, List<String>, Int, Int) -> Unit,
) {
    var apps by remember { mutableStateOf(parseApps(remark.app, inboxApps).toSet()) }
    var kind by remember { mutableStateOf(remark.kind.ifBlank { "retour" }) }
    var body by remember { mutableStateOf(remark.body) }
    var targets by remember { mutableStateOf(remark.targets.toSet()) }
    var criticality by remember { mutableIntStateOf(remark.criticality.coerceIn(1, 5)) }
    var priority by remember { mutableIntStateOf(initialPriority.coerceIn(1, 5)) }
    val whenLine = stampLine(remark.createdAt, remark.updatedAt)
    Column(
        Modifier
            .fillMaxWidth()
            .imePadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Modifier le ${if (kind == "note") "note" else "retour"}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (whenLine.isNotEmpty()) {
            Text(whenLine, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        AppKindFields(apps, { apps = it }, targets, { targets = it }, kind, { kind = it })
        if (kind != "note") {
            CriticalityPicker(criticality) { criticality = it }
        }
        PriorityPicker(priority) { priority = it }
        Text(
            "1 la plus importante, 5 la plus basse.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedTextField(
            body,
            { body = it },
            label = { Text("Texte") },
            minLines = 4,
            maxLines = 8,
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
                    if (body.isNotBlank() && picked.isNotEmpty()) {
                        onSave(joinApps(apps, inboxApps), kind, body.trim(), picked, criticality.coerceIn(1, 5), priority.coerceIn(1, 5))
                    }
                },
            ) { Text("Enregistrer") }
            TextButton(onClick = onCancel) { Text("Annuler") }
        }
    }
}

@Composable
private fun CriticalityPicker(value: Int, onChange: (Int) -> Unit) {
    val selected = value.coerceIn(1, 5)
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Criticité", style = MaterialTheme.typography.labelMedium)
        Row(
            Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            (1..5).forEach { n ->
                OutlinedButton(
                    onClick = { onChange(n) },
                    modifier = Modifier.semantics {
                        contentDescription = if (n == selected) "Criticité $n choisie" else "Criticité $n"
                    },
                ) {
                    Text(if (n == selected) "✓ $n" else "$n")
                }
            }
        }
        Text(
            "5 la plus grave, 1 la moins grave",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
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
            Column(
                Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (whenLine.isNotEmpty()) {
                    Text(whenLine, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
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
