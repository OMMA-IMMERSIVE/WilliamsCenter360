#!/bin/sh
set -eu

export LC_ALL=C

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
EXPORT_DIR="${1:-$ROOT_DIR}"
INDEX_FILE="$EXPORT_DIR/index.htm"
CUSTOM_DIR="$EXPORT_DIR/custom"
FIREFOX_WEBGL_SOURCE="$ROOT_DIR/post-export/assets/firefox-webgl-context.js"
FIREFOX_WEBGL_TARGET="$CUSTOM_DIR/firefox-webgl-context.js"
MODE_SOURCE="$ROOT_DIR/post-export/assets/wc360-mode.js"
MODE_TARGET="$CUSTOM_DIR/wc360-mode.js"
MENU_AUTOCYCLE_SOURCE="$ROOT_DIR/post-export/assets/wc360-menu-autocycle.js"
MENU_AUTOCYCLE_TARGET="$CUSTOM_DIR/wc360-menu-autocycle.js"
RESPONSIVE_MENU_SOURCE="$ROOT_DIR/post-export/assets/wc360-responsive-menu.js"
RESPONSIVE_MENU_TARGET="$CUSTOM_DIR/wc360-responsive-menu.js"
EMBED_SOURCE="$ROOT_DIR/embed/index.htm"
EMBED_TARGET="$EXPORT_DIR/embed/index.htm"

if [ ! -f "$INDEX_FILE" ]; then
  echo "Cannot find export index: $INDEX_FILE" >&2
  exit 1
fi

mkdir -p "$CUSTOM_DIR"
mkdir -p "$EXPORT_DIR/embed"

perl -0pi -e 's#<title>.*?</title>#<title>WC360</title>#s' "$INDEX_FILE"
perl -0pi -e 's#\s*<!-- WC360_POST_EXPORT:firefox-webgl-context:start -->.*?<!-- WC360_POST_EXPORT:firefox-webgl-context:end -->##sg' "$INDEX_FILE"
perl -0pi -e 's#\s*<!-- WC360_POST_EXPORT:mode:start -->.*?<!-- WC360_POST_EXPORT:mode:end -->##sg' "$INDEX_FILE"
perl -0pi -e 's#\s*<!-- WC360_POST_EXPORT:responsive-menu:start -->.*?<!-- WC360_POST_EXPORT:responsive-menu:end -->##sg' "$INDEX_FILE"
perl -0pi -e 's#\s*<!-- WC360_POST_EXPORT:menu-autocycle:start -->.*?<!-- WC360_POST_EXPORT:menu-autocycle:end -->##sg' "$INDEX_FILE"
cp "$FIREFOX_WEBGL_SOURCE" "$FIREFOX_WEBGL_TARGET"
cp "$MODE_SOURCE" "$MODE_TARGET"
cp "$MENU_AUTOCYCLE_SOURCE" "$MENU_AUTOCYCLE_TARGET"
cp "$RESPONSIVE_MENU_SOURCE" "$RESPONSIVE_MENU_TARGET"
if [ "$EMBED_SOURCE" != "$EMBED_TARGET" ]; then
  cp "$EMBED_SOURCE" "$EMBED_TARGET"
fi
perl -0pi -e 's#(\s*<script src="lib/tdvplayer\.js[^"]*"></script>)#\n    <!-- WC360_POST_EXPORT:firefox-webgl-context:start -->\n    <script src="custom/firefox-webgl-context.js"></script>\n    <!-- WC360_POST_EXPORT:firefox-webgl-context:end -->$1#s' "$INDEX_FILE"
perl -0pi -e 's#(\s*<script src="script\.js[^"]*"></script>)#$1\n    <!-- WC360_POST_EXPORT:mode:start -->\n    <script src="custom/wc360-mode.js?v=14"></script>\n    <!-- WC360_POST_EXPORT:mode:end -->#s' "$INDEX_FILE"
perl -0pi -e 's#(\s*<!-- WC360_POST_EXPORT:mode:end -->)#$1\n    <!-- WC360_POST_EXPORT:menu-autocycle:start -->\n    <script src="custom/wc360-menu-autocycle.js?v=11"></script>\n    <!-- WC360_POST_EXPORT:menu-autocycle:end -->#s' "$INDEX_FILE"
perl -0pi -e 's#(\s*<!-- WC360_POST_EXPORT:menu-autocycle:end -->)#$1\n    <!-- WC360_POST_EXPORT:responsive-menu:start -->\n    <script src="custom/wc360-responsive-menu.js?v=2"></script>\n    <!-- WC360_POST_EXPORT:responsive-menu:end -->#s' "$INDEX_FILE"

echo "Applied WC360 post-export modifications to $EXPORT_DIR"
