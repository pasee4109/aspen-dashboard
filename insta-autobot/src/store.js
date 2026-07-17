// Tiny JSON-file persistence for rules and activity logs. No database needed —
// the whole point of the bot is to be trivially self-hostable.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const dataDir = path.join(config.rootDir, 'data');
const rulesPath = path.join(dataDir, 'rules.json');
const logsPath = path.join(dataDir, 'logs.json');
const seedPath = path.join(dataDir, 'rules.seed.json');

const MAX_LOGS = 500;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureDataDir();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file); // atomic-ish replace
}

// ── Rules ──────────────────────────────────────────────────────────────────
export function getRules() {
  ensureDataDir();
  if (!fs.existsSync(rulesPath)) {
    // First run: seed from the bundled example so the dashboard isn't empty.
    const seed = readJson(seedPath, []);
    writeJson(rulesPath, seed);
    return seed;
  }
  return readJson(rulesPath, []);
}

export function saveRules(rules) {
  writeJson(rulesPath, rules);
  return rules;
}

let idCounter = Date.now();
export function nextId() {
  idCounter += 1;
  return `rule_${idCounter.toString(36)}`;
}

// ── Activity log ─────────────────────────────────────────────────────────────
export function getLogs() {
  return readJson(logsPath, []);
}

export function addLog(entry) {
  const logs = getLogs();
  logs.unshift(entry); // newest first
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
  writeJson(logsPath, logs);
  return entry;
}

export function clearLogs() {
  writeJson(logsPath, []);
}
