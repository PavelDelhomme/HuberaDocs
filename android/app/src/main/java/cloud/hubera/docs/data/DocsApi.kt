package cloud.hubera.docs.data

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

data class Task(
    val id: String,
    val title: String,
    val body: String,
    val project: String,
    val category: String,
    val columnId: String,
    val priority: Int,
)

data class Column(val id: String, val label: String, val position: Int)

data class Report(
    val id: String,
    val title: String,
    val kind: String,
    val sentAt: String,
    val filename: String,
    val summary: String,
)

data class DocFile(val path: String, val bytes: Int)

data class GanttBar(val id: String, val label: String, val start: String, val end: String, val pct: Int)

data class Remark(val id: String, val app: String, val body: String, val kind: String = "retour")

data class Dashboard(
    val title: String,
    val subtitle: String,
    val email: String,
    val todo: Int,
    val doing: Int,
    val done: Int,
    val remarks: Int,
    val recentReports: List<Report>,
    val recentTasks: List<Task>,
)

data class VersionInfo(
    val version: String,
    val forceUpdate: Boolean,
    val mandatory: Boolean,
    val apkAvailable: Boolean,
    val apkUrl: String?,
    val apkVersion: String?,
    val apkVersionCode: Int = 0,
)

data class VersionNote(
    val version: String,
    val date: String,
    val title: String,
    val notes: List<String>,
)

class AuthException : Exception("auth")

