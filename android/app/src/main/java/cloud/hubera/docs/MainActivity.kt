package cloud.hubera.docs

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import cloud.hubera.chrome.HuberaNavItem
import cloud.hubera.chrome.HuberaProduct
import cloud.hubera.chrome.HuberaScaffold
import cloud.hubera.chrome.LocalHuberaCloseDrawer
import cloud.hubera.docs.data.TokenStore
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.Dashboard
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.DocsIdSession
import cloud.hubera.docs.data.GanttBar
import cloud.hubera.docs.ui.DocsSpeedDial
import cloud.hubera.docs.ui.account.DocsAccountScreen
import cloud.hubera.docs.ui.auth.LoginScreen
import cloud.hubera.docs.ui.docs.DocsScreen
import cloud.hubera.docs.ui.inbox.InboxScreen
import cloud.hubera.docs.ui.kanban.KanbanScreen
import cloud.hubera.docs.ui.reports.ReportsScreen
import cloud.hubera.docs.ui.theme.DocsThemeChoice
import cloud.hubera.docs.ui.theme.DocsThemeStore
import cloud.hubera.docs.ui.theme.HuberaDocsTheme
import cloud.hubera.docs.ui.theme.isDark
import cloud.hubera.docs.update.UpdateAvailableDialog
import cloud.hubera.docs.update.UpdateChecker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as DocsApp
        val themeStore = DocsThemeStore(app)
        val systemDark = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES
        applySystemBars(themeStore.read().isDark(systemDark))
        setContent {
            var themeChoice by remember { mutableStateOf(themeStore.read()) }
            val dark = themeChoice.isDark(isSystemInDarkTheme())
            val view = LocalView.current
            SideEffect {
                (view.context as? MainActivity)?.applySystemBars(dark)
            }
            HuberaDocsTheme(choice = themeChoice) {
                DocsRoot(
                    api = app.api,
                    tokens = app.tokens,
                    themeChoice = themeChoice,
                    onThemeChoice = {
                        themeChoice = it
                        themeStore.write(it)
                    },
                )
            }
        }
    }

    private fun applySystemBars(dark: Boolean) {
        val bg = if (dark) 0xFF0C1216.toInt() else 0xFFF4F7F8.toInt()
        window.setBackgroundDrawable(ColorDrawable(bg))
        val style = if (dark) {
            SystemBarStyle.dark(Color.TRANSPARENT)
        } else {
            SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
        }
        enableEdgeToEdge(statusBarStyle = style, navigationBarStyle = style)
    }
}

private val docsTabs = listOf(
    HuberaNavItem("home", "Accueil", Icons.Default.Home),
    HuberaNavItem("kanban", "Tâches", Icons.AutoMirrored.Filled.List),
    HuberaNavItem("docs", "Docs", Icons.Default.MenuBook),
    HuberaNavItem("pdf", "Rapports", Icons.Default.PictureAsPdf),
)

