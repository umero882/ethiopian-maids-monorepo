#!/usr/bin/env node
/**
 * Firebase Phone Auth Platform Setup Script
 *
 * This script helps configure Firebase Phone Authentication for Android and iOS.
 *
 * Usage:
 *   node scripts/setup-firebase-phone-auth.js
 *
 * Or with specific commands:
 *   node scripts/setup-firebase-phone-auth.js android-sha
 *   node scripts/setup-firebase-phone-auth.js check-config
 *   node scripts/setup-firebase-phone-auth.js eas-credentials
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Get debug keystore path based on OS
 */
function getDebugKeystorePath() {
  const homeDir = os.homedir();
  if (process.platform === 'win32') {
    return path.join(homeDir, '.android', 'debug.keystore');
  }
  return path.join(homeDir, '.android', 'debug.keystore');
}

/**
 * Generate SHA fingerprints from debug keystore
 */
function generateDebugSHA() {
  logSection('Generating Debug SHA Fingerprints');

  const keystorePath = getDebugKeystorePath();

  if (!fileExists(keystorePath)) {
    logWarning(`Debug keystore not found at: ${keystorePath}`);
    logStep('1', 'The debug keystore is created automatically when you first build an Android app.');
    logStep('2', 'Run: npx expo run:android (or build with EAS) to create it.');
    return null;
  }

  logSuccess(`Found debug keystore at: ${keystorePath}`);

  try {
    const command = `keytool -list -v -alias androiddebugkey -keystore "${keystorePath}" -storepass android -keypass android`;
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

    // Extract SHA-1 and SHA-256
    const sha1Match = output.match(/SHA1:\s*([A-F0-9:]+)/i);
    const sha256Match = output.match(/SHA256:\s*([A-F0-9:]+)/i);

    if (sha1Match) {
      logSuccess(`SHA-1:   ${sha1Match[1]}`);
    }
    if (sha256Match) {
      logSuccess(`SHA-256: ${sha256Match[1]}`);
    }

    console.log('\n' + '-'.repeat(60));
    log('Add these fingerprints to Firebase Console:', 'yellow');
    log('1. Go to Firebase Console > Project Settings', 'reset');
    log('2. Select your Android app (com.ethiopianmaids.app)', 'reset');
    log('3. Click "Add fingerprint"', 'reset');
    log('4. Paste the SHA-256 fingerprint above', 'reset');
    console.log('-'.repeat(60));

    return { sha1: sha1Match?.[1], sha256: sha256Match?.[1] };
  } catch (error) {
    logError('Failed to generate SHA fingerprints');
    logWarning('Make sure Java keytool is installed and in your PATH');

    if (process.platform === 'win32') {
      logStep('Tip', 'On Windows, keytool is usually at: C:\\Program Files\\Java\\jdk-XX\\bin\\keytool.exe');
    }

    return null;
  }
}

/**
 * Check EAS credentials
 */
