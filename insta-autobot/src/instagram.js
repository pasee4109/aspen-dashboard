// Instagram Graph API client.
//
// Two behaviours:
//   • MOCK  (default) — no network. Returns a fake success so you can develop,
//     demo and test the whole flow without a Meta app or real account.
//   • LIVE  — calls the real Graph API to send a private reply (DM) to the user
//     who left a comment, and optionally posts a public reply on the comment.
//
// The "private reply to a comment" is the exact mechanism ManyChat-style
// comment-to-DM automations use under the hood:
//   POST /{ig-account-id}/messages
//   { recipient: { comment_id }, message: { text } }
import { config, isLive } from './config.js';

const BASE = `https://graph.facebook.com/${config.graphApiVersion}`;

async function graphPost(pathname, body) {
  const url = `${BASE}/${pathname}?access_token=${encodeURIComponent(
    config.ig.accessToken,
  )}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Graph API error: ${msg}`);
  }
  return data;
}

// Send a private reply (DM) to the author of a comment.
export async function sendPrivateReply({ commentId, text, username }) {
  if (!isLive()) {
    return {
      ok: true,
      simulated: true,
      detail: `MOCK DM to @${username || 'user'}: "${text}"`,
    };
  }
  const data = await graphPost(`${config.ig.accountId}/messages`, {
    recipient: { comment_id: commentId },
    message: { text },
  });
  return { ok: true, simulated: false, detail: `DM sent`, response: data };
}

// Optionally post a public reply beneath the comment.
export async function replyToComment({ commentId, text }) {
  if (!text) return { ok: true, simulated: true, detail: 'no public reply' };
  if (!isLive()) {
    return {
      ok: true,
      simulated: true,
      detail: `MOCK public reply on ${commentId}: "${text}"`,
    };
  }
  const data = await graphPost(`${commentId}/replies`, { message: text });
  return { ok: true, simulated: false, detail: 'public reply posted', response: data };
}
