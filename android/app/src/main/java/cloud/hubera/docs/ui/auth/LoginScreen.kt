package cloud.hubera.docs.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import android.content.Intent
import android.net.Uri
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import cloud.hubera.docs.R
import cloud.hubera.docs.data.DocsApi
import cloud.hubera.id.sso.HuberaIdAccount
import cloud.hubera.id.sso.HuberaIdAccounts
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun LoginScreen(api: DocsApi, onLoggedIn: () -> Unit) {
    val ctx = LocalContext.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var twoFa by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var accounts by remember { mutableStateOf(listOf<HuberaIdAccount>()) }
    var otherAccount by remember { mutableStateOf(false) }
    var showChooser by remember { mutableStateOf(false) }
    var idInstalled by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        val found = withContext(Dispatchers.IO) { HuberaIdAccounts.listAccounts(ctx) }
        accounts = found
        idInstalled = withContext(Dispatchers.IO) {
            runCatching {
                ctx.packageManager.getPackageInfo("cloud.hubera.id", 0)
                true
            }.getOrDefault(false)
        }
        showChooser = true
    }

    fun runSso(acc: HuberaIdAccount) {
        loading = true
        error = null
        scope.launch {
            try {
                withContext(Dispatchers.IO) { api.loginSso(acc.accessToken, acc.refreshToken) }
                onLoggedIn()
            } catch (e: Exception) {
                error = when (e.message) {
                    "allowlist" -> "Cet e-mail n’est pas sur la liste Docs (Paul)."
                    else -> e.message ?: "SSO Hubera ID refusé."
                }
            } finally {
                loading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.systemBars)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_logo),
            contentDescription = null,
            modifier = Modifier.size(72.dp),
        )
        Spacer(Modifier.height(12.dp))
        Text("Hubera Docs", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(20.dp))

        if (showChooser && !twoFa) {
            val dark = androidx.compose.foundation.isSystemInDarkTheme()
            androidx.compose.ui.window.Dialog(onDismissRequest = {}) {
                androidx.compose.material3.Surface(
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(28.dp),
                    color = if (dark) Color(0xFF2D2E30) else Color.White,
                ) {
                    Column(Modifier.padding(top = 16.dp, bottom = 8.dp)) {
                        Text(
                            "Choisir un compte",
                            modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp),
                            color = if (dark) Color(0xFFE8EAED) else Color(0xFF202124),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Normal,
                        )
                        accounts.forEach { acc ->
                            AccountLine(
                                title = accountTitle(acc.displayName, acc.email),
                                subtitle = acc.email,
                                onClick = {
                                    showChooser = false
                                    if (acc.accessToken.isBlank() && acc.refreshToken.isBlank()) {
                                        error = "Session absente"
                                    } else {
                                        runSso(acc)
                                    }
                                },
                            )
                        }
                        AccountLine(
                            title = "Ajouter un compte",
                            add = true,
                            onClick = {
                                showChooser = false
                                otherAccount = true
                                email = ""
                                password = ""
                            },
                        )
                        if (!idInstalled) {
                            AccountLine(
                                title = "Installer Hubera ID",
                                add = true,
                                onClick = { openHuberaIdInstall(ctx) },
                            )
                        }
                    }
                }
            }
        }

        if (accounts.isNotEmpty() && !twoFa) {
            Text(
                "Choisir un compte",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Normal,
            )
            Spacer(Modifier.height(8.dp))
            accounts.forEach { acc ->
                AccountLine(
                    title = accountTitle(acc.displayName, acc.email),
                    subtitle = acc.email,
                    onClick = { if (!loading) runSso(acc) },
                )
            }
            AccountLine(
                title = "Ajouter un compte",
                add = true,
                onClick = {
                    if (!loading) {
                        otherAccount = true
                        email = ""
                        password = ""
                    }
                },
            )
            Spacer(Modifier.height(12.dp))
        }

        if (accounts.isEmpty() || otherAccount || twoFa) {
        if (!twoFa) {
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("E-mail Hubera ID") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Mot de passe") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )
        } else {
            OutlinedTextField(
                value = code,
                onValueChange = { code = it },
                label = { Text("Code 2FA") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }
        Spacer(Modifier.height(12.dp))
        Button(
            onClick = {
                loading = true
                error = null
                scope.launch {
                    try {
                        withContext(Dispatchers.IO) {
                            if (twoFa) {
                                api.login2fa(email.trim().lowercase(), code.trim())
                            } else {
                                val (need2fa, _) = api.login(email.trim().lowercase(), password)
                                if (need2fa) {
                                    twoFa = true
                                    return@withContext
                                }
                            }
                        }
                        if (!twoFa || code.isNotBlank()) onLoggedIn()
                    } catch (e: Exception) {
                        error = when (e.message) {
                            "allowlist" -> "Cet e-mail n’est pas sur la liste Docs (Paul)."
                            "invalid" -> "E-mail ou mot de passe Hubera ID refusé."
                            else -> e.message ?: "Connexion impossible."
                        }
                    } finally {
                        loading = false
                    }
                }
            },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (loading) CircularProgressIndicator(modifier = Modifier.height(18.dp), color = MaterialTheme.colorScheme.onPrimary)
            else Text(if (twoFa) "Valider" else "Entrer")
        }
        } else {
            error?.let {
                Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
            }
            if (loading) CircularProgressIndicator(modifier = Modifier.padding(top = 12.dp))
        }
    }
}