function checkEASCredentials() {
  logSection('Checking EAS Credentials');

  try {
    logStep('1', 'Fetching Android credentials from EAS...');
    const output = execSync('eas credentials --platform android', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(output);
  } catch (error) {
    logWarning('Could not fetch EAS credentials. Make sure you are logged in:');
    logStep('Run', 'eas login');
    logStep('Then', 'eas credentials --platform android');
  }
}

/**
 * Check configuration files
 */
function checkConfiguration() {
  logSection('Checking Configuration Files');

  const mobileDir = path.resolve(__dirname, '..');
  const checks = [
    {
      name: 'google-services.json (Android)',
      path: path.join(mobileDir, 'google-services.json'),
      required: true,
      instructions: [
        '1. Go to Firebase Console > Project Settings',
        '2. Select your Android app',
        '3. Download google-services.json',
        '4. Place it in apps/mobile/',
      ],
    },
    {
      name: 'GoogleService-Info.plist (iOS)',
      path: path.join(mobileDir, 'GoogleService-Info.plist'),
      required: true,
      instructions: [
        '1. Go to Firebase Console > Project Settings',
        '2. Select your iOS app (create one if needed)',
        '3. Download GoogleService-Info.plist',
        '4. Place it in apps/mobile/',
      ],
    },
    {
      name: 'app.json',
      path: path.join(mobileDir, 'app.json'),
      required: true,
      instructions: ['app.json should exist in apps/mobile/'],
    },
    {
      name: '.env or environment variables',
      path: path.join(mobileDir, '.env'),
      required: false,
      instructions: [
        'Create .env file with:',
        'EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key',
        'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com',
        'EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id',
        'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com',
        'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id',
        'EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id',
      ],
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    const exists = fileExists(check.path);

    if (exists) {
      logSuccess(`${check.name} - Found`);

      // Additional validation for google-services.json
      if (check.name.includes('google-services.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(check.path, 'utf8'));
          if (content.project_info?.project_id) {
            logSuccess(`  Project ID: ${content.project_info.project_id}`);
          }
          if (content.client?.[0]?.client_info?.android_client_info?.package_name) {
            logSuccess(`  Package: ${content.client[0].client_info.android_client_info.package_name}`);
          }
        } catch (e) {
          logWarning('  Could not parse google-services.json');
        }
      }

      // Additional validation for GoogleService-Info.plist
      if (check.name.includes('GoogleService-Info.plist')) {
        try {
          const content = fs.readFileSync(check.path, 'utf8');
          const bundleIdMatch = content.match(/<key>BUNDLE_ID<\/key>\s*<string>([^<]+)<\/string>/);
          const clientIdMatch = content.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);

          if (bundleIdMatch) {
            logSuccess(`  Bundle ID: ${bundleIdMatch[1]}`);
          }
          if (clientIdMatch) {
            logSuccess(`  Reversed Client ID: ${clientIdMatch[1]}`);
            logStep('Note', 'Add this to CFBundleURLSchemes in app.json for reCAPTCHA fallback');
          }
        } catch (e) {
          logWarning('  Could not parse GoogleService-Info.plist');
        }
      }
    } else {
      if (check.required) {
        logError(`${check.name} - NOT FOUND`);
        allPassed = false;
      } else {
        logWarning(`${check.name} - Not found (optional)`);
      }
      console.log('  Instructions:');
      check.instructions.forEach((inst) => log(`    ${inst}`, 'reset'));
    }
  }

  return allPassed;
}

/**
 * Show iOS setup instructions
 */
function showIOSSetup() {
  logSection('iOS Setup Instructions');

  log('1. APNs Configuration (Required for Phone Auth)', 'yellow');
  console.log(`
   a. Go to Apple Developer Portal: https://developer.apple.com
   b. Navigate to: Certificates, Identifiers & Profiles > Keys
   c. Create a new key with "Apple Push Notifications service (APNs)" enabled
   d. Download the .p8 file and note the Key ID

   e. Go to Firebase Console > Project Settings > Cloud Messaging
   f. Under "Apple app configuration", click "Upload" for APNs Authentication Key
   g. Upload the .p8 file
   h. Enter Key ID and Team ID
  `);

  log('2. Bundle Identifier', 'yellow');
  console.log(`
   Ensure your iOS app in Firebase Console uses:
   Bundle ID: com.ethiopianmaids.app
  `);

  log('3. URL Scheme for reCAPTCHA', 'yellow');
  console.log(`
   After downloading GoogleService-Info.plist:
   a. Open the file and find REVERSED_CLIENT_ID
   b. Update app.json CFBundleURLSchemes with this value

   Example: If REVERSED_CLIENT_ID is "com.googleusercontent.apps.123456-abcdef"
   Then app.json should have:
   "CFBundleURLSchemes": ["com.googleusercontent.apps.123456-abcdef"]
  `);

  log('4. Build with EAS', 'yellow');
  console.log(`
   # Development build (includes dev client)
   eas build --profile development --platform ios

   # Preview build (for TestFlight)
   eas build --profile preview --platform ios

   # Production build
   eas build --profile production --platform ios
  `);
}

/**
 * Show Android setup instructions
 */
function showAndroidSetup() {
  logSection('Android Setup Instructions');

  log('1. SHA-256 Fingerprint (Required for Phone Auth)', 'yellow');
  console.log(`
   For debug builds:
   Run: node scripts/setup-firebase-phone-auth.js android-sha

   For EAS builds:
   Run: eas credentials --platform android

   Then add the SHA-256 fingerprint to Firebase Console:
   Project Settings > Your Android App > Add fingerprint
  `);

  log('2. Package Name', 'yellow');
  console.log(`
   Ensure your Android app in Firebase Console uses:
   Package Name: com.ethiopianmaids.app
  `);

  log('3. google-services.json', 'yellow');
  console.log(`
   a. Download from Firebase Console > Project Settings > Android app
   b. Place in apps/mobile/google-services.json
   c. The file is already referenced in app.json
  `);

  log('4. Build with EAS', 'yellow');
  console.log(`
   # Development build (includes dev client)
   eas build --profile development --platform android

   # Preview build (APK)
   eas build --profile preview --platform android

   # Production build (AAB for Play Store)
   eas build --profile production --platform android
  `);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Firebase Phone Auth - Platform Setup Helper           ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  switch (command) {
    case 'android-sha':
      generateDebugSHA();
      break;

    case 'eas-credentials':
      checkEASCredentials();
      break;

    case 'check-config':
      checkConfiguration();
      break;

    case 'ios-setup':
      showIOSSetup();
      break;

    case 'android-setup':
      showAndroidSetup();
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log(`
Usage: node scripts/setup-firebase-phone-auth.js [command]

Commands:
  (no command)     Run all checks and show setup status
  android-sha      Generate SHA fingerprints from debug keystore
  eas-credentials  Check EAS credentials for SHA fingerprints
  check-config     Check if configuration files exist
  ios-setup        Show iOS setup instructions
  android-setup    Show Android setup instructions
  help             Show this help message

Examples:
  node scripts/setup-firebase-phone-auth.js
  node scripts/setup-firebase-phone-auth.js android-sha
  node scripts/setup-firebase-phone-auth.js check-config
      `);
      break;

    default:
      // Run all checks
      checkConfiguration();
      generateDebugSHA();
      showAndroidSetup();
      showIOSSetup();

      logSection('Next Steps');
      console.log(`
1. Ensure google-services.json is in apps/mobile/
2. Ensure GoogleService-Info.plist is in apps/mobile/
3. Add SHA-256 fingerprint to Firebase Console (Android)
4. Configure APNs in Firebase Console (iOS)
5. Update CFBundleURLSchemes in app.json with REVERSED_CLIENT_ID (iOS)
6. Add test phone numbers in Firebase Console for development
7. Build with EAS: eas build --profile development --platform all
      `);
  }
}

main();
