#!/usr/bin/env bash
# Estimate CPU/mem/battery with USB still plugged (no unplug). Lab protocol 8 oct 2026.
set -euo pipefail
SERIAL="${1:?adb serial}"
PKG="${2:?package}"
LABEL="${3:-scenario}"
OUT_DIR="${4:-/tmp/hubera-lab-2026-10-08}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
BASE="$OUT_DIR/${PKG}.${LABEL}.${STAMP}"

adb -s "$SERIAL" shell dumpsys batterystats --reset >/dev/null
sleep 1
{
  echo "=== $PKG $LABEL $STAMP ==="
  echo "--- cpuinfo ---"
  adb -s "$SERIAL" shell dumpsys cpuinfo | grep -F "$PKG" || true
  echo "--- meminfo ---"
  adb -s "$SERIAL" shell dumpsys meminfo "$PKG" 2>/dev/null | head -n 40 || true
  echo "--- gfxinfo ---"
  adb -s "$SERIAL" shell dumpsys gfxinfo "$PKG" 2>/dev/null | head -n 30 || true
  echo "--- batterystats uid ---"
  adb -s "$SERIAL" shell dumpsys batterystats "$PKG" 2>/dev/null | head -n 80 || true
} > "${BASE}.txt"
echo "$BASE.txt"
