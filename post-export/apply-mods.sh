#!/bin/sh
set -eu

export LC_ALL=C

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
EXPORT_DIR="${1:-$ROOT_DIR}"
INDEX_FILE="$EXPORT_DIR/index.htm"
CUSTOM_DIR="$EXPORT_DIR/custom"
FIREFOX_WEBGL_SOURCE="$ROOT_DIR/post-export/assets/firefox-webgl-context.js"
FIREFOX_WEBGL_TARGET="$CUSTOM_DIR/firefox-webgl-context.js"

if [ ! -f "$INDEX_FILE" ]; then
  echo "Cannot find export index: $INDEX_FILE" >&2
  exit 1
fi

mkdir -p "$CUSTOM_DIR"

perl -0pi -e 's#\s*<!-- WC360_POST_EXPORT:firefox-webgl-context:start -->.*?<!-- WC360_POST_EXPORT:firefox-webgl-context:end -->##sg' "$INDEX_FILE"

cp "$FIREFOX_WEBGL_SOURCE" "$FIREFOX_WEBGL_TARGET"
perl -0pi -e 's#(\s*<script src="lib/tdvplayer\.js[^"]*"></script>)#\n    <!-- WC360_POST_EXPORT:firefox-webgl-context:start -->\n    <script src="custom/firefox-webgl-context.js"></script>\n    <!-- WC360_POST_EXPORT:firefox-webgl-context:end -->$1#s' "$INDEX_FILE"

echo "Applied WC360 post-export modifications to $EXPORT_DIR"
