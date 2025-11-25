#!/usr/bin/env bash
set -euo pipefail

# Ensure we run from the project root (the folder containing this script is ./scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_RES="$ROOT_DIR/android/app/src/main/res"
APPICONS_DIR="$ROOT_DIR/AppIcons"

SRC_PNG="$APPICONS_DIR/playstore.png"
if [[ ! -f "$SRC_PNG" ]]; then
  echo "Source icon $SRC_PNG not found. Please place a square PNG there (1024x1024 recommended)." >&2
  exit 1
fi

backup_dir="$ROOT_DIR/AppIcons_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# Backup existing Android mipmap icons
for d in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
  if [[ -d "$ANDROID_RES/$d" ]]; then
    mkdir -p "$backup_dir/$d"
    cp -f "$ANDROID_RES/$d"/ic_launcher*.png "$backup_dir/$d" 2>/dev/null || true
  fi
done

# Helper to resize and write PNG using sips
resize_write() {
  local size=$1
  local out=$2
  sips -s format png -Z "$size" "$SRC_PNG" --out "$out" >/dev/null
}

# Generate proper sizes (Android guidelines)
mkdir -p "$ANDROID_RES/mipmap-mdpi" "$ANDROID_RES/mipmap-hdpi" "$ANDROID_RES/mipmap-xhdpi" "$ANDROID_RES/mipmap-xxhdpi" "$ANDROID_RES/mipmap-xxxhdpi"

resize_write 48  "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"
resize_write 72  "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"
resize_write 96  "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png"
resize_write 144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png"
resize_write 192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png"

# Round icon (optional, reuse same image)
cp "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"  "$ANDROID_RES/mipmap-mdpi/ic_launcher_round.png"
cp "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"  "$ANDROID_RES/mipmap-hdpi/ic_launcher_round.png"
cp "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png" "$ANDROID_RES/mipmap-xhdpi/ic_launcher_round.png"
cp "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png" "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_round.png"
cp "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png" "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_round.png"

# Foreground for adaptive icon: use higher-res for foreground; background is solid color in res/values/colors.xml
resize_write 432 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png"
cp "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png" "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_foreground.png"
cp "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png" "$ANDROID_RES/mipmap-xhdpi/ic_launcher_foreground.png"
cp "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png" "$ANDROID_RES/mipmap-hdpi/ic_launcher_foreground.png"
cp "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png" "$ANDROID_RES/mipmap-mdpi/ic_launcher_foreground.png"

# iOS: replace AppIcon.appiconset if provided
IOS_SET_SRC="$APPICONS_DIR/Assets.xcassets/AppIcon.appiconset"
IOS_SET_DST="$ROOT_DIR/ios/AeroGuard/Images.xcassets/AppIcon.appiconset"
if [[ -d "$IOS_SET_SRC" ]]; then
  mkdir -p "$backup_dir/ios_AppIcon.appiconset"
  cp -R "$IOS_SET_DST"/* "$backup_dir/ios_AppIcon.appiconset" 2>/dev/null || true
  rm -rf "$IOS_SET_DST"
  mkdir -p "$IOS_SET_DST"
  cp -R "$IOS_SET_SRC"/* "$IOS_SET_DST" 
fi

echo "Icons synced. Backup at $backup_dir"
