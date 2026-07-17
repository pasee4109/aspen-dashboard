import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  matchRule,
  findMatchingRule,
  renderTemplate,
  validateRule,
} from '../src/rulesEngine.js';

test('contains match is case-insensitive by default', () => {
  const rule = { keywords: ['link'], matchType: 'contains', active: true };
  assert.equal(matchRule(rule, 'please send the LINK now'), true);
  assert.equal(matchRule(rule, 'nothing here'), false);
});

test('Thai keyword matches inside a sentence', () => {
  const rule = { keywords: ['ลิงก์'], matchType: 'contains', active: true };
  assert.equal(matchRule(rule, 'ขอลิงก์หน่อยค่ะ'), true);
});

test('exact match requires the whole comment', () => {
  const rule = { keywords: ['ราคา'], matchType: 'exact', active: true };
  assert.equal(matchRule(rule, 'ราคา'), true);
  assert.equal(matchRule(rule, 'ราคาเท่าไหร่'), false);
});

test('word match respects boundaries', () => {
  const rule = { keywords: ['ok'], matchType: 'word', active: true };
  assert.equal(matchRule(rule, 'ok great'), true);
  assert.equal(matchRule(rule, 'okay great'), false);
});

test('regex match works and invalid regex never matches', () => {
  const good = { keywords: ['promo|โค้ด'], matchType: 'regex', active: true };
  assert.equal(matchRule(good, 'มีโค้ดไหม'), true);
  const bad = { keywords: ['('], matchType: 'regex', active: true };
  assert.equal(matchRule(bad, 'anything ('), false);
});

test('inactive rules never match', () => {
  const rule = { keywords: ['link'], matchType: 'contains', active: false };
  assert.equal(matchRule(rule, 'link'), false);
});

test('caseSensitive rule distinguishes case', () => {
  const rule = { keywords: ['LINK'], matchType: 'contains', active: true, caseSensitive: true };
  assert.equal(matchRule(rule, 'link'), false);
  assert.equal(matchRule(rule, 'LINK'), true);
});

test('findMatchingRule picks highest priority, then order', () => {
  const rules = [
    { id: 'a', keywords: ['x'], matchType: 'contains', active: true, priority: 1 },
    { id: 'b', keywords: ['x'], matchType: 'contains', active: true, priority: 5 },
    { id: 'c', keywords: ['x'], matchType: 'contains', active: true, priority: 5 },
  ];
  assert.equal(findMatchingRule(rules, 'x marks').id, 'b');
});

test('findMatchingRule returns null when nothing matches', () => {
  const rules = [{ id: 'a', keywords: ['x'], matchType: 'contains', active: true }];
  assert.equal(findMatchingRule(rules, 'yyy'), null);
});

test('renderTemplate fills known placeholders and keeps unknown ones', () => {
  assert.equal(renderTemplate('hi @{{username}}', { username: 'bob' }), 'hi @bob');
  assert.equal(renderTemplate('{{missing}}', {}), '{{missing}}');
});

test('validateRule flags missing fields and bad regex', () => {
  assert.deepEqual(validateRule({}).length > 0, true);
  const ok = validateRule({
    name: 'r',
    keywords: ['a'],
    dmMessage: 'hi',
    matchType: 'contains',
  });
  assert.deepEqual(ok, []);
  const badRegex = validateRule({
    name: 'r',
    keywords: ['('],
    dmMessage: 'hi',
    matchType: 'regex',
  });
  assert.equal(badRegex.some((e) => e.includes('invalid regex')), true);
});