class DocsApi(
    private val base: String,
    private val tokens: TokenStore,
) {
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    private val http = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    private fun url(path: String) = base.trimEnd('/') + path

    private fun req(path: String): Request.Builder {
        val b = Request.Builder().url(url(path))
        tokens.token()?.let { b.header("Authorization", "Bearer $it") }
        return b
    }

    private fun exec(request: Request): String {
        http.newCall(request).execute().use { resp ->
            val body = resp.body?.string().orEmpty()
            if (resp.code == 401) throw AuthException()
            if (!resp.isSuccessful) {
                val err = runCatching { JSONObject(body).optString("error") }.getOrNull()
                throw IllegalStateException(err?.takeIf { it.isNotBlank() } ?: "HTTP ${resp.code}")
            }
            return body
        }
    }

    private fun get(path: String) = JSONObject(exec(req(path).get().build()))

    private fun send(method: String, path: String, payload: JSONObject): JSONObject {
        val body = payload.toString().toRequestBody(jsonType)
        val b = req(path)
        val request = when (method) {
            "POST" -> b.post(body).build()
            "PATCH" -> b.patch(body).build()
            "PUT" -> b.put(body).build()
            else -> b.get().build()
        }
        return JSONObject(exec(request))
    }

    fun me(): String {
        val o = get("/api/auth/me")
        return o.optString("email")
    }

    fun login(email: String, password: String): Pair<Boolean, String?> {
        val o = send(
            "POST",
            "/api/auth/login",
            JSONObject().put("email", email).put("password", password),
        )
        if (o.optBoolean("requires_2fa")) return true to null
        val token = o.optString("token")
        val mail = o.optString("email")
        if (!o.optBoolean("ok") || token.isBlank()) {
            throw IllegalStateException(o.optString("error", "invalid"))
        }
        tokens.save(token, mail)
        return false to mail
    }

    fun loginSso(accessToken: String, refreshToken: String = ""): String {
        val o = send(
            "POST",
            "/api/auth/login/sso",
            JSONObject()
                .put("access_token", accessToken)
                .put("refresh_token", refreshToken),
        )
        val token = o.optString("token")
        val mail = o.optString("email")
        if (!o.optBoolean("ok") || token.isBlank()) {
            throw IllegalStateException(o.optString("error", "invalid"))
        }
        tokens.save(token, mail)
        return mail
    }

    fun login2fa(email: String, code: String): String {
        val o = send(
            "POST",
            "/api/auth/login/2fa",
            JSONObject().put("email", email).put("code", code),
        )
        val token = o.optString("token")
        val mail = o.optString("email")
        if (!o.optBoolean("ok") || token.isBlank()) throw IllegalStateException("invalid")
        tokens.save(token, mail)
        return mail
    }

    fun logout() {
        runCatching {
            exec(req("/api/auth/logout").post("{}".toRequestBody(jsonType)).build())
        }
        tokens.clear()
    }

    fun dashboard(): Dashboard {
        val o = get("/api/dashboard")
        val byCol = o.optJSONArray("byCol") ?: JSONArray()
        fun count(id: String): Int {
            for (i in 0 until byCol.length()) {
                val c = byCol.getJSONObject(i)
                if (c.optString("column_id") == id) return c.optInt("c")
            }
            return 0
        }
        return Dashboard(
            title = o.optString("title", "Cahier unique"),
            subtitle = o.optString("subtitle"),
            email = o.optString("email"),
            todo = count("todo"),
            doing = count("doing"),
            done = count("done"),
            remarks = o.optInt("remarks"),
            recentReports = parseReports(o.optJSONArray("recentReports")),
            recentTasks = parseTasks(o.optJSONArray("recentTasks")),
        )
    }

    fun tasks(): List<Task> {
        val o = get("/api/tasks")
        return parseTasks(o.optJSONArray("tasks"))
    }

    fun columns(): List<Column> {
        val o = get("/api/columns")
        val arr = o.optJSONArray("columns") ?: JSONArray()
        return (0 until arr.length()).map { i ->
            val c = arr.getJSONObject(i)
            Column(c.optString("id"), c.optString("label"), c.optInt("position"))
        }
    }

    fun createColumn(label: String): Column {
        val o = send("POST", "/api/columns", JSONObject().put("label", label))
        return Column(o.optString("id"), o.optString("label"), o.optInt("position"))
    }

    fun createTask(title: String, body: String, project: String, category: String, columnId: String, priority: Int = 2) {
        send(
            "POST",
            "/api/tasks",
            JSONObject()
                .put("title", title)
                .put("body", body)
                .put("project", project)
                .put("category", category)
                .put("column_id", columnId)
                .put("priority", priority.coerceIn(1, 5)),
        )
    }

    fun patchTask(id: String, title: String, body: String, columnId: String, project: String, priority: Int) {
        send(
            "PATCH",
            "/api/tasks/$id",
            JSONObject()
                .put("title", title)
                .put("body", body)
                .put("column_id", columnId)
                .put("project", project)
                .put("priority", priority.coerceIn(1, 5)),
        )
    }

    fun patchPriority(id: String, priority: Int) {
        send("PATCH", "/api/tasks/$id", JSONObject().put("priority", priority.coerceIn(1, 5)))
    }

    fun docs(): List<DocFile> {
        val o = get("/api/docs")
        val arr = o.optJSONArray("files") ?: JSONArray()
        return (0 until arr.length()).map { i ->
            val f = arr.getJSONObject(i)
            DocFile(f.optString("path"), f.optInt("bytes"))
        }
    }

    fun docFile(path: String): String {
        val request = req("/api/docs/file?path=" + java.net.URLEncoder.encode(path, "UTF-8")).get().build()
        return exec(request)
    }

    fun saveDoc(path: String, markdown: String) {
        send("PUT", "/api/docs/file", JSONObject().put("path", path).put("markdown", markdown))
    }

    fun reports(): List<Report> {
        val o = get("/api/reports")
        return parseReports(o.optJSONArray("reports"))
    }

    fun downloadReport(filename: String, dest: File) {
        val request = req("/api/reports/file/" + java.net.URLEncoder.encode(filename, "UTF-8")).get().build()
        http.newCall(request).execute().use { resp ->
            if (resp.code == 401) throw AuthException()
            if (!resp.isSuccessful) throw IllegalStateException("HTTP ${resp.code}")
            dest.parentFile?.mkdirs()
            dest.outputStream().use { out -> resp.body?.byteStream()?.copyTo(out) }
        }
    }

    fun gantt(): Pair<String, List<GanttBar>> {
        val o = get("/api/gantt")
        val arr = o.optJSONArray("bars") ?: JSONArray()
        val bars = (0 until arr.length()).map { i ->
            val b = arr.getJSONObject(i)
            GanttBar(
                b.optString("id"),
                b.optString("label"),
                b.optString("start"),
                b.optString("end"),
                b.optInt("pct"),
            )
        }
        return o.optString("objective") to bars
    }

    fun remarks(): List<Remark> {
        val o = get("/api/remarks")
        val arr = o.optJSONArray("remarks") ?: JSONArray()
        return (0 until arr.length()).map { i ->
            val r = arr.getJSONObject(i)
            Remark(
                r.optString("id"),
                r.optString("app"),
                r.optString("body"),
                r.optString("kind").ifBlank { "retour" },
            )
        }
    }

    fun addRemark(app: String, body: String, kind: String = "retour") {
        send(
            "POST",
            "/api/remarks",
            JSONObject().put("app", app).put("body", body).put("kind", kind),
        )
    }

    fun patchRemark(id: String, app: String, body: String, kind: String) {
        send(
            "PATCH",
            "/api/remarks/$id",
            JSONObject().put("app", app).put("body", body).put("kind", kind),
        )
    }

    fun version(clientVersion: String, clientCode: Int, pkg: String): VersionInfo {
        val q =
            "/api/version?clientVersion=${java.net.URLEncoder.encode(clientVersion, "UTF-8")}" +
                "&clientVersionCode=$clientCode" +
                "&clientPackage=${java.net.URLEncoder.encode(pkg, "UTF-8")}"
        val o = get(q)
        return VersionInfo(
            version = o.optString("version"),
            forceUpdate = o.optBoolean("forceUpdate"),
            mandatory = o.optBoolean("mandatory"),
            apkAvailable = o.optBoolean("apkAvailable"),
            apkUrl = o.optString("apkUrl").takeIf { it.isNotBlank() && it != "null" },
            apkVersion = o.optString("apkVersion").takeIf { it.isNotBlank() && it != "null" },
            apkVersionCode = o.optInt("apkVersionCode"),
        )
    }

    fun versionNotes(): List<VersionNote> {
        val o = get("/api/version-notes")
        val arr = o.optJSONArray("versions") ?: JSONArray()
        return (0 until arr.length()).map { i ->
            val v = arr.getJSONObject(i)
            val notes = v.optJSONArray("notes") ?: JSONArray()
            VersionNote(
                version = v.optString("version"),
                date = v.optString("date"),
                title = v.optString("title"),
                notes = (0 until notes.length()).map { notes.optString(it) },
            )
        }
    }

    /**
     * Écrit l’APK. Si [dest] fait déjà au moins 100 Ko, envoie `Range` et
     * n’ajoute que le complément (206). Un 200 ignore le Range : on réécrit.
     */
    fun downloadApk(dest: File, pkg: String = "", onProgress: ((Float) -> Unit)? = null) {
        val q = if (pkg.isNotBlank()) {
            "/api/apk?package=" + java.net.URLEncoder.encode(pkg, "UTF-8")
        } else {
            "/api/apk"
        }
        dest.parentFile?.mkdirs()
        val existing = if (dest.isFile) dest.length() else 0L
        val builder = req(q).get()
        if (existing >= 100_000L) {
            builder.header("Range", "bytes=$existing-")
        }
        http.newCall(builder.build()).execute().use { resp ->
            if (resp.code == 401) throw AuthException()
            if (resp.code == 416) return
            if (!resp.isSuccessful) throw IllegalStateException("HTTP ${resp.code}")
            val append = resp.code == 206 && existing > 0L
            val body = resp.body ?: throw IllegalStateException("empty")
            val bodyLen = body.contentLength()
            val base = if (append) existing else 0L
            val total = if (bodyLen > 0) base + bodyLen else -1L
            FileOutputStream(dest, append).use { out ->
                body.byteStream().use { input ->
                    val buf = ByteArray(64 * 1024)
                    var read = base
                    while (true) {
                        val n = input.read(buf)
                        if (n < 0) break
                        out.write(buf, 0, n)
                        read += n
                        if (total > 0) onProgress?.invoke((read.toFloat() / total).coerceIn(0f, 1f))
                    }
                }
            }
        }
    }

    private fun parseTasks(arr: JSONArray?): List<Task> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).map { i ->
            val t = arr.getJSONObject(i)
            Task(
                id = t.optString("id"),
                title = t.optString("title"),
                body = t.optString("body"),
                project = t.optString("project"),
                category = t.optString("category"),
                columnId = t.optString("column_id"),
                priority = t.optInt("priority", 2),
            )
        }
    }

    private fun parseReports(arr: JSONArray?): List<Report> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).map { i ->
            val r = arr.getJSONObject(i)
            Report(
                id = r.optString("id"),
                title = r.optString("title"),
                kind = r.optString("kind"),
                sentAt = r.optString("sent_at"),
                filename = r.optString("filename"),
                summary = r.optString("summary"),
            )
        }
    }
}
