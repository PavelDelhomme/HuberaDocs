package cloud.hubera.docs.ui.docs

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DocsScreen(api: DocsApi) {
    var files by remember { mutableStateOf<List<DocFile>>(emptyList()) }
    var filter by remember { mutableStateOf("") }
    var current by remember { mutableStateOf("") }
    var markdown by remember { mutableStateOf("") }
    var saved by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        files = withContext(Dispatchers.IO) { api.docs() }
    }

    Column(Modifier.fillMaxSize().padding(horizontal = 12.dp, vertical = 8.dp)) {
        OutlinedTextField(
            value = filter,
            onValueChange = { filter = it },
            label = { Text("Filtrer") },
            modifier = Modifier.fillMaxWidth(),
        )
        LazyColumn(Modifier.weight(0.4f).padding(top = 8.dp)) {
            items(files.filter { it.path.contains(filter, true) }) { f ->
                Text(
                    f.path,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            current = f.path
                            saved = false
                            scope.launch {
                                markdown = withContext(Dispatchers.IO) { api.docFile(f.path) }
                            }
                        }
                        .padding(vertical = 8.dp),
                )
            }
        }
        if (current.isNotBlank()) {
            OutlinedTextField(
                value = markdown,
                onValueChange = { markdown = it; saved = false },
                modifier = Modifier
                    .weight(0.6f)
                    .fillMaxWidth(),
                textStyle = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
            )
            Button(
                onClick = {
                    scope.launch {
                        withContext(Dispatchers.IO) { api.saveDoc(current, markdown) }
                        saved = true
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text(if (saved) "Enregistré" else "Enregistrer le .md") }
        }
    }
}
