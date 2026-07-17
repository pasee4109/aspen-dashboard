// Dashboard front-end. Vanilla JS, talks to the /api/* endpoints.
const $ = (id) => document.getElementById(id);
const api = (path, opts) =>
  fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]),
  );
}

// ── Status ───────────────────────────────────────────────────────────────────
async function refreshStatus() {
  const s = await (await api('/status')).json();
  const pill = $('modePill');
  pill.textContent = s.mode === 'live' ? '🟢 LIVE' : '🟡 MOCK';
  pill.title =
    s.mode === 'live'
      ? 'ต่อ Instagram Graph API แล้ว — ส่ง DM จริง'
      : 'โหมดจำลอง — ไม่ยิงจริง แค่บันทึก log';
  $('statSent').textContent = s.stats.sent;
  $('statRules').textContent = `${s.activeRules}/${s.rulesCount}`;
}

// ── Rules ────────────────────────────────────────────────────────────────────
async function refreshRules() {
  const rules = await (await api('/rules')).json();
  const wrap = $('rulesList');
  if (!rules.length) {
    wrap.innerHTML = `<p class="hint">ยังไม่มี rule กด “+ เพิ่ม rule” เพื่อสร้างอันแรก</p>`;
    return;
  }
  wrap.innerHTML = rules
    .map(
      (r) => `
    <div class="rule ${r.active === false ? 'off' : ''}">
      <div class="rule-top">
        <span class="rule-name">${esc(r.name)}</span>
        <label class="switch" title="เปิด/ปิด">
          <input type="checkbox" data-toggle="${r.id}" ${r.active === false ? '' : 'checked'} />
          <span class="slider"></span>
        </label>
      </div>
      <div class="kw">${r.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
      <div class="rule-dm">💬 ${esc(r.dmMessage)}</div>
      <div class="rule-meta">
        match: <b>${esc(r.matchType)}</b> · priority: ${r.priority || 0}
        ${r.publicReply ? `· public: “${esc(r.publicReply)}”` : ''}
      </div>
      <div class="rule-actions" style="margin-top:10px">
        <button class="ghost small" data-edit="${r.id}">แก้ไข</button>
        <button class="ghost small" data-del="${r.id}">ลบ</button>
      </div>
    </div>`,
    )
    .join('');

  wrap.querySelectorAll('[data-toggle]').forEach((el) =>
    el.addEventListener('change', async (e) => {
      await api(`/rules/${e.target.dataset.toggle}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: e.target.checked }),
      });
      refreshStatus();
      refreshRules();
    }),
  );
  wrap.querySelectorAll('[data-edit]').forEach((el) =>
    el.addEventListener('click', () => openEditor(rules.find((r) => r.id === el.dataset.edit))),
  );
  wrap.querySelectorAll('[data-del]').forEach((el) =>
    el.addEventListener('click', async () => {
      if (!confirm('ลบ rule นี้?')) return;
      await api(`/rules/${el.dataset.del}`, { method: 'DELETE' });
      refreshStatus();
      refreshRules();
    }),
  );
}

// ── Modal editor ─────────────────────────────────────────────────────────────
function openEditor(rule) {
  $('modalTitle').textContent = rule ? 'แก้ไข rule' : 'เพิ่ม rule';
  $('ruleId').value = rule?.id || '';
  $('ruleName').value = rule?.name || '';
  $('ruleKeywords').value = (rule?.keywords || []).join(', ');
  $('ruleMatchType').value = rule?.matchType || 'contains';
  $('rulePriority').value = rule?.priority || 0;
  $('ruleCase').checked = Boolean(rule?.caseSensitive);
  $('ruleDm').value = rule?.dmMessage || '';
  $('rulePublic').value = rule?.publicReply || '';
  $('ruleActive').checked = rule ? rule.active !== false : true;
  $('formError').hidden = true;
  $('modal').hidden = false;
}
function closeEditor() {
  $('modal').hidden = true;
}

async function saveRule(e) {
  e.preventDefault();
  const id = $('ruleId').value;
  const payload = {
    name: $('ruleName').value,
    keywords: $('ruleKeywords').value.split(',').map((s) => s.trim()).filter(Boolean),
    matchType: $('ruleMatchType').value,
    priority: Number($('rulePriority').value) || 0,
    caseSensitive: $('ruleCase').checked,
    dmMessage: $('ruleDm').value,
    publicReply: $('rulePublic').value,
    active: $('ruleActive').checked,
  };
  const res = await api(id ? `/rules/${id}` : '/rules', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    $('formError').textContent = (err.errors || [err.error || 'บันทึกไม่สำเร็จ']).join(', ');
    $('formError').hidden = false;
    return;
  }
  closeEditor();
  refreshStatus();
  refreshRules();
}

// ── Simulate ─────────────────────────────────────────────────────────────────
async function simulate() {
  const text = $('simText').value.trim();
  if (!text) return;
  const res = await api('/simulate', {
    method: 'POST',
    body: JSON.stringify({ text, username: $('simUser').value.trim() || 'demo_user' }),
  });
  const r = await res.json();
  const box = $('simResult');
  box.hidden = false;
  box.className = `sim-result ${r.status}`;
  if (r.status === 'no-match') {
    box.innerHTML = `😴 ไม่มี rule ไหนตรงกับข้อความนี้ — ไม่ส่ง DM`;
  } else if (r.status === 'error') {
    box.innerHTML = `❌ เกิดข้อผิดพลาด: ${esc(r.detail)}`;
  } else {
    box.innerHTML =
      `✅ ตรงกับ rule <b>${esc(r.ruleName)}</b> (${r.mode.toUpperCase()})` +
      `<div class="r-dm">💬 ${esc(r.action)}</div>` +
      (r.publicReply ? `<div style="margin-top:6px">↩️ public: ${esc(r.publicReply)}</div>` : '');
  }
  refreshStatus();
  refreshLogs();
}

// ── Logs ─────────────────────────────────────────────────────────────────────
async function refreshLogs() {
  const logs = await (await api('/logs')).json();
  const body = $('logBody');
  if (!logs.length) {
    body.innerHTML = `<tr><td colspan="4" class="empty">ยังไม่มีกิจกรรม</td></tr>`;
    return;
  }
  body.innerHTML = logs
    .slice(0, 100)
    .map((l) => {
      const t = new Date(l.at).toLocaleTimeString('th-TH', { hour12: false });
      const label = { sent: 'ส่งแล้ว', 'no-match': 'ไม่ตรง', error: 'error' }[l.status] || l.status;
      return `<tr>
        <td>${t}</td>
        <td>@${esc(l.username || '-')}</td>
        <td>${esc(l.text)}</td>
        <td><span class="badge ${l.status}">${label}</span></td>
      </tr>`;
    })
    .join('');
}

// ── Wire up ──────────────────────────────────────────────────────────────────
$('simBtn').addEventListener('click', simulate);
$('simText').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) simulate();
});
$('addRule').addEventListener('click', () => openEditor(null));
$('closeModal').addEventListener('click', closeEditor);
$('cancelBtn').addEventListener('click', closeEditor);
$('ruleForm').addEventListener('submit', saveRule);
$('clearLogs').addEventListener('click', async () => {
  if (!confirm('ล้าง log ทั้งหมด?')) return;
  await api('/logs', { method: 'DELETE' });
  refreshStatus();
  refreshLogs();
});
$('modal').addEventListener('click', (e) => {
  if (e.target === $('modal')) closeEditor();
});

// Initial load + periodic refresh of logs/status.
refreshStatus();
refreshRules();
refreshLogs();
setInterval(() => {
  refreshStatus();
  refreshLogs();
}, 5000);
