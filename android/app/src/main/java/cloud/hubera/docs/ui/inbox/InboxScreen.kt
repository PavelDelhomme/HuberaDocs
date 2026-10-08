package cloud.hubera.docs.ui.inbox

import android.content.Context
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
    var appName by remember { mutableStateOf(prefs.getString("last_app", "docs") ?: "docs") }
    var body by remember { mutableStateOf(prefs.getString("draft", "") ?: "") }
    var kind by remember { mutableStateOf(prefs.getString("kind", "retour") ?: "retour") }
    var filter by remember { mutableStateOf(prefs.getString("filter", "all") ?: "all") }
    var editing by remember { mutableStateOf<Remark?>(null) }
    val scope = rememberCoroutineScope()
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    fun persist() {
        prefs.edit()
            .putString("last_app", appName)
            .putString("draft", body)
            .putString("kind", kind)
            .putString("filter", filter)
            .apply()
    }

    suspend fun reload() {
        remarks = withContext(Dispatchers.IO) { runCatching { api.remarks() }.getOrDefault(emptyList()) }
    }

    LaunchedEffect(kindIntent) {
        if (kindIntent != null) {
            kind = kindIntent
            persist()
            onKindConsumed()
        }
    }
    LaunchedEffect(appName, body, kind, filter) { persist() }
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
            "Tape un retour pour le modifier (texte, type, application). Ça met aussi à jour la tâche.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        AppKindFields(appName, { appName = it }, kind, { kind = it })
        OutlinedTextField(
            body,
            { body = it },
            label = { Text("Ce qui cloche") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            onClick = {
                if (body.isBlank()) return@Button
                val savedApp = appName.trim()
                val savedKind = kind
                val savedBody = body.trim()
                scope.launch {
                    withContext(Dispatchers.IO) { api.addRemark(savedApp, savedBody, savedKind) }
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
                    Text("${r.app} · ${r.kind}", fontWeight = FontWeight.SemiBold)
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
                onCancel = { editing = null },
                onSave = { app, k, text ->
                    scope.launch {
                        withContext(Dispatchers.IO) { api.patchRemark(r.id, app, text, k) }
                        editing = null
                        reload()
                    }
                },
            )
        }
    }
}

@Composable
fun AppKindFields(
    appName: String,
    onApp: (String) -> Unit,
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
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FilterChip(selected = kind == "retour", onClick = { onKind("retour") }, label = { Text("Retour") })
        FilterChip(selected = kind == "note", onClick = { onKind("note") }, label = { Text("Note") })
    }
}

@Composable
private fun RemarkEditSheet(
    remark: Remark,
    onCancel: () -> Unit,
    onSave: (String, String, String) -> Unit,
) {
    var appName by remember { mutableStateOf(remark.app) }
    var kind by remember { mutableStateOf(remark.kind.ifBlank { "retour" }) }
    var body by remember { mutableStateOf(remark.body) }
    Column(
        Modifier.padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Modifier le ${if (kind == "note") "note" else "retour"}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        AppKindFields(appName, { appName = it }, kind, { kind = it })
        OutlinedTextField(
            body,
            { body = it },
            label = { Text("Texte") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { if (body.isNotBlank()) onSave(appName, kind, body.trim()) }) { Text("Enregistrer") }
            TextButton(onClick = onCancel) { Text("Annuler") }
        }
    }
}
