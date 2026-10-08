package cloud.hubera.docs.ui.reports

import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.data.Report
import cloud.hubera.docs.ui.markdown.MarkdownView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

@Composable
fun ReportsScreen(
    api: DocsApi,
    onOpenChanged: (title: String?, onBack: (() -> Unit)?) -> Unit = { _, _ -> },
) {
    val ctx = LocalContext.current
    var reports by remember { mutableStateOf<List<Report>>(emptyList()) }
    var open by remember { mutableStateOf<Report?>(null) }
    var pages by remember { mutableStateOf<List<Bitmap>>(emptyList()) }
    var md by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun close() {
        open = null
        md = null
        pages.forEach { if (!it.isRecycled) it.recycle() }
        pages = emptyList()
        onOpenChanged(null, null)
    }

    LaunchedEffect(Unit) {
        reports = withContext(Dispatchers.IO) { api.reports() }
    }

    DisposableEffect(open) {
        onDispose {
            pages.forEach { if (!it.isRecycled) it.recycle() }
        }
    }

    if (open == null) {
        Column(Modifier.fillMaxSize().padding(horizontal = 12.dp, vertical = 8.dp)) {
            Text(
                "PDF en pages, markdown rendu (titres, listes) — pas le brut.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodySmall,
            )
            LazyColumn(Modifier.padding(top = 8.dp)) {
                items(reports, key = { it.id + it.filename }) { r ->
                    Card(
                        Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .clickable {
                                open = r
                                md = null
                                pages = emptyList()
                                loading = true
                                onOpenChanged(r.title) { close() }
                                scope.launch {
                                    val dir = File(ctx.cacheDir, "reports")
                                    val dest = File(dir, r.filename.replace('/', '_'))
                                    withContext(Dispatchers.IO) { api.downloadReport(r.filename, dest) }
                                    if (r.filename.endsWith(".md", true) || r.kind == "md") {
                                        md = dest.readText()
                                    } else if (r.filename.endsWith(".pdf", true) || r.kind == "pdf") {
                                        pages = renderPdf(dest)
                                    } else {
                                        md = dest.readText()
                                    }
                                    loading = false
                                }
                            },
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text(r.title, style = MaterialTheme.typography.titleMedium)
                            Text(r.summary, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("${r.sentAt.take(16)} · ${r.filename}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }
    } else {
        Column(Modifier.fillMaxSize()) {
            when {
                loading -> Text("Chargement…", Modifier.padding(16.dp))
                md != null -> {
                    LazyColumn(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                        item { MarkdownView(md!!) }
                    }
                }
                else -> {
                    LazyColumn {
                        items(pages.size) { i ->
                            Image(
                                bitmap = pages[i].asImageBitmap(),
                                contentDescription = "Page ${i + 1}",
                                modifier = Modifier.fillMaxWidth().padding(8.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun renderPdf(file: File): List<Bitmap> {
    val pfd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    val renderer = PdfRenderer(pfd)
    val out = ArrayList<Bitmap>(renderer.pageCount)
    try {
        for (i in 0 until renderer.pageCount) {
            renderer.openPage(i).use { page ->
                val w = (page.width * 1.6f).toInt().coerceAtLeast(1)
                val h = (page.height * 1.6f).toInt().coerceAtLeast(1)
                val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                out.add(bmp)
            }
        }
    } finally {
        renderer.close()
        pfd.close()
    }
    return out
}
