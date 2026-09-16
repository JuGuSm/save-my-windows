#!/usr/bin/env bash
set -euo pipefail

UUID="save-my-windows@JuGuSm"
OUT_DIR="dist"
OUT_ZIP="$OUT_DIR/${UUID}.shell-extension.zip"

mkdir -p "$OUT_DIR"

# List ONLY the files/dirs you want at the ZIP root
# icon.png is the gnome-extensions/extensions.gnome.org listing icon
# (required filename/location); distinct from icons/app-icon.png used in
# the panel menu itself.
zip -r "$OUT_ZIP" \
  metadata.json \
  extension.js \
  icon.png \
  modules \
  icons \
  schemas \
  -x "schemas/gschemas.compiled" \
  -x ".git/*" "dist/*" "node_modules/*" ".idea/*" ".vscode/*"

# sanity check
echo; echo "Contents:"
unzip -l "$OUT_ZIP"
echo; echo "Wrote: $OUT_ZIP"