@Composable
private fun DocsRoot(
    api: DocsApi,
    tokens: TokenStore,
    themeChoice: DocsThemeChoice,
    onThemeChoice: (DocsThemeChoice) -> Unit,
) {
    val ctx = LocalContext.current
    val activity = ctx as? Activity
    var ready by remember { mutableStateOf(false) }
    var logged by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf(tokens.email().orEmpty()) }
    val checker = remember { UpdateChecker(api, ctx.applicationContext) }
    LaunchedEffect(Unit) {
        logged = withContext(Dispatchers.IO) {
            val local = try {
                api.me()
            } catch (_: Exception) {
                ""
            }
            if (local.isNotBlank()) {
                email = local
                true
            } else {
                val mail = DocsIdSession.trySilent(ctx, api, tokens.email())
                if (!mail.isNullOrBlank()) {
                    email = mail
                    true
                } else {
                    false
                }
            }
        }
        ready = true
    }
    if (!ready) {
        BackHandler { activity?.moveTaskToBack(true) }
        return
    }
    if (!logged) {
        BackHandler { activity?.moveTaskToBack(true) }
        LoginScreen(api) {
            logged = true
            email = tokens.email().orEmpty()
        }
        return
    }
    var tab by remember { mutableStateOf("home") }
    var showAccount by remember { mutableStateOf(false) }
    var fabOpen by remember { mutableStateOf(false) }
    var pendingNewTask by remember { mutableStateOf(false) }
    var inboxKindIntent by remember { mutableStateOf<String?>(null) }
    var nestedTitle by remember { mutableStateOf<String?>(null) }
    var nestedBack by remember { mutableStateOf<(() -> Unit)?>(null) }
    var pendingUpdate by remember { mutableStateOf<UpdateChecker.CheckResult?>(null) }
    var dlBusy by remember { mutableStateOf(false) }
    var dlProgress by remember { mutableFloatStateOf(0f) }
    var dlNote by remember { mutableStateOf<String?>(null) }
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
            message = dlNote ?: upd.message,
            releaseNotes = dlNote ?: upd.message,
            onInstall = {
                dlBusy = true
                dlProgress = 0f
                dlNote = null
                scope.launch {
                    val msg = runCatching {
                        checker.install(
                            onProgress = { dlProgress = it },
                            onStatus = { dlNote = it },
                        )
                    }.getOrElse { it.message ?: "Échec" }
                    if (!msg.startsWith("Installation")) dlNote = msg
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
        nestedTitle = null
        nestedBack = null
        tab = id
    }

    fun setNested(title: String?, back: (() -> Unit)?) {
        nestedTitle = title
        nestedBack = back
    }

    BackHandler {
        val back = nestedBack
        when {
            back != null -> back()
            showAccount -> showAccount = false
            else -> activity?.moveTaskToBack(true)
        }
    }

    HuberaScaffold(
        title = nestedTitle ?: titles[if (showAccount) "account" else tab] ?: "Docs",
        current = HuberaProduct.DOCS,
        versionLabel = "v${BuildConfig.VERSION_NAME}",
        onAccountClick = {
            nestedTitle = null
            nestedBack = null
            showAccount = true
        },
        navItems = docsTabs,
        selectedNavId = if (showAccount || nestedBack != null || tab !in docsTabs.map { it.id }) null else tab,
        onNavSelect = { go(it) },
        userEmail = email,
        hideBottomNav = showAccount || nestedBack != null,
        extraDrawer = {
            val closeDrawer = LocalHuberaCloseDrawer.current
            Text(
                "Dans Docs",
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            )
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable {
                        closeDrawer()
                        go("inbox")
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.EditNote, contentDescription = null)
                Spacer(Modifier.width(12.dp))
                Text("Retours")
            }
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable {
                        closeDrawer()
                        go("gantt")
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Timeline, contentDescription = null)
                Spacer(Modifier.width(12.dp))
                Text("Gantt")
            }
        },
        floatingActionButton = {
            if (!showAccount && nestedBack == null) {
                DocsSpeedDial(
                    expanded = fabOpen,
                    onToggle = { fabOpen = !fabOpen },
                    onTask = {
                        fabOpen = false
                        go("kanban")
                        pendingNewTask = true
                    },
                    onRetour = {
                        fabOpen = false
                        inboxKindIntent = "retour"
                        go("inbox")
                    },
                    onNote = {
                        fabOpen = false
                        inboxKindIntent = "note"
                        go("inbox")
                    },
                )
            }
        },
    ) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            if (showAccount) {
                DocsAccountScreen(
                    email = email,
                    api = api,
                    checker = checker,
                    themeChoice = themeChoice,
                    onThemeChoice = onThemeChoice,
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
                "kanban" -> KanbanScreen(
                    api,
                    openNew = pendingNewTask,
                    onOpenNewConsumed = { pendingNewTask = false },
                )
                "docs" -> DocsScreen(api, onOpenChanged = ::setNested)
                "pdf" -> ReportsScreen(api, onOpenChanged = ::setNested)
                "gantt" -> GanttScreen(api)
                "inbox" -> InboxScreen(
                    api,
                    kindIntent = inboxKindIntent,
                    onKindConsumed = { inboxKindIntent = null },
                )
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

