package cloud.hubera.chrome

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.systemGestureExclusion
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/** Ferme le tiroir. Les lignes l’appellent avant de naviguer. */
val LocalHuberaCloseDrawer = staticCompositionLocalOf<() -> Unit> { {} }

@Composable
fun HuberaAccountButton(
    onClick: () -> Unit,
    userPicture: @Composable (() -> Unit)? = null,
) {
    IconButton(onClick = onClick) {
        if (userPicture != null) {
            userPicture()
        } else {
            Box(
                Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = "Compte",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HuberaTopBar(
    title: String,
    onMenuClick: () -> Unit,
    onAccountClick: () -> Unit,
    extraActions: @Composable RowScope.() -> Unit = {},
    userPicture: @Composable (() -> Unit)? = null,
) {
    TopAppBar(
        title = {
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        },
        navigationIcon = {
            IconButton(onClick = onMenuClick) {
                Icon(Icons.Default.Menu, contentDescription = "Menu")
            }
        },
        actions = {
            extraActions()
        },
        windowInsets = WindowInsets.safeDrawing.only(WindowInsetsSides.Top),
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface,
        ),
    )
}

@Composable
fun HuberaDrawerContent(
    current: HuberaProduct,
    versionLabel: String,
    onAccountClick: () -> Unit,
    userEmail: String? = null,
    extra: @Composable ColumnScope.() -> Unit = {},
) {
    Column(
        Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState()),
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(4.dp)
                .background(HuberaOrange),
        )
        Row(
            Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(HuberaTeal.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(current.icon, contentDescription = null, tint = HuberaTeal)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("Hubera ${current.title}", fontWeight = FontWeight.Bold)
                Text(
                    userEmail?.takeIf { it.isNotBlank() } ?: "Compte Hubera",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            IconButton(onClick = LocalHuberaCloseDrawer.current) {
                Icon(Icons.Default.Close, contentDescription = "Fermer le menu")
            }
        }
        extra()
        Row(
            Modifier
                .fillMaxWidth()
                .clickable(onClick = onAccountClick)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Outlined.Person, contentDescription = null)
            Spacer(Modifier.width(12.dp))
            Text("Compte")
        }
        Row(
            Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Outlined.Info, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.width(12.dp))
            Text(
                versionLabel,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
fun HuberaBottomNav(
    items: List<HuberaNavItem>,
    selectedId: String?,
    onSelect: (String) -> Unit,
) {
    if (items.isEmpty()) return
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        windowInsets = WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom),
    ) {
        items.forEach { item ->
            NavigationBarItem(
                selected = item.id == selectedId,
                onClick = { onSelect(item.id) },
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
                alwaysShowLabel = true,
            )
        }
    }
}

/**
 * Squelette Google-like : hamburger à gauche, titre, compte à droite, drawer suite, nav bas.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HuberaScaffold(
    title: String,
    current: HuberaProduct,
    versionLabel: String,
    onAccountClick: () -> Unit,
    navItems: List<HuberaNavItem>,
    selectedNavId: String?,
    onNavSelect: (String) -> Unit,
    userEmail: String? = null,
    extraActions: @Composable RowScope.() -> Unit = {},
    extraDrawer: @Composable ColumnScope.() -> Unit = {},
    userPicture: @Composable (() -> Unit)? = null,
    floatingActionButton: @Composable () -> Unit = {},
    snackbarHost: @Composable () -> Unit = {},
    bottomBarExtra: @Composable () -> Unit = {},
    hideBottomNav: Boolean = false,
    hideTopBar: Boolean = false,
    content: @Composable (PaddingValues) -> Unit,
) {
    var drawerOpen by remember { mutableStateOf(false) }
    val closeDrawer = { drawerOpen = false }
    CompositionLocalProvider(LocalHuberaCloseDrawer provides closeDrawer) {
        Box(Modifier.fillMaxSize()) {
            Scaffold(
                topBar = {
                    if (!hideTopBar) {
                        HuberaTopBar(
                            title = title,
                            onMenuClick = { drawerOpen = !drawerOpen },
                            onAccountClick = onAccountClick,
                            extraActions = {
                                extraActions()
                                HuberaAccountButton(onClick = onAccountClick, userPicture = userPicture)
                            },
                            userPicture = userPicture,
                        )
                    }
                },
                bottomBar = {
                    Column {
                        bottomBarExtra()
                        if (!hideBottomNav) {
                            HuberaBottomNav(navItems, selectedNavId, onNavSelect)
                        }
                    }
                },
                contentWindowInsets = WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal),
                floatingActionButton = floatingActionButton,
                snackbarHost = snackbarHost,
                content = content,
            )
            if (!drawerOpen) {
                // Bande étroite : un glissement depuis le bord ouvre le tiroir, le reste de l’écran reste cliquable.
                Box(
                    Modifier
                        .align(Alignment.CenterStart)
                        .width(28.dp)
                        .fillMaxHeight()
                        .systemGestureExclusion()
                        .pointerInput(Unit) {
                            val openAfter = 36f
                            awaitEachGesture {
                                val down = awaitFirstDown(requireUnconsumed = false)
                                down.consume()
                                val startX = down.position.x
                                var opened = false
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val change = event.changes.firstOrNull() ?: break
                                    if (!change.pressed) break
                                    if (!opened && change.position.x - startX > openAfter) {
                                        opened = true
                                        drawerOpen = true
                                    }
                                    change.consume()
                                }
                            }
                        },
                )
            } else {
                Row(Modifier.fillMaxSize()) {
                    Surface(
                        Modifier
                            .width(304.dp)
                            .fillMaxHeight(),
                        color = MaterialTheme.colorScheme.surface,
                    ) {
                        Box(Modifier.windowInsetsPadding(WindowInsets.safeDrawing)) {
                            HuberaDrawerContent(
                                current = current,
                                versionLabel = versionLabel,
                                onAccountClick = {
                                    closeDrawer()
                                    onAccountClick()
                                },
                                userEmail = userEmail,
                                extra = extraDrawer,
                            )
                        }
                    }
                    Box(
                        Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .background(Color.Black.copy(alpha = 0.32f))
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                                onClick = closeDrawer,
                            ),
                    )
                }
            }
        }
    }
    // Enregistré après le contenu : le retour ferme le tiroir avant de quitter l’écran.
    BackHandler(enabled = drawerOpen, onBack = closeDrawer)
}
