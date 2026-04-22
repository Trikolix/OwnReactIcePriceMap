import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { platform } from 'os';

console.log("Syncing with Android...");
execSync('npx cap sync android', { stdio: 'inherit' });

console.log("Building Release APK...");

const androidDir = join(process.cwd(), 'android');
const appDir = join(androidDir, 'app');

const keystoreFile = process.env.KEYSTORE_FILE || 'release.keystore';
const keystorePassword = process.env.KEYSTORE_PASSWORD || 'password';
const keyAlias = process.env.KEY_ALIAS || 'key0';
const keyPassword = process.env.KEY_PASSWORD || 'password';

const keystorePath = join(appDir, keystoreFile);

if (!existsSync(keystorePath)) {
    console.log("No keystore found. Generating a temporary one for signing...");
    const keytoolCmd = `keytool -genkey -v -keystore "${keystorePath}" -alias "${keyAlias}" -keyalg RSA -keysize 2048 -validity 10000 -storepass "${keystorePassword}" -keypass "${keyPassword}" -dname "CN=IceApp, OU=Mobile, O=IceApp, L=Berlin, S=Berlin, C=DE"`;
    execSync(keytoolCmd, { stdio: 'inherit' });
}

const gradlew = platform() === 'win32' ? 'gradlew.bat' : './gradlew';

const env = {
    ...process.env,
    KEYSTORE_FILE: keystoreFile,
    KEYSTORE_PASSWORD: keystorePassword,
    KEY_ALIAS: keyAlias,
    KEY_PASSWORD: keyPassword
};

execSync(`${gradlew} assembleRelease`, { stdio: 'inherit', cwd: androidDir, env });

console.log("Done! The signed APK is located at android/app/build/outputs/apk/release/app-release.apk");
