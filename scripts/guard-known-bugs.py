#!/usr/bin/env python3
# Lancer : python3 scripts/guard-known-bugs.py
# Depuis le dépôt Hubera Docs. Échoue (code 1) si un ancien bug revient.
# Réseau requis vers *.hubera.cloud. Aucun téléphone Nothing. Aucun secret.
"""Catalogue des régressions déjà corrigées. Une ligne par contrôle."""
from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from urllib.parse import urljoin

FLOORS = {
    "music": ("1.3.374", 10674),
    "maps": ("0.1.110", 111),
    "fuel": ("1.4.182", 206),
    "mail": ("1.0.27", 28),
    "drive": ("1.0.16", 17),
    "photos": ("1.0.20", 21),
    "contacts": ("0.1.14", 15),
    "calendar": ("0.1.20", 21),
    "notes": ("0.1.17", 18),
    "tasks": ("0.1.10", 11),
    "pass": ("0.1.11", 12),
    "cook": ("0.1.13", 14),
    "id": ("0.1.13", 113),
    "docs": ("0.2.22", 222),
    "admin": ("0.1.11", 12),
    "jobs": ("1.0.70", 70),
}

FEEDS = {
    "music": "https://music.hubera.cloud/api/version",
    "maps": "https://maps.hubera.cloud/updates.json",
    "fuel": "https://fuel.hubera.cloud/updates.json",
    "mail": "https://mail.hubera.cloud/updates.json",
    "drive": "https://drive.hubera.cloud/updates.json",
    "photos": "https://photos.hubera.cloud/updates.json",
    "contacts": "https://contacts.hubera.cloud/updates.json",
    "calendar": "https://calendar.hubera.cloud/updates.json",
    "notes": "https://notes.hubera.cloud/updates.json",
    "tasks": "https://tasks.hubera.cloud/updates.json",
    "pass": "https://pass.hubera.cloud/updates.json",
    "cook": "https://cook.hubera.cloud/updates.json",
    "id": "https://id.hubera.cloud/updates.json",
    "docs": "https://docs.hubera.cloud/updates.json",
    "admin": "https://cloudity.delhomme.ovh/updates.json",
    "jobs": "https://jobs.hubera.cloud/updates.json",
}

CTX = ssl.create_default_context()
FAILS = 0


def line(ok: bool, name: str, detail: str) -> None:
    global FAILS
    if not ok:
        FAILS += 1
    print(f"{'OK' if ok else 'FAIL'}  {name}  {detail}")


def fetch(url: str, timeout: float = 12.0) -> tuple[int, str, bytes]:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "hubera-guard"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as res:
        raw = res.read(800_000)
        return res.status, (res.headers.get("Content-Type") or ""), raw


def semver_tuple(v: str) -> tuple[int, ...]:
    clean = str(v or "").replace("p+", "").replace("d+", "").replace("b+", "").strip()
    parts = []
    for piece in clean.split("."):
        digits = ""
        for ch in piece:
            if ch.isdigit():
                digits += ch
            else:
                break
        parts.append(int(digits or 0))
    return tuple(parts)


def pkg_of(node: dict) -> str:
    return str(node.get("package") or node.get("packageName") or "").strip()


def apk_of(node: dict) -> str:
    return str(node.get("apk") or node.get("apk_url") or node.get("apkUrl") or "").strip()


