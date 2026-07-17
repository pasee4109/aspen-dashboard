// Instagram webhook: verification handshake + incoming comment events.
// https://developers.facebook.com/docs/instagram-platform/webhooks
import express from 'express';
import { config } from './config.js';
import { processComment } from './processor.js';

export const webhookRouter = express.Router();

// 1) Verification handshake — Meta calls this once when you subscribe.
webhookRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.webhookVerifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2) Event delivery — Meta POSTs comment (and other) events here.
webhookRouter.post('/webhook', async (req, res) => {
  // Acknowledge fast; Meta retries if we're slow or error out.
  res.sendStatus(200);
  try {
    const events = extractCommentEvents(req.body);
    for (const ev of events) {
      await processComment({ ...ev, source: 'webhook' });
    }
  } catch (err) {
    console.error('[webhook] processing error:', err.message);
  }
});

// Pull comment events out of the Instagram webhook payload shape.
export function extractCommentEvents(payload) {
  const out = [];
  const entries = payload?.entry || [];
  for (const entry of entries) {
    const mediaId = entry?.id;
    for (const change of entry?.changes || []) {
      if (change.field !== 'comments') continue;
      const v = change.value || {};
      // A user commenting on our own media may echo our own replies back —
      // ignore comments authored by our own account to avoid loops.
      if (v.from?.id && config.ig.accountId && v.from.id === config.ig.accountId)
        continue;
      out.push({
        commentId: v.id,
        text: v.text || '',
        username: v.from?.username || v.username || null,
        mediaId: v.media?.id || mediaId || null,
      });
    }
  }
  return out;
}
