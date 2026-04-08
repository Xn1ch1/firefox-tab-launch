#!/bin/bash

# TabLaunch Firefox Addon - Production Build Script
# Packages the addon for distribution

set -e

OUTPUT_DIR="dist"
OUTPUT_NAME="tablaunch.xpi"
OUTPUT_FILE="$OUTPUT_DIR/$OUTPUT_NAME"
TEMP_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)
VERSION=$(grep '"version"' manifest.json | head -1 | grep -oP '\d+\.\d+\.\d+')

echo "📦 Building TabLaunch Firefox Addon v$VERSION..."
echo "→ Output: $OUTPUT_FILE"
echo ""

# Verify required files
echo "✓ Checking required files..."
required_files=(
    "manifest.json"
    "new-tab.html"
    "settings.html"
    "src/new-tab-script.js"
    "src/settings-script.js"
    "src/utils.js"
    "styles/common.css"
    "styles/new-tab.css"
    "styles/settings.css"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ Error: Required file missing: $file"
        exit 1
    fi
done

echo "✓ All required files present"
echo ""

# Copy core files
echo "✓ Copying addon files..."
cp manifest.json "$TEMP_DIR/"
cp new-tab.html "$TEMP_DIR/"
    mkdir -p "$TEMP_DIR/src"
    cp src/new-tab-script.js "$TEMP_DIR/src/"
cp settings.html "$TEMP_DIR/"
    cp src/settings-script.js "$TEMP_DIR/src/"
    cp src/utils.js "$TEMP_DIR/src/"
mkdir -p "$TEMP_DIR/styles"
cp styles/*.css "$TEMP_DIR/styles/"

# Copy icons
echo "✓ Copying icons..."
mkdir -p "$TEMP_DIR/icons"
cp icons/*.svg "$TEMP_DIR/icons/"

echo "✓ Creating XPI archive..."
mkdir -p "$ORIGINAL_DIR/$OUTPUT_DIR"
cd "$TEMP_DIR"

OUTPATH="$ORIGINAL_DIR/$OUTPUT_FILE"
zip -r -q "$OUTPATH" manifest.json new-tab.html settings.html src/ styles/ icons/ 2>/dev/null
if [[ $? -ne 0 ]]; then
    echo "❌ Error: Failed to create XPI file"
    cd "$ORIGINAL_DIR"
    rm -rf "$TEMP_DIR"
    exit 1
fi
cd "$ORIGINAL_DIR"

rm -rf "$TEMP_DIR"

if [[ ! -f "$OUTPATH" ]]; then
    echo "❌ Error: XPI file was not created: $OUTPATH"
    exit 1
fi

echo ""
echo "================================"
echo "✅ Build Complete!"
echo "================================"
echo "Output: $OUTPATH"
echo "Version: $VERSION"
echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""
echo "📖 Next steps:"
echo ""
echo "1️⃣  For testing:"
echo "   about:debugging#/runtime/this-firefox"
echo "   → Click 'Load Temporary Add-on'"
echo "   → Select: manifest.json"
echo ""
echo "2️⃣  For distribution:"
echo "   Share $OUTPUT_FILE with others"
echo "   They can double-click to install"
echo ""
echo "3️⃣  For Firefox Add-ons Store:"
echo "   https://addons.mozilla.org/developers/"
echo "   Upload $OUTPUT_FILE"
echo ""
echo "4️⃣  For open source release:"
echo "   Include: CHANGELOG.md, LICENSE, README.md"
echo "   Include: SECURITY.md, INSTALL.md"
echo ""