private fun openHuberaIdInstall(ctx: android.content.Context) {
    val launch = ctx.packageManager.getLaunchIntentForPackage("cloud.hubera.id")
    val intent = launch ?: Intent(Intent.ACTION_VIEW, Uri.parse("https://id.hubera.cloud/"))
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    runCatching { ctx.startActivity(intent) }
}

@Composable
private fun AccountLine(title: String, onClick: () -> Unit, subtitle: String? = null, add: Boolean = false) {
    val dark = androidx.compose.foundation.isSystemInDarkTheme()
    val ink = if (dark) androidx.compose.ui.graphics.Color(0xFFE8EAED) else androidx.compose.ui.graphics.Color(0xFF202124)
    val muted = if (dark) androidx.compose.ui.graphics.Color(0xFF9AA0A6) else androidx.compose.ui.graphics.Color(0xFF5F6368)
    val showSub = !subtitle.isNullOrBlank() && !subtitle.equals(title, ignoreCase = true)
    androidx.compose.material3.Surface(
        onClick = onClick,
        color = androidx.compose.ui.graphics.Color.Transparent,
        modifier = Modifier.fillMaxWidth(),
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            androidx.compose.foundation.layout.Box(
                modifier = Modifier
                    .size(40.dp)
                    .then(
                        if (add) Modifier.border(1.dp, muted, androidx.compose.foundation.shape.CircleShape)
                        else Modifier.background(avatarColor(subtitle ?: title), androidx.compose.foundation.shape.CircleShape),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    if (add) "+" else title.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "?",
                    color = if (add) ink else androidx.compose.ui.graphics.Color.White,
                    fontWeight = FontWeight.Medium,
                )
            }
            Spacer(Modifier.size(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = ink, maxLines = 1, style = MaterialTheme.typography.bodyLarge)
                if (showSub) Text(subtitle!!, color = muted, maxLines = 1, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

private fun accountTitle(displayName: String, email: String): String {
    val name = displayName.trim()
    if (name.isNotEmpty() && !name.equals(email, ignoreCase = true)) return name
    val local = email.substringBefore('@').trim()
    if (local.isEmpty()) return email
    return local.replaceFirstChar { if (it.isLowerCase()) it.titlecase(java.util.Locale.ROOT) else it.toString() }
}

private fun avatarColor(key: String): androidx.compose.ui.graphics.Color {
    val palette = listOf(0xFF1A73E8, 0xFF188038, 0xFFE37400, 0xFF9334E6, 0xFF007B83, 0xFFC5221F, 0xFF1967D2, 0xFF0D7377)
    var hash = 0
    for (ch in key.lowercase()) hash = (hash * 31 + ch.code) and 0x7fffffff
    return androidx.compose.ui.graphics.Color(palette[hash % palette.size])
}
