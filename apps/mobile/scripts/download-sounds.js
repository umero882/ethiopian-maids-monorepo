#!/usr/bin/env node
/**
 * Download Sound Files Script
 *
 * Downloads royalty-free sound effects for the gamification system.
 * Sounds are from Mixkit (https://mixkit.co) which provides royalty-free sounds.
 *
 * Usage: node scripts/download-sounds.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Sound file URLs (Mixkit royalty-free sounds)
// Note: Some Mixkit URLs may have rate limiting. Alternative sources provided.
const SOUNDS = {
  // Points: coin/ding sound - using success sound as fallback
  'points.mp3': 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  // Achievement: bell/chime sound
  'achievement.mp3': 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  // Confetti: pop sound
  'confetti.mp3': 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
  // Level up: fanfare
  'level-up.mp3': 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  // Success: chime
  'success.mp3': 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  // Error: tone
  'error.mp3': 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3',
  // Click: click
  'click.mp3': 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

const SOUNDS_DIR = path.join(__dirname, '..', 'assets', 'sounds');

// Ensure sounds directory exists
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
  console.log(`Created directory: ${SOUNDS_DIR}`);
}

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`  Redirecting to: ${redirectUrl}`);
        downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

/**
 * Main function to download all sounds
 */
async function main() {
  console.log('Downloading sound effects...\n');

  const results = [];

  for (const [filename, url] of Object.entries(SOUNDS)) {
    const destPath = path.join(SOUNDS_DIR, filename);

    // Skip if file already exists
    if (fs.existsSync(destPath)) {
      console.log(`✓ ${filename} (already exists)`);
      results.push({ filename, status: 'exists' });
      continue;
    }

    console.log(`Downloading ${filename}...`);

    try {
      await downloadFile(url, destPath);
      const stats = fs.statSync(destPath);
      console.log(`✓ ${filename} (${Math.round(stats.size / 1024)}KB)`);
      results.push({ filename, status: 'downloaded' });
    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      results.push({ filename, status: 'error', error: error.message });
    }
  }

  console.log('\n--- Summary ---');
  const downloaded = results.filter(r => r.status === 'downloaded').length;
  const existing = results.filter(r => r.status === 'exists').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`Downloaded: ${downloaded}`);
  console.log(`Already existed: ${existing}`);
  console.log(`Errors: ${errors}`);

  if (errors > 0) {
    console.log('\nTo manually download sounds, visit https://mixkit.co/free-sound-effects/');
    process.exit(1);
  }

  console.log('\nSound files are ready! They will be bundled with your app.');
}

main().catch(console.error);
