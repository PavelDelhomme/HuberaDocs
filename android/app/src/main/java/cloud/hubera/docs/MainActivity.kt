package cloud.hubera.docs

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import cloud.hubera.chrome.HuberaDrawerItem
import cloud.hubera.chrome.HuberaNavItem
import cloud.hubera.chrome.HuberaProduct
import cloud.hubera.chrome.HuberaScaffold
import cloud.hubera.docs.data.TokenStore
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.Dashboard
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.GanttBar
import cloud.hubera.docs.data.Remark
import cloud.hubera.docs.ui.account.DocsAccountScreen
import cloud.hubera.docs.ui.auth.LoginScreen
import cloud.hubera.docs.ui.docs.DocsScreen
import cloud.hubera.docs.ui.kanban.KanbanScreen
import cloud.hubera.docs.ui.reports.ReportsScreen
import cloud.hubera.docs.ui.theme.HuberaDocsTheme
import cloud.hubera.docs.update.UpdateAvailableDialog
import cloud.hubera.docs.update.UpdateChecker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.WHITE, Color.WHITE),
        )
        val app = application as DocsApp
        setContent {
            HuberaDocsTheme {
                DocsRoot(app.api, app.tokens)
            }
        }
    }
}

private val docsTabs = listOf(
    HuberaNavItem("home", "Accueil", Icons.Default.Home),
    HuberaNavItem("kanban", "Tâches", Icons.AutoMirrored.Filled.List),
    HuberaNavItem("docs", "Docs", Icons.Default.MenuBook),
    HuberaNavItem("pdf", "Rapports", Icons.Default.PictureAsPdf),
)

@Composable
private fun DocsRoot(api: DocsApi, tokens: TokenStore) {
    val ctx = LocalContext.current
    var ready by remember { mutableStateOf(false) }
    var logged by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf(tokens.email().orEmpty()) }
    val checker = remember { UpdateChecker(api, ctx.applicationContext) }
    LaunchedEffect(Unit) {
        logged = withContext(Dispatchers.IO) {
            try {
                val me = api.me()
                if (me.isNotBlank()) email = me
                me.isNotBlank()
            } catch (_: Exception) {
                false
            }
        }
        ready = true
    }
    if (!ready) return
    if (!logged) {
        LoginScreen(api) {
            logged = true
            email = tokens.email().orEmpty()
        }
        return
    }
    var tab by remember { mutableStateOf("home") }
    var showAccount by remember { mutableStateOf(false) }
    var pendingUpdate by remember { mutableStateOf<UpdateChecker.CheckResult?>(null) }
    var dlBusy by remember { mutableStateOf(false) }
    var dlProgress by remember { mutableFloatStateOf(0f) }
    val scope = rememberCoroutineScope()
    val titles = mapOf(
        "home" to "Docs",
        "kanban" to "Tâches",
        "docs" to "Docs",
        "pdf" to "Rapports",
        "gantt" to "Avance",
        "inbox" to "Retours",
        "account" to "Compte",
    )

    LaunchedEffect(logged) {
        if (!logged) return@LaunchedEffect
        val check = runCatching { checker.checkOnStartup() }.getOrNull() ?: return@LaunchedEffect
        if (check.available) pendingUpdate = check
    }

    pendingUpdate?.takeIf { it.available && logged }?.let { upd ->
        UpdateAvailableDialog(
            versionName = upd.info?.apkVersion ?: upd.info?.version,
            busy = dlBusy,
            progress = dlProgress,
            message = upd.message,
            onInstall = {
                dlBusy = true
                dlProgress = 0f
                scope.launch {
                    runCatching { checker.install { dlProgress = it } }
                    dlBusy = false
                }
            },
            onSnooze = { opt ->
                upd.info?.apkVersionCode?.takeIf { it > 0 }?.let { checker.snooze(opt, it) }
                pendingUpdate = null
            },
            onDismiss = { pendingUpdate = null },
        )
    }

    fun go(id: String) {
        showAccount = false
        tab = id
    }

    HuberaScaffold(
        title = titles[if (showAccount) "account" else tab] ?: "Docs",
        current = HuberaProduct.DOCS,
        versionLabel = "v${BuildConfig.VERSION_NAME}",
        onAccountClick = { showAccount = true },
        navItems = docsTabs,
        selectedNavId = if (showAccount || tab !in docsTabs.map { it.id }) null else tab,
        onNavSelect = { go(it) },
        userEmail = email,
        extraDrawer = { close ->
            HuberaDrawerItem("Cahier unique", Icons.Default.Home, selected = !showAccount && tab == "home") {
                close(); go("home")
            }
            HuberaDrawerItem("Kanban", Icons.AutoMirrored.Filled.List, selected = !showAccount && tab == "kanban") {
                close(); go("kanban")
            }
            HuberaDrawerItem("Docs", Icons.Default.MenuBook, selected = !showAccount && tab == "docs") {
                close(); go("docs")
            }
            HuberaDrawerItem("Rapports PDF", Icons.Default.PictureAsPdf, selected = !showAccount && tab == "pdf") {
                close(); go("pdf")
            }
            HuberaDrawerItem("Gantt", Icons.Default.Timeline, selected = !showAccount && tab == "gantt") {
                close(); go("gantt")
            }
            HuberaDrawerItem("Retours", Icons.Default.EditNote, selected = !showAccount && tab == "inbox") {
                close(); go("inbox")
            }
        },
        hideBottomNav = showAccount,
    ) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            if (showAccount) {
                DocsAccountScreen(
                    email = email,
                    api = api,
                    checker = checker,
                    onBack = { showAccount = false },
                    onLogout = {
                        showAccount = false
                        logged = false
                    },
                )
            } else when (tab) {
                "home" -> DashScreen(
                    api,
                    goKanban = { tab = "kanban" },
                    goPdf = { tab = "pdf" },
                )
                "kanban" -> KanbanScreen(api)
                "docs" -> DocsScreen(api)
                "pdf" -> ReportsScreen(api)
                "gantt" -> GanttScreen(api)
                "inbox" -> InboxScreen(api)
            }
        }
    }
}

