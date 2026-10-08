package cloud.hubera.docs.ui.docs

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.data.DocFile
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.docs.ui.markdown.MarkdownView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DocsScreen(
    api: DocsApi,
    onOpenChanged: (title: String?, onBack: (() -> Unit)?) -> Unit = { _, _ -> },
) {
    var files by remember { mutableStateOf<List<DocFile>>(emptyList()) }
    var filter by remember { mutableStateOf("") }
    var current by remember { mutableStateOf("") }
    var markdown by remember { mutableStateOf("") }
    var saved by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun closeFile() {
        current = ""
        markdown = ""
        editing = false
        onOpenChanged(null, null)
    }

    LaunchedEffect(Unit) {
        files = withContext(Dispatchers.IO) { api.docs() }
    }

    Column(Modifier.fillMaxSize().padding(horizontal = 12.dp, vertical = 8.dp)) {
        if (current.isBlank()) {
            OutlinedTextField(
                value = filter,
                onValueChange = { filter = it },
                label = { Text("Filtrer") },
                modifier = Modifier.fillMaxWidth(),
            )
            LazyColumn(Modifier.weight(1f).padding(top = 8.dp)) {
                items(files.filter { it.path.contains(filter, true) }) { f ->
                    Text(
                        f.path,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                current = f.path
                                saved = false
                                editing = false
                                onOpenChanged(f.path) { closeFile() }
                                scope.launch {
                                    markdown = withContext(Dispatchers.IO) { api.docFile(f.path) }
                                }
                            }
                            .padding(vertical = 10.dp),
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            }
        } else {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = !editing, onClick = { editing = false }, label = { Text("Aperçu") })
                FilterChip(selected = editing, onClick = { editing = true }, label = { Text("Modifier") })
            }
            if (editing) {
                OutlinedTextField(
                    value = markdown,
                    onValueChange = { markdown = it; saved = false },
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    textStyle = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                )
                Button(
                    onClick = {
                        scope.launch {
                            withContext(Dispatchers.IO) { api.saveDoc(current, markdown) }
                            saved = true
                            editing = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text(if (saved) "Enregistré" else "Enregistrer") }
            } else {
                Column(
                    Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(top = 8.dp),
                ) {
                    MarkdownView(markdown)
                }
            }
        }
    }
}
