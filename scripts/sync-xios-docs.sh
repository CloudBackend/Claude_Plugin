#!/bin/sh
# Copies the XIOS/3 reference docs from a checkout of xios-mcp into the xios-apps skill.
# Usage: scripts/sync-xios-docs.sh [path/to/xios-mcp/xios-docs]
set -eu

src=${1:-../xios-mcp/xios-docs}
dst=$(dirname "$0")/../plugins/cloudbackend-paas/skills/xios-apps/reference

mkdir -p "$dst"
for f in concepts.md components.md processes.md rules.md data-and-channels.md \
         ref-components.md ref-operations.md ref-functions.md ref-methods.md \
         ref-events.md ref-actions.md; do
  cp "$src/$f" "$dst/$f"
done
cp "$src/view/icons.md" "$dst/icons.md"
cp "$src/view/icons-all.txt" "$dst/icons-all.txt"
