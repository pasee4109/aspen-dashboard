// JSON API consumed by the dashboard: rules CRUD, activity logs, live simulate.
import express from 'express';
import { config, isLive } from './config.js';
import {
  getRules,
  saveRules,
  nextId,
  getLogs,
  clearLogs,
} from './store.js';
import { validateRule } from './rulesEngine.js';
import { processComment } from './processor.js';

export const apiRouter = express.Router();

apiRouter.get('/status', (req, res) => {
  const logs = getLogs();
  const rules = getRules();
  res.json({
    mode: isLive() ? 'live' : 'mock',
    configuredMode: config.mode,
    accountConnected: Boolean(config.ig.accessToken && config.ig.accountId),
    rulesCount: rules.length,
    activeRules: rules.filter((r) => r.active !== false).length,
    stats: {
      total: logs.length,
      sent: logs.filter((l) => l.status === 'sent').length,
      noMatch: logs.filter((l) => l.status === 'no-match').length,
      errors: logs.filter((l) => l.status === 'error').length,
    },
  });
});

// ── Rules ────────────────────────────────────────────────────────────────────
apiRouter.get('/rules', (req, res) => res.json(getRules()));

apiRouter.post('/rules', (req, res) => {
  const errors = validateRule(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const rules = getRules();
  const rule = normalizeRule(req.body, nextId());
  rules.push(rule);
  saveRules(rules);
  res.status(201).json(rule);
});

apiRouter.put('/rules/:id', (req, res) => {
  const errors = validateRule(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const rules = getRules();
  const idx = rules.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  rules[idx] = normalizeRule(req.body, req.params.id);
  saveRules(rules);
  res.json(rules[idx]);
});

// Partial update — used by the active on/off toggle.
apiRouter.patch('/rules/:id', (req, res) => {
  const rules = getRules();
  const idx = rules.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  rules[idx] = { ...rules[idx], ...req.body, id: req.params.id };
  saveRules(rules);
  res.json(rules[idx]);
});

apiRouter.delete('/rules/:id', (req, res) => {
  const rules = getRules();
  const next = rules.filter((r) => r.id !== req.params.id);
  if (next.length === rules.length)
    return res.status(404).json({ error: 'rule not found' });
  saveRules(next);
  res.status(204).end();
});

// ── Simulate: pretend a comment came in, run it through the pipeline ─────────
apiRouter.post('/simulate', async (req, res) => {
  const { text, username } = req.body || {};
  if (!text || !String(text).trim())
    return res.status(400).json({ error: 'text is required' });
  const result = await processComment({
    commentId: `sim_${Date.now()}`,
    text: String(text),
    username: username || 'demo_user',
    mediaId: 'sim_media',
    source: 'simulate',
  });
  res.json(result);
});

// ── Logs ─────────────────────────────────────────────────────────────────────
apiRouter.get('/logs', (req, res) => res.json(getLogs()));
apiRouter.delete('/logs', (req, res) => {
  clearLogs();
  res.status(204).end();
});

function normalizeRule(body, id) {
  return {
    id,
    name: String(body.name).trim(),
    keywords: (Array.isArray(body.keywords) ? body.keywords : [])
      .map((k) => String(k).trim())
      .filter(Boolean),
    matchType: body.matchType || 'contains',
    caseSensitive: Boolean(body.caseSensitive),
    dmMessage: String(body.dmMessage),
    publicReply: body.publicReply ? String(body.publicReply) : '',
    active: body.active !== false,
    priority: Number(body.priority) || 0,
  };
}
