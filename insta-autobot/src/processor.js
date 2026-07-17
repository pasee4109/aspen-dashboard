// Orchestrates one incoming comment: match a rule, send the DM, log the result.
import { getRules, addLog } from './store.js';
import { findMatchingRule, renderTemplate } from './rulesEngine.js';
import { sendPrivateReply, replyToComment } from './instagram.js';
import { isLive } from './config.js';

// event: { commentId, text, username, mediaId, source }
export async function processComment(event) {
  const { commentId, text, username, mediaId, source = 'webhook' } = event;
  const rule = findMatchingRule(getRules(), text);

  const base = {
    at: new Date().toISOString(),
    mode: isLive() ? 'live' : 'mock',
    source,
    commentId: commentId || null,
    mediaId: mediaId || null,
    username: username || null,
    text: text || '',
  };

  if (!rule) {
    const entry = { ...base, status: 'no-match', ruleName: null, action: null };
    addLog(entry);
    return entry;
  }

  const vars = {
    username: username || 'there',
    keyword: (rule.keywords && rule.keywords[0]) || '',
  };
  const dmText = renderTemplate(rule.dmMessage, vars);
  const publicText = rule.publicReply
    ? renderTemplate(rule.publicReply, vars)
    : '';

  try {
    const dm = await sendPrivateReply({ commentId, text: dmText, username });
    let pub = null;
    if (publicText) pub = await replyToComment({ commentId, text: publicText });

    const entry = {
      ...base,
      status: 'sent',
      ruleId: rule.id,
      ruleName: rule.name,
      action: dmText,
      publicReply: publicText || null,
      detail: [dm?.detail, pub?.detail].filter(Boolean).join(' | '),
    };
    addLog(entry);
    return entry;
  } catch (err) {
    const entry = {
      ...base,
      status: 'error',
      ruleId: rule.id,
      ruleName: rule.name,
      action: dmText,
      detail: err.message,
    };
    addLog(entry);
    return entry;
  }
}
