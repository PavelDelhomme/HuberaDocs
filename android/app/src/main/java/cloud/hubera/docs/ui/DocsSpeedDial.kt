package cloud.hubera.docs.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material.icons.outlined.Feedback
import androidx.compose.material.icons.outlined.StickyNote2
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.ui.theme.HuberaOrange

@Composable
fun DocsSpeedDial(
    expanded: Boolean,
    onToggle: () -> Unit,
    onTask: () -> Unit,
    onRetour: () -> Unit,
    onNote: () -> Unit,
) {
    Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (expanded) {
            SpeedItem("Tâche", Icons.Outlined.Assignment, onTask)
            SpeedItem("Retour", Icons.Outlined.Feedback, onRetour)
            SpeedItem("Note", Icons.Outlined.StickyNote2, onNote)
        }
        FloatingActionButton(
            onClick = onToggle,
            containerColor = HuberaOrange,
        ) {
            Icon(
                if (expanded) Icons.Default.Close else Icons.Default.Add,
                contentDescription = if (expanded) "Fermer" else "Ajouter",
            )
        }
    }
}

@Composable
private fun SpeedItem(label: String, icon: ImageVector, onClick: () -> Unit) {
    ExtendedFloatingActionButton(
        onClick = onClick,
        icon = { Icon(icon, contentDescription = null) },
        text = { Text(label) },
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
    )
}