def check_feed(slug: str, url: str) -> None:
    floor_ver, floor_code = FLOORS[slug]
    try:
        status, ctype, raw = fetch(url)
    except Exception as exc:
        line(False, f"ota:{slug}", f"injoignable {type(exc).__name__}")
        return
    try:
        data = json.loads(raw.decode("utf-8", "replace"))
    except Exception:
        line(False, f"ota:{slug}", f"pas du JSON status={status} type={ctype.split(';')[0]}")
        return
    if not isinstance(data, dict):
        line(False, f"ota:{slug}", "JSON qui n’est pas un objet")
        return
    top = pkg_of(data)
    canon = data.get("canonical") if isinstance(data.get("canonical"), dict) else {}
    first = top or pkg_of(canon)
    apk_hint = apk_of(canon) or apk_of(data)
    if not first.startswith("cloud.hubera."):
        found = re.search(r"package=(cloud\.hubera\.[a-z0-9.]+)", apk_hint)
        if found:
            first = found.group(1)
    version = str((canon or data).get("version") or data.get("version") or "")
    code = (canon or data).get("versionCode")
    if code is None:
        code = data.get("versionCode")
    if code is None:
        code = data.get("apkVersionCode")
    try:
        code_n = int(code or 0)
    except (TypeError, ValueError):
        code_n = 0
    force = data.get("forceUpdate")
    mandatory = data.get("mandatory")
    problems = []
    if not first.startswith("cloud.hubera."):
        problems.append(f"paquet {first or 'absent'} pas cloud.hubera en premier")
    if semver_tuple(version) < semver_tuple(floor_ver):
        problems.append(f"version {version} sous le plancher {floor_ver}")
    if code_n and code_n < floor_code:
        problems.append(f"code {code_n} sous le plancher {floor_code}")
    if force is True:
        problems.append("forceUpdate true")
    if mandatory is True:
        problems.append("mandatory true")
    apk = apk_of(canon) or apk_of(data)
    if apk and not apk.endswith("/install"):
        abs_apk = urljoin(url, apk)
        try:
            req = urllib.request.Request(abs_apk, headers={"Range": "bytes=0-3", "User-Agent": "hubera-guard"})
            with urllib.request.urlopen(req, timeout=12, context=CTX) as res:
                magic = res.read(4)
            if magic != b"PK\x03\x04":
                problems.append(f"APK magic {magic.hex() or 'vide'}")
        except urllib.error.HTTPError as exc:
            if exc.code not in (401, 403):
                problems.append(f"APK HTTP {exc.code}")
        except Exception as exc:
            problems.append(f"APK illisible {type(exc).__name__}")
    # N-1 doit voir une mise à jour, N ne doit pas, quand le flux compare.
    n_ver, n_code = version, code_n or floor_code
    prev_code = max(1, (code_n or floor_code) - 1)
    q = f"{url}{'&' if '?' in url else '?'}clientVersion={floor_ver}&clientVersionCode={prev_code}&clientPackage=cloud.hubera.{slug}"
    qn = f"{url}{'&' if '?' in url else '?'}clientVersion={n_ver}&clientVersionCode={n_code}&clientPackage=cloud.hubera.{slug}"
    try:
        _, _, raw_prev = fetch(q)
        _, _, raw_now = fetch(qn)
        prev = json.loads(raw_prev.decode())
        now = json.loads(raw_now.decode())
        # Un fichier statique ne change pas avec clientVersion : le téléphone compare le code.
        # On n'exige apkAvailable false pour N que si le flux compare vraiment.
        compares = json.dumps(prev, sort_keys=True) != json.dumps(now, sort_keys=True)
        if compares and "apkAvailable" in prev and prev.get("apkAvailable") is not True:
            problems.append("apkAvailable faux pour N-1")
        if compares and "apkAvailable" in now and now.get("apkAvailable") is not False:
            problems.append("apkAvailable encore vrai pour N")
    except Exception as exc:
        problems.append(f"comparaison N/N-1 {type(exc).__name__}")
    line(not problems, f"ota:{slug}", " ".join(problems) if problems else f"{version}/{code_n} {first}")


def check_docs_health() -> None:
    try:
        _, _, raw = fetch("https://docs.hubera.cloud/api/health")
        _, _, feed_raw = fetch(FEEDS["docs"])
        health = json.loads(raw.decode())
        feed = json.loads(feed_raw.decode())
    except Exception as exc:
        line(False, "docs:health", f"injoignable {type(exc).__name__}")
        return
    hv = str(health.get("version") or "")
    fv = str(feed.get("version") or "")
    ok = hv == fv and semver_tuple(hv) >= semver_tuple("0.2.22") and hv != "0.2.16"
    line(ok, "docs:health", f"health={hv} ota={fv}")


def check_jobs_page() -> None:
    try:
        status, ctype, raw = fetch("https://jobs.hubera.cloud/")
    except Exception as exc:
        line(False, "jobs:page", f"injoignable {type(exc).__name__}")
        return
    text = raw.decode("utf-8", "replace")
    bad = "127.0.0.1" in text
    line(not bad and status == 200, "jobs:page", "127.0.0.1 dans la page servie" if bad else f"status={status}")


def main() -> int:
    for slug, url in FEEDS.items():
        check_feed(slug, url)
    check_docs_health()
    check_jobs_page()
    print(f"TOTAL fail={FAILS}")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
