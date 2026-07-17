// insta-autobot — comment-to-DM automation bot.
// Serves the config dashboard, the JSON API, and the Instagram webhook.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, isLive } from './src/config.js';
import { apiRouter } from './src/api.js';
import { webhookRouter } from './src/webhook.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Webhook must see the raw shape Meta sends — mount before static.
app.use('/', webhookRouter);
app.use('/api', apiRouter);

// Dashboard (static SPA).
app.use(express.static(path.join(__dirname, 'public')));

app.get('/healthz', (req, res) => res.json({ ok: true }));

const server = app.listen(config.port, () => {
  const modeLabel = isLive() ? 'LIVE (Instagram Graph API)' : 'MOCK (no network)';
  console.log(`\n  insta-autobot running`);
  console.log(`  ─ mode:      ${modeLabel}`);
  console.log(`  ─ dashboard: http://localhost:${config.port}/`);
  console.log(`  ─ webhook:   http://localhost:${config.port}/webhook\n`);
  if (config.mode === 'live' && !isLive()) {
    console.log(
      '  ⚠  BOT_MODE=live but IG_ACCESS_TOKEN / IG_ACCOUNT_ID missing — staying in MOCK.\n',
    );
  }
});

export { app, server };
