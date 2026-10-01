#!/bin/sh
set -eu

usage() {
    cat <<'EOF'
Usage: scripts/publish-release.sh VERSION ZIP [options]

Options:
  --create-release       Create/update the GitHub release and upload the ZIP.
  --dry-run              Print the appcast update without changing files.
  --sign-update PATH     Sparkle sign_update executable.
  --notes-url URL        Sparkle release-notes URL.
  --min-os VERSION       Appcast minimum system version (default: 26.0).
  --build-version VALUE  Increasing CFBundleVersion / sparkle:version.
  --push-site             Commit appcast/currentversion.txt and push the site.

The Sparkle EdDSA private key is read by sign_update from its normal secure
storage. It must not be placed in this repository.
EOF
    exit 2
}

[ "$#" -ge 2 ] || usage
VERSION=$1
ZIP=$2
shift 2
CREATE_RELEASE=0
DRY_RUN=0
MIN_OS=26.0
BUILD_VERSION=
NOTES_URL="https://dockexpose.netlify.app/changelog-sparkle"
SIGN_UPDATE=${SPARKLE_SIGN_UPDATE:-}
PUSH_SITE=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --create-release) CREATE_RELEASE=1 ;;
        --dry-run) DRY_RUN=1 ;;
        --sign-update) shift; [ "$#" -gt 0 ] || usage; SIGN_UPDATE=$1 ;;
        --notes-url) shift; [ "$#" -gt 0 ] || usage; NOTES_URL=$1 ;;
        --min-os) shift; [ "$#" -gt 0 ] || usage; MIN_OS=$1 ;;
        --build-version) shift; [ "$#" -gt 0 ] || usage; BUILD_VERSION=$1 ;;
        --push-site) PUSH_SITE=1 ;;
        *) usage ;;
    esac
    shift
done

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APPCAST="$ROOT/appcast.xml"
CURRENT_VERSION="$ROOT/currentversion.txt"
EXPECTED_ZIP="Dock-Expose-$VERSION.zip"

if [ -z "$BUILD_VERSION" ]; then
    if [ "$VERSION" = "4.0.0" ]; then
        BUILD_VERSION=40000
    else
        echo "error: pass --build-version for releases other than 4.0.0" >&2
        exit 1
    fi
fi

[ -f "$ZIP" ] || { echo "error: ZIP does not exist: $ZIP" >&2; exit 1; }
case "$(basename -- "$ZIP")" in
    "$EXPECTED_ZIP") ;;
    *) echo "error: ZIP must be named $EXPECTED_ZIP" >&2; exit 1 ;;
esac

if [ -z "$SIGN_UPDATE" ]; then
    OLD_SIGN_UPDATE="$HOME/proj/obj-c/Dock-Expose-pre-macos27/Pods/Sparkle/bin/sign_update"
    if [ -x "$OLD_SIGN_UPDATE" ]; then
        SIGN_UPDATE=$OLD_SIGN_UPDATE
    fi
fi
[ -n "$SIGN_UPDATE" ] && [ -x "$SIGN_UPDATE" ] || {
    echo "error: set SPARKLE_SIGN_UPDATE or pass --sign-update PATH" >&2
    exit 1
}

SIGN_OUTPUT=$($SIGN_UPDATE "$ZIP")
SIGNATURE=$(printf '%s\n' "$SIGN_OUTPUT" | sed -nE "s/.*sparkle:edSignature=['\"]([^'\"]+)['\"].*/\1/p" | head -1)
LENGTH=$(stat -f '%z' "$ZIP")

[ -n "$SIGNATURE" ] || {
    echo "error: could not read the EdDSA signature from sign_update output:" >&2
    printf '%s\n' "$SIGN_OUTPUT" >&2
    exit 1
}

DOWNLOAD_URL="https://github.com/steventheworker/Dock-Expos--home/releases/download/v$VERSION/$EXPECTED_ZIP"
PUB_DATE=$(date -R)
ITEM=$(cat <<EOF
      <item>
         <title>Version $VERSION</title>
         <pubDate>$PUB_DATE</pubDate>
         <sparkle:minimumSystemVersion>$MIN_OS</sparkle:minimumSystemVersion>
         <sparkle:releaseNotesLink>$NOTES_URL</sparkle:releaseNotesLink>
         <enclosure
            url="$DOWNLOAD_URL"
            sparkle:version="$BUILD_VERSION"
            sparkle:shortVersionString="$VERSION"
            sparkle:edSignature="$SIGNATURE" length="$LENGTH"
            type="application/octet-stream"/>
      </item>
EOF
)

if [ "$DRY_RUN" -eq 1 ]; then
    printf '%s\n' "$ITEM"
    exit 0
fi

if [ "$CREATE_RELEASE" -eq 1 ]; then
    command -v gh >/dev/null 2>&1 || { echo "error: gh is required for --create-release" >&2; exit 1; }
    if gh release view "v$VERSION" >/dev/null 2>&1; then
        gh release upload "v$VERSION" "$ZIP" --clobber
    else
        gh release create "v$VERSION" "$ZIP" --title "Dock Exposé $VERSION" --generate-notes
    fi
fi

python3 - "$APPCAST" "$CURRENT_VERSION" "$VERSION" "$ITEM" <<'PY'
import pathlib
import sys

appcast_path, current_path, version, item = sys.argv[1:]
path = pathlib.Path(appcast_path)
text = path.read_text()
marker = "      <language>en</language>\n"
if marker not in text:
    raise SystemExit("error: appcast.xml has no channel language marker")

# Make rerunning the script idempotent for this release.
lines = text.splitlines(True)
filtered = []
in_item = False
item_lines = []
remove = False
for line in lines:
    if "<item>" in line:
        in_item = True
        item_lines = [line]
        remove = False
        continue
    if in_item:
        item_lines.append(line)
        if f'sparkle:shortVersionString="{version}"' in line:
            remove = True
        if "</item>" in line:
            if not remove:
                filtered.extend(item_lines)
            in_item = False
            item_lines = []
        continue
    filtered.append(line)

text = "".join(filtered)
text = text.replace(marker, marker + item + "\n", 1)
path.write_text(text)
pathlib.Path(current_path).write_text(version + "\n")
PY

if [ "$PUSH_SITE" -eq 1 ]; then
    git -C "$ROOT" add appcast.xml currentversion.txt
    git -C "$ROOT" commit -m "publish Dock Exposé v$VERSION"
    git -C "$ROOT" push
fi

echo "Updated $APPCAST for v$VERSION ($LENGTH bytes)."
if [ "$CREATE_RELEASE" -eq 0 ]; then
    echo "The GitHub asset was not uploaded; use --create-release before publishing the appcast."
fi
