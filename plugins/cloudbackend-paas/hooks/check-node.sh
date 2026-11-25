#!/bin/sh
# SessionStart hook: Node.js is optional. With it, Claude runs the XIOS validator and the
# other node commands in the XIOS skills; without it, Claude skips them, and the user is
# told once that installing Node.js adds them.

# Some systems have an unrelated program called node, so check it is Node.js 18 or later.
major=$(node -e 'process.stdout.write(process.versions.node.split(".")[0])' 2>/dev/null)
if [ -n "$major" ] && [ "$major" -ge 18 ] 2>/dev/null; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"cloudbackend-paas: Node.js is installed, so run the node commands the XIOS skills give, such as the xios-views validator, as they say."}}'
  exit 0
fi

context="cloudbackend-paas: Node.js 18 or later is not installed. Skip the steps in the XIOS skills that run node, npm or npx (the xios-views validator, the xios-theme token check and preview) rather than trying them; upload_project still checks the project against the schema. The first time you skip one in a conversation, tell the user in one line that installing Node.js (https://nodejs.org) adds it, and carry on."

# Tell the user once, not every session.
data=${CLAUDE_PLUGIN_DATA:-${XDG_STATE_HOME:-$HOME/.local/state}/cloudbackend-paas}
marker=$data/node-notice-shown
if [ -f "$marker" ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$context"
  exit 0
fi
mkdir -p "$data" 2>/dev/null && : > "$marker" 2>/dev/null

notice="CloudBackend PaaS works without Node.js, but for the full experience install Node.js 18 or later from https://nodejs.org: it lets Claude check XIOS files with the XIOS validator before uploading. Restart Claude Code afterwards."
printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$notice" "$context"
