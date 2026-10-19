package cloud.hubera.docs.data

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun formatHuberaStamp(ms: Long): String {
    if (ms <= 0L) return ""
    val fmt = SimpleDateFormat("d MMM yyyy HH:mm", Locale.FRANCE)
    return fmt.format(Date(ms))
}

fun stampLine(created: Long, updated: Long): String {
    val c = formatHuberaStamp(created)
    if (c.isEmpty()) return ""
    val u = formatHuberaStamp(if (updated > 0L) updated else created)
    return "créé le $c · modifié le $u"
}
