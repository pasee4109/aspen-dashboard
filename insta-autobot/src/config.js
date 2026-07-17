// Loads configuration from environment variables, optionally seeded from a
// local .env file.  Kept dependency-free: a minimal .env parser instead of dotenv.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // strip optional surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

export const config = {
  rootDir,
  mode: (process.env.BOT_MODE || 'mock').toLowerCase(), // "mock" | "live"
  port: Number(process.env.PORT) || 3000,
  ig: {
    accessToken: process.env.IG_ACCESS_TOKEN || '',
    accountId: process.env.IG_ACCOUNT_ID || '',
  },
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'change-me',
  graphApiVersion: 'v21.0',
};

export function isLive() {
  return (
    config.mode === 'live' &&
    Boolean(config.ig.accessToken) &&
    Boolean(config.ig.accountId)
  );
}
