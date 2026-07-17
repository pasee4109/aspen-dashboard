// Pure, dependency-free matching logic — the heart of the bot.
// Given an incoming comment's text, decide which auto-reply rule (if any) fires.
//
// A rule looks like:
//   {
//     id, name,
//     keywords: ["link", "ลิงก์"],
//     matchType: "contains" | "exact" | "word" | "regex",
//     caseSensitive: false,
//     dmMessage: "Thanks! Here's the link 👉 {{link}}",
//     publicReply: "Check your DMs 💌",   // optional
//     active: true,
//     priority: 0
//   }

function normalize(text, caseSensitive) {
  const t = String(text ?? '').trim();
  return caseSensitive ? t : t.toLowerCase();
}

function keywordMatches(keyword, text, matchType, caseSensitive) {
  const k = normalize(keyword, caseSensitive);
  const t = normalize(text, caseSensitive);
  if (!k) return false;

  switch (matchType) {
    case 'exact':
      return t === k;
    case 'word': {
      // whole-word match, unicode-aware boundaries via surrounding non-letters
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(
        `(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`,
        caseSensitive ? 'u' : 'iu',
      );
      return re.test(String(text ?? ''));
    }
    case 'regex':
      try {
        const re = new RegExp(keyword, caseSensitive ? '' : 'i');
        return re.test(String(text ?? ''));
      } catch {
        return false; // invalid regex never matches (surfaced at save time)
      }
    case 'contains':
    default:
      return t.includes(k);
  }
}

// Does a single rule match the given text?
export function matchRule(rule, text) {
  if (!rule || rule.active === false) return false;
  const keywords = Array.isArray(rule.keywords) ? rule.keywords : [];
  if (keywords.length === 0) return false;
  const matchType = rule.matchType || 'contains';
  const caseSensitive = Boolean(rule.caseSensitive);
  return keywords.some((kw) =>
    keywordMatches(kw, text, matchType, caseSensitive),
  );
}

// Find the best matching rule: highest priority wins, ties broken by list order.
export function findMatchingRule(rules, text) {
  const candidates = (rules || [])
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => matchRule(rule, text))
    .sort((a, b) => {
      const pa = a.rule.priority || 0;
      const pb = b.rule.priority || 0;
      if (pb !== pa) return pb - pa; // higher priority first
      return a.index - b.index; // stable: earlier rule wins ties
    });
  return candidates.length ? candidates[0].rule : null;
}

// Fill {{placeholders}} in a reply template with context values.
export function renderTemplate(template, vars = {}) {
  return String(template ?? '').replace(
    /\{\{\s*([\w]+)\s*\}\}/g,
    (whole, key) => (key in vars && vars[key] != null ? String(vars[key]) : whole),
  );
}

// Validate a rule before saving; returns an array of human-readable errors.
export function validateRule(rule) {
  const errors = [];
  if (!rule || typeof rule !== 'object') return ['rule must be an object'];
  if (!rule.name || !String(rule.name).trim()) errors.push('name is required');
  const keywords = Array.isArray(rule.keywords)
    ? rule.keywords.filter((k) => String(k).trim())
    : [];
  if (keywords.length === 0) errors.push('at least one keyword is required');
  if (!rule.dmMessage || !String(rule.dmMessage).trim())
    errors.push('dmMessage is required');
  const allowed = ['contains', 'exact', 'word', 'regex'];
  if (rule.matchType && !allowed.includes(rule.matchType))
    errors.push(`matchType must be one of: ${allowed.join(', ')}`);
  if (rule.matchType === 'regex') {
    for (const kw of keywords) {
      try {
        new RegExp(kw);
      } catch (e) {
        errors.push(`invalid regex "${kw}": ${e.message}`);
      }
    }
  }
  return errors;
}
