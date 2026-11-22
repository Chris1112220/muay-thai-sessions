#!/usr/bin/env bash
# Local markdown issue tracker for .scratch/muay-thai-sessions/issues
# Usage:
#   .sandcastle/issues.sh list
#   .sandcastle/issues.sh view <ID>
#   .sandcastle/issues.sh close <ID> [comment...]

set -euo pipefail

ISSUES_DIR=".scratch/muay-thai-sessions/issues"
DONE_DIR="${ISSUES_DIR}/done"

normalize_id() {
  local raw="$1"
  raw="${raw#0}"
  if [[ -z "$raw" ]]; then
    raw="0"
  fi
  printf '%02d' "$raw"
}

# Resolve path for an issue id. Prefers open dir, then done/.
# Prints path or nothing if missing.
resolve_path() {
  local id
  id="$(normalize_id "$1")"
  local match
  match="$(find "$ISSUES_DIR" -maxdepth 1 -type f -name "${id}-*.md" 2>/dev/null | head -n 1 || true)"
  if [[ -n "$match" ]]; then
    printf '%s\n' "$match"
    return 0
  fi
  if [[ -d "$DONE_DIR" ]]; then
    match="$(find "$DONE_DIR" -maxdepth 1 -type f -name "${id}-*.md" 2>/dev/null | head -n 1 || true)"
    if [[ -n "$match" ]]; then
      printf '%s\n' "$match"
      return 0
    fi
  fi
  return 1
}

is_done() {
  local id path
  id="$(normalize_id "$1")"
  if [[ -d "$DONE_DIR" ]]; then
    if find "$DONE_DIR" -maxdepth 1 -type f -name "${id}-*.md" 2>/dev/null | grep -q .; then
      return 0
    fi
  fi
  path="$(find "$ISSUES_DIR" -maxdepth 1 -type f -name "${id}-*.md" 2>/dev/null | head -n 1 || true)"
  if [[ -n "$path" ]] && grep -qE '^Status:[[:space:]]*done[[:space:]]*$' "$path"; then
    return 0
  fi
  return 1
}

# True when every Blocked-by id is done (or there is no Blocked by line).
blockers_satisfied() {
  local file="$1"
  local line blockers
  line="$(grep -E '^Blocked by:' "$file" | head -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi
  blockers="${line#Blocked by:}"
  blockers="${blockers//,/ }"
  local bid
  for bid in $blockers; do
    bid="$(echo "$bid" | tr -d '[:space:]')"
    [[ -z "$bid" ]] && continue
    if ! is_done "$bid"; then
      return 1
    fi
  done
  return 0
}

cmd_list() {
  local file id title body status tmp
  tmp="$(mktemp)"

  shopt -s nullglob
  for file in "$ISSUES_DIR"/*.md; do
    status="$(grep -E '^Status:' "$file" | head -n 1 | sed 's/^Status:[[:space:]]*//;s/[[:space:]]*$//' || true)"
    [[ "$status" == "ready-for-agent" ]] || continue
    blockers_satisfied "$file" || continue

    id="$(basename "$file" | sed -E 's/^([0-9]+)-.*/\1/')"
    title="$(head -n 1 "$file" | sed -E 's/^#[[:space:]]*//')"
    body="$(cat "$file")"

    jq -c -n \
      --arg id "$id" \
      --arg title "$title" \
      --arg body "$body" \
      '{id: $id, number: ($id | tonumber), title: $title, body: $body}' >>"$tmp"
  done

  if [[ ! -s "$tmp" ]]; then
    echo '[]'
  else
    jq -s 'sort_by(.number)' "$tmp"
  fi
  rm -f "$tmp"
}

cmd_view() {
  local id="${1:-}"
  if [[ -z "$id" ]]; then
    echo "usage: $0 view <ID>" >&2
    exit 1
  fi
  local path
  if ! path="$(resolve_path "$id")"; then
    echo "issue not found: $id" >&2
    exit 1
  fi
  cat "$path"
}

cmd_close() {
  local id="${1:-}"
  shift || true
  local comment="${*:-}"
  if [[ -z "$id" ]]; then
    echo "usage: $0 close <ID> [comment...]" >&2
    exit 1
  fi

  local path
  path="$(find "$ISSUES_DIR" -maxdepth 1 -type f -name "$(normalize_id "$id")-*.md" 2>/dev/null | head -n 1 || true)"
  if [[ -z "$path" ]]; then
    if is_done "$id"; then
      echo "issue already done: $id" >&2
      exit 1
    fi
    echo "issue not found (open): $id" >&2
    exit 1
  fi

  mkdir -p "$DONE_DIR"
  local today
  today="$(date -u +%Y-%m-%d)"

  # Status: done (replace existing Status line)
  if grep -qE '^Status:' "$path"; then
    sed -i -E "s/^Status:.*/Status: done/" "$path"
  else
    # Insert after the title line
    sed -i "1a\\
Status: done
" "$path"
  fi

  # Closing date line after Status
  if grep -qE '^Closed:' "$path"; then
    sed -i -E "s/^Closed:.*/Closed: ${today}/" "$path"
  else
    # Insert Closed after Status
    sed -i -E "/^Status:/a\\
Closed: ${today}
" "$path"
  fi

  if [[ -n "$comment" ]]; then
    if ! grep -qE '^## Comments' "$path"; then
      printf '\n## Comments\n\n' >>"$path"
    fi
    {
      printf '\n**%s:** %s\n' "$today" "$comment"
    } >>"$path"
  fi

  local dest
  dest="${DONE_DIR}/$(basename "$path")"
  mv "$path" "$dest"
  echo "closed $(normalize_id "$id") -> $dest"
}

usage() {
  cat >&2 <<EOF
usage: $0 list
       $0 view <ID>
       $0 close <ID> [comment...]
EOF
  exit 1
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    list) cmd_list "$@" ;;
    view) cmd_view "$@" ;;
    close) cmd_close "$@" ;;
    *) usage ;;
  esac
}

main "$@"
