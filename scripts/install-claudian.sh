#!/usr/bin/env bash
# Install the Claudian Obsidian plugin (YishenTu/claudian) into a vault.
#
# Usage:
#   ./scripts/install-claudian.sh /path/to/your/vault
#
# Env overrides:
#   CLAUDIAN_REPO   - git URL (default: https://github.com/YishenTu/claudian.git)
#   CLAUDIAN_REF    - git ref to check out (default: main)
#   BUILD_FROM_SRC  - "1" to git clone + npm build, "0" to download release
#                     (default: 1)

set -euo pipefail

REPO="${CLAUDIAN_REPO:-https://github.com/YishenTu/claudian.git}"
REF="${CLAUDIAN_REF:-main}"
BUILD_FROM_SRC="${BUILD_FROM_SRC:-1}"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/your/vault" >&2
  exit 2
fi

VAULT="$1"

if [[ ! -d "$VAULT" ]]; then
  echo "Vault path does not exist: $VAULT" >&2
  exit 1
fi

if [[ ! -d "$VAULT/.obsidian" ]]; then
  echo "Warning: '$VAULT/.obsidian' not found — is this a real Obsidian vault?"
  read -rp "Create '$VAULT/.obsidian/plugins' anyway? [y/N] " ans
  case "$ans" in
    y|Y) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

PLUGINS_DIR="$VAULT/.obsidian/plugins"
TARGET="$PLUGINS_DIR/claudian"

mkdir -p "$PLUGINS_DIR"

if [[ -e "$TARGET" ]]; then
  echo "Existing Claudian install found at: $TARGET"
  read -rp "Remove and reinstall? [y/N] " ans
  case "$ans" in
    y|Y) rm -rf "$TARGET" ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

check_cli() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    echo "  [ok] $name  -> $(command -v "$name")"
  else
    echo "  [!!] $name  -> not found on PATH"
  fi
}

echo "Checking prerequisites…"
check_cli claude
check_cli codex
check_cli node
check_cli npm
check_cli git
echo

if [[ "$BUILD_FROM_SRC" == "1" ]]; then
  echo "Cloning $REPO ($REF) into $TARGET…"
  git clone --depth 1 --branch "$REF" "$REPO" "$TARGET"
  pushd "$TARGET" >/dev/null
    echo "Installing npm dependencies…"
    npm install
    echo "Building plugin…"
    npm run build
  popd >/dev/null
else
  # Download from latest release
  need_curl() { command -v curl >/dev/null 2>&1 || { echo "curl required" >&2; exit 1; }; }
  need_curl
  API="https://api.github.com/repos/YishenTu/claudian/releases/latest"
  echo "Fetching latest release metadata…"
  mkdir -p "$TARGET"
  for f in main.js manifest.json styles.css; do
    url="$(curl -fsSL "$API" \
      | grep "browser_download_url" \
      | grep -o "https://[^\"]*/$f" \
      | head -n1)"
    if [[ -z "$url" ]]; then
      echo "Could not find $f in latest release" >&2
      exit 1
    fi
    echo "  -> $f"
    curl -fsSL "$url" -o "$TARGET/$f"
  done
fi

echo
echo "Claudian installed at: $TARGET"
echo
echo "Next steps:"
echo "  1. Open the vault in Obsidian: $VAULT"
echo "  2. Settings -> Community plugins -> enable 'Claudian'"
echo "  3. In Claudian settings, confirm the Claude CLI path"
echo "       macOS/Linux: $(command -v claude 2>/dev/null || echo 'run: which claude')"
echo "  4. Trust the vault when Obsidian prompts you"
