#!/usr/bin/env node
// Fetch the Material Icons codepoints file and produce src/icon-index.json
// Usage: ./scripts/generate-icon-index.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const URL = 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/codepoints';
const OUT_PATH = path.resolve(__dirname, '../src/icon-index.json');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`Request failed: ${res.statusCode}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

(async () => {
  console.log('Fetching icon index from', URL);
  try {
    const txt = await fetchText(URL);
    const names = txt.split(/\r?\n/)
      .map(line => (line || '').trim())
      .filter(Boolean)
      .map(line => line.split(/\s+/)[0])
      .filter(Boolean);

    const unique = Array.from(new Set(names));
    unique.sort((a, b) => a.localeCompare(b));

    // Write output
    const json = JSON.stringify(unique, null, 4);
    fs.writeFileSync(OUT_PATH, json + '\n', 'utf8');
    console.log(`Wrote ${unique.length} icons to ${OUT_PATH}`);
  } catch (err) {
    console.error('Failed to generate icon index:', err.message || err);
    process.exitCode = 2;
  }
})();

