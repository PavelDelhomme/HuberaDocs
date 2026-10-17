package cloud.hubera.docs.ui.markdown

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp

private sealed class MdBlock {
    data class Heading(val level: Int, val text: String) : MdBlock()
    data class Paragraph(val text: String) : MdBlock()
    data class Bullet(val text: String) : MdBlock()
    data class Quote(val text: String) : MdBlock()
    data class Code(val text: String) : MdBlock()
    data object Rule : MdBlock()
}

private fun parseMarkdownBlocks(source: String): List<MdBlock> {
    val out = mutableListOf<MdBlock>()
    val lines = source.replace("\r\n", "\n").split('\n')
    var i = 0
    while (i < lines.size) {
        val raw = lines[i]
        val line = raw.trimEnd()
        when {
            line.isBlank() -> i++
            line.startsWith("```") -> {
                val buf = StringBuilder()
                i++
                while (i < lines.size && !lines[i].trim().startsWith("```")) {
                    if (buf.isNotEmpty()) buf.append('\n')
                    buf.append(lines[i])
                    i++
                }
                if (i < lines.size) i++
                out += MdBlock.Code(buf.toString())
            }
            line.matches(Regex("^---+$")) || line.matches(Regex("^\\*\\*\\*+$")) -> {
                out += MdBlock.Rule
                i++
            }
            line.startsWith("# ") -> {
                out += MdBlock.Heading(1, line.removePrefix("# ").trim())
                i++
            }
            line.startsWith("## ") -> {
                out += MdBlock.Heading(2, line.removePrefix("## ").trim())
                i++
            }
            line.startsWith("### ") -> {
                out += MdBlock.Heading(3, line.removePrefix("### ").trim())
                i++
            }
            line.startsWith("> ") -> {
                out += MdBlock.Quote(line.removePrefix("> ").trim())
                i++
            }
            line.matches(Regex("^[-*]\\s+.+")) -> {
                out += MdBlock.Bullet(line.replaceFirst(Regex("^[-*]\\s+"), ""))
                i++
            }
            line.matches(Regex("^\\d+\\.\\s+.+")) -> {
                out += MdBlock.Bullet(line.replaceFirst(Regex("^\\d+\\.\\s+"), ""))
                i++
            }
            else -> {
                val buf = StringBuilder(line)
                i++
                while (i < lines.size) {
                    val n = lines[i].trimEnd()
                    if (n.isBlank() || n.startsWith("#") || n.startsWith("```") ||
                        n.startsWith("- ") || n.startsWith("* ") || n.startsWith("> ") ||
                        n.matches(Regex("^---+$"))
                    ) {
                        break
                    }
                    buf.append(' ').append(n)
                    i++
                }
                out += MdBlock.Paragraph(buf.toString())
            }
        }
    }
    return out
}

private fun inlineMarkdown(text: String, codeBg: Color): AnnotatedString = buildAnnotatedString {
    val re = Regex("""(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+]\([^)]+\))""")
    var last = 0
    for (m in re.findAll(text)) {
        append(text.substring(last, m.range.first))
        val token = m.value
        when {
            token.startsWith("**") -> withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                append(token.removeSurrounding("**"))
            }
            token.startsWith("`") -> withStyle(
                SpanStyle(
                    fontFamily = FontFamily.Monospace,
                    background = codeBg,
                ),
            ) { append(token.removeSurrounding("`")) }
            token.startsWith("[") -> {
                val label = token.substringAfter("[").substringBefore("]")
                withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) { append(label) }
            }
            else -> withStyle(SpanStyle(fontStyle = FontStyle.Italic)) {
                append(token.removeSurrounding("*"))
            }
        }
        last = m.range.last + 1
    }
    if (last < text.length) append(text.substring(last))
}

@Composable
fun MarkdownView(source: String, modifier: Modifier = Modifier) {
    val blocks = remember(source) { parseMarkdownBlocks(source) }
    val codeBg = MaterialTheme.colorScheme.surfaceVariant
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        blocks.forEach { b ->
            when (b) {
                is MdBlock.Heading -> Text(
                    b.text,
                    style = when (b.level) {
                        1 -> MaterialTheme.typography.headlineSmall
                        2 -> MaterialTheme.typography.titleLarge
                        else -> MaterialTheme.typography.titleMedium
                    },
                    fontWeight = FontWeight.Bold,
                )
                is MdBlock.Paragraph -> Text(
                    inlineMarkdown(b.text, codeBg),
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                is MdBlock.Bullet -> Row(Modifier.fillMaxWidth()) {
                    Text("•  ", fontWeight = FontWeight.Bold)
                    Text(inlineMarkdown(b.text, codeBg), modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyLarge)
                }
                is MdBlock.Quote -> Text(
                    inlineMarkdown(b.text, codeBg),
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                        .padding(12.dp),
                    style = MaterialTheme.typography.bodyLarge,
                    fontStyle = FontStyle.Italic,
                )
                is MdBlock.Code -> Text(
                    b.text,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                        .padding(12.dp),
                    fontFamily = FontFamily.Monospace,
                    style = MaterialTheme.typography.bodySmall,
                )
                MdBlock.Rule -> HorizontalDivider(Modifier.padding(vertical = 4.dp))
            }
        }
        if (blocks.isEmpty()) {
            Text("Document vide.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