@Composable
private fun DashScreen(
    api: DocsApi,
    goKanban: () -> Unit,
    goPdf: () -> Unit,
) {
    var dash by remember { mutableStateOf<Dashboard?>(null) }
    var err by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) {
        try {
            dash = withContext(Dispatchers.IO) { api.dashboard() }
        } catch (e: Exception) {
            err = e.message
        }
    }
    val d = dash
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            d?.subtitle ?: "Cockpit Paul — état, tâches, docs, PDF.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium,
        )
        err?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            StatCard("À faire", d?.todo ?: 0, Modifier.weight(1f), goKanban)
            StatCard("En cours", d?.doing ?: 0, Modifier.weight(1f), goKanban)
            StatCard("Faits", d?.done ?: 0, Modifier.weight(1f), goKanban)
        }
        Text("Tes derniers rapports", style = MaterialTheme.typography.titleMedium)
        d?.recentReports.orEmpty().forEach { r ->
            Card(Modifier.fillMaxWidth().clickable { goPdf() }) {
                Column(Modifier.padding(12.dp)) {
                    Text(r.title, fontWeight = FontWeight.SemiBold)
                    Text(r.summary, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        Text("Tâches récentes", style = MaterialTheme.typography.titleMedium)
        d?.recentTasks.orEmpty().forEach { t ->
            Text("• ${t.title}  (${t.project})", modifier = Modifier.clickable { goKanban() })
        }
    }
}

@Composable
private fun StatCard(label: String, n: Int, modifier: Modifier, onClick: () -> Unit) {
    Card(modifier.clickable { onClick() }) {
        Column(Modifier.padding(12.dp)) {
            Text("$n", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun GanttScreen(api: DocsApi) {
    var objective by remember { mutableStateOf("") }
    var bars by remember { mutableStateOf<List<GanttBar>>(emptyList()) }
    LaunchedEffect(Unit) {
        val pair = withContext(Dispatchers.IO) { api.gantt() }
        objective = pair.first
        bars = pair.second
    }
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(objective, color = MaterialTheme.colorScheme.onSurfaceVariant)
        bars.forEach { b ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text("${b.label} · ${b.pct}%", fontWeight = FontWeight.SemiBold)
                    LinearProgressIndicator(
                        progress = { b.pct / 100f },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    )
                    Text("${b.start} → ${b.end}", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun InboxScreen(api: DocsApi) {
    var remarks by remember { mutableStateOf<List<Remark>>(emptyList()) }
    var appName by remember { mutableStateOf("docs") }
    var body by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        remarks = withContext(Dispatchers.IO) { api.remarks() }
    }
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Un retour crée une tâche kanban priorité 1.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedTextField(appName, { appName = it }, label = { Text("App") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(body, { body = it }, label = { Text("Ce qui cloche") }, minLines = 4, modifier = Modifier.fillMaxWidth())
        Button(onClick = {
            if (body.isBlank()) return@Button
            scope.launch {
                withContext(Dispatchers.IO) { api.addRemark(appName.trim(), body.trim()) }
                body = ""
                remarks = withContext(Dispatchers.IO) { api.remarks() }
            }
        }, modifier = Modifier.fillMaxWidth()) { Text("Enregistrer → tâche") }
        remarks.forEach { r ->
            Text("${r.app} — ${r.body}", style = MaterialTheme.typography.bodySmall)
        }
    }
}
