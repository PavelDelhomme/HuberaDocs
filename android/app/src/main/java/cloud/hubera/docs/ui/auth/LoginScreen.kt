package cloud.hubera.docs.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
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
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        accounts = withContext(Dispatchers.IO) { HuberaIdAccounts.listAccounts(ctx) }
        if (accounts.size == 1 && accounts.first().accessToken.isNotBlank()) {
            loading = true
            try {
                withContext(Dispatchers.IO) {
                    val acc = accounts.first()
                    api.loginSso(acc.accessToken, acc.refreshToken)
                }
                onLoggedIn()
            } catch (e: Exception) {
                error = when (e.message) {
                    "allowlist" -> "Cet e-mail n’est pas sur la liste Docs (Paul)."
                    else -> e.message ?: "SSO Hubera ID refusé — mot de passe."
                }
                otherAccount = true
            } finally {
                loading = false
            }
        }
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
                email = acc.email
                otherAccount = true
            } finally {
                loading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
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
        Text("Cahier unique (cockpit) — pas Office Docs", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(20.dp))

        if (accounts.isNotEmpty() && !twoFa) {
            Text("Continuer avec un compte déjà sur le téléphone", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            accounts.forEach { acc ->
                OutlinedButton(
                    onClick = { if (!loading) runSso(acc) },
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Continuer avec ${acc.email}")
                }
            }
            TextButtonish(
                enabled = !loading,
                onClick = { otherAccount = !otherAccount },
                label = if (otherAccount) "Masquer le formulaire" else "Utiliser un autre compte",
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
            Text("Code 2FA Bitwarden — 6 chiffres, pas le mot de passe.")
            OutlinedTextField(
                value = code,
                onValueChange = { code = it },
                label = { Text("Code") },
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

@Composable
private fun TextButtonish(enabled: Boolean, onClick: () -> Unit, label: String) {
    OutlinedButton(onClick = onClick, enabled = enabled, modifier = Modifier.fillMaxWidth()) {
        Text(label)
    }
}
