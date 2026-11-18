#!/bin/sh
# Builds dist/zotero-accessible-setup.xpi; Zotero needs manifest.json at the archive root.
set -e
cd "$(dirname "$0")"
mkdir -p ../dist
rm -f ../dist/zotero-accessible-setup.xpi
uv run --no-project python -m zipfile -c ../dist/zotero-accessible-setup.xpi \
	manifest.json bootstrap.js accessible-setup.js style.css
