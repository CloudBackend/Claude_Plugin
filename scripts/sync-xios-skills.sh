#!/bin/sh
# Pulls the newest XIOS skills from https://skills.xios3.com/ into the cloudbackend-paas plugin.
# Usage: scripts/sync-xios-skills.sh [path/to/xios-plugin-<version>.zip]
# Without an argument it downloads the zip the site currently links to.
set -eu

site=https://skills.xios3.com
root=$(cd "$(dirname "$0")/.." && pwd)
dst=$root/plugins/cloudbackend-paas/skills
skills="xios-views xios-process xios-theme xios-extend xios-db"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

if [ $# -ge 1 ]; then
  zip=$1
else
  name=$(curl -fsSL "$site/" | grep -o 'xios-plugin-[0-9]*\.zip' | head -n 1)
  [ -n "$name" ] || { echo "no plugin zip linked from $site/" >&2; exit 1; }
  zip=$work/$name
  curl -fsSL "$site/$name" -o "$zip"
  echo "downloaded $name"
fi

mkdir "$work/x"
unzip -q "$zip" -d "$work/x"
src=$work/x/xios/skills

for s in $skills; do
  [ -f "$src/$s/SKILL.md" ] || { echo "$s missing from the zip" >&2; exit 1; }
done
for s in $skills; do
  rm -rf "${dst:?}/$s"
  cp -R "$src/$s" "$dst/$s"
done

# House naming: the web console is "CloudBackend PaaS", not "the dashboard".
grep -rlI "the dashboard's" "$dst"/xios-* | while read -r f; do
  sed -i.bak "s/the dashboard's/CloudBackend PaaS's/g" "$f" && rm -f "$f.bak"
done

version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$work/x/xios/.claude-plugin/plugin.json")
echo "$version" > "$dst/../XIOS_SKILLS_VERSION"
echo "synced XIOS skills $version into $dst"
