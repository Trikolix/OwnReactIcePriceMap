#!/bin/bash
set -e

# Sync capacitor
echo "Syncing with Android..."
npx cap sync android

# Build the APK
echo "Building Release APK..."
cd android

KEYSTORE_FILE=${KEYSTORE_FILE:-"release.keystore"}
KEYSTORE_PASSWORD=${KEYSTORE_PASSWORD:-"password"}
KEY_ALIAS=${KEY_ALIAS:-"key0"}
KEY_PASSWORD=${KEY_PASSWORD:-"password"}

if [ ! -f "app/$KEYSTORE_FILE" ]; then
    echo "No keystore found. Generating a temporary one for signing..."
    keytool -genkey -v -keystore "app/$KEYSTORE_FILE" -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$KEYSTORE_PASSWORD" -keypass "$KEY_PASSWORD" -dname "CN=IceApp, OU=Mobile, O=IceApp, L=Berlin, S=Berlin, C=DE"
fi

export KEYSTORE_FILE KEYSTORE_PASSWORD KEY_ALIAS KEY_PASSWORD

./gradlew assembleRelease

echo "Done! The signed APK is located at android/app/build/outputs/apk/release/app-release.apk"
