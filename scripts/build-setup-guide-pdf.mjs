#!/usr/bin/env node
/**
 * Builds public/docs/setup-field-guide.pdf from the HTML guide (needs Chrome/Edge).
 *   npm run docs:setup-pdf
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const htmlPath = path.join(root, 'public', 'docs', 'setup-field-guide.html');
const pdfPath = path.join(root, 'public', 'docs', 'setup-field-guide.pdf');

function resolveBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const local = process.env.LOCALAPPDATA || '';
  const candidates = [
    path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(local, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

async function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error('Missing:', htmlPath);
    process.exit(1);
  }

  const { mdToPdf } = await import('md-to-pdf');
  const executablePath = resolveBrowserExecutable();
  const launch_options = executablePath ? { executablePath } : {};

  await mdToPdf(
    { path: htmlPath },
    {
      dest: pdfPath,
      launch_options,
      pdf_options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
      },
    },
  );
  console.log('✅ Wrote', pdfPath);
}

main().catch((err) => {
  console.error(err);
  console.error(
    'Fallback: باز کردن public/docs/setup-field-guide.html و Print → Save as PDF',
  );
  process.exit(1);
});
