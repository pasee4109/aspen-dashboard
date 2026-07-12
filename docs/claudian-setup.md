# Claudian Plugin Setup

Claudian ([YishenTu/claudian](https://github.com/YishenTu/claudian)) เอา Claude
Code / Codex มาอยู่ใน sidebar ของ Obsidian โดยใช้ vault เป็น working
directory ของ agent (อ่าน/เขียน/ค้นไฟล์ + bash + multi-step workflow)

> หมายเหตุ: การติดตั้ง plugin ต้องทำใน**เครื่องที่มี Obsidian จริงๆ**
> (macOS / Linux / Windows) session cloud/remote ทำแทนไม่ได้
> repo นี้เก็บแค่ script + guide ไว้ให้ pull ลงเครื่องแล้วรัน

## Prerequisites

ก่อนติดตั้ง ตรวจว่ามีของพวกนี้ในเครื่อง:

- Obsidian **v1.7.2** ขึ้นไป
- Claude Code CLI — install แบบ native แนะนำ ([docs](https://docs.claude.com/en/docs/claude-code/setup))
  พร้อม subscription/API key
- (optional) Codex CLI ถ้าอยากใช้ provider เป็น Codex
- Node.js + npm (ถ้าจะ build from source)
- git

## Install

### วิธี 1 — Community Plugin store (ง่ายสุด)

1. Obsidian → Settings → Community plugins → Browse
2. ค้นคำว่า `Claudian` (plugin id: `realclaudian`)
3. Install → Enable

### วิธี 2 — Script ใน repo นี้

Clone repo นี้ (หรือ pull branch `claude/claudian-plugin-setup-lxg8by`) แล้ว
รันตามระบบ:

**macOS / Linux**

```bash
chmod +x scripts/install-claudian.sh
./scripts/install-claudian.sh /path/to/your/vault
```

**Windows (PowerShell)**

```powershell
.\scripts\install-claudian.ps1 -Vault "C:\path\to\your\vault"
```

Script จะ:

1. เช็คว่า `claude`, `codex`, `node`, `npm`, `git` อยู่บน PATH
2. `git clone` repo Claudian เข้า `<vault>/.obsidian/plugins/claudian/`
3. `npm install && npm run build`

ถ้าไม่อยาก build จาก source (โหลด main.js/manifest.json/styles.css จาก
GitHub Release แทน):

```bash
BUILD_FROM_SRC=0 ./scripts/install-claudian.sh /path/to/your/vault
```

```powershell
.\scripts\install-claudian.ps1 -Vault "C:\path\to\your\vault" -FromRelease
```

### วิธี 3 — Manual

โหลด `main.js`, `manifest.json`, `styles.css` จาก
[latest release](https://github.com/YishenTu/claudian/releases) → วางที่
`<vault>/.obsidian/plugins/claudian/` → เปิด Obsidian → Enable

## Post-install

1. เปิด vault ใน Obsidian
2. Settings → Community plugins → เปิด `Claudian`
3. ถ้าเจอ error `Claude CLI not found` (เจอบ่อยกับคนที่ใช้ nvm/fnm/mise):
   Settings → Advanced → Claude CLI path — วาง output ของคำสั่งนี้:
   - macOS/Linux: `which claude`
   - Windows: `where.exe claude`
4. Trust vault ตอน Obsidian ถาม (ให้ agent รัน bash + เขียนไฟล์ได้)

## แยก Workspace ต่อ CLI (Claude / Codex)

ถ้าอยากมี desktop shortcut แยก — กดไอคอนแล้วเปิด vault + config ของ
Claude หรือ Codex เลย ไม่ต้องเลือกทุกรอบ

Obsidian จำ workspace ล่าสุดต่อ vault ผ่านไฟล์ `.obsidian/workspace.json`
ทางที่ง่ายที่สุดคือ**แยก vault คนละอัน** (หรือ symlink ไปยัง content
เดียวกัน) แล้วเปิดผ่าน URI:

```
obsidian://open?vault=Claude
obsidian://open?vault=Codex
```

Shortcut ตัวอย่าง:

- **macOS**: สร้าง Automator Quick Action → Run Shell Script
  `open "obsidian://open?vault=Claude"` → save เป็น app แล้ววาง Dock
- **Windows**: คลิกขวา desktop → New → Shortcut → ใส่ target
  `obsidian://open?vault=Claude`
- **Linux**: สร้าง `.desktop` file, `Exec=xdg-open obsidian://open?vault=Claude`

ใน vault แต่ละอันตั้งค่า Claudian provider ให้ตรง (Claude vs Codex)

## Troubleshooting

- **`command not found: claude`** → install Claude Code CLI ก่อน แล้วเปิด
  terminal ใหม่ (PATH refresh)
- **plugin ไม่ขึ้นใน Community plugins list** → เช็คว่า Restricted mode
  ปิดอยู่ (Settings → Community plugins → Turn on community plugins)
- **`npm run build` fail** → เช็ค Node เวอร์ชัน (Claudian ใช้ modern
  tooling; แนะนำ Node LTS ล่าสุด)

## Vault template (Second Brain)

ถ้าอยากเริ่มจาก vault เปล่า มี starter template ให้ที่
[`templates/second-brain-vault/`](../templates/second-brain-vault/README.md)
— แนว LLM Wiki / Second Brain แบบ Karpathy พร้อม `CLAUDE.md` +
starter skills (`capture`, `synthesize`) ที่ Claudian จะเห็นทันที

Copy ไปเป็น vault ใหม่:

```bash
cp -r templates/second-brain-vault ~/Vaults/brain
./scripts/install-claudian.sh ~/Vaults/brain
```

## Links

- Repo: https://github.com/YishenTu/claudian
- Docs: https://claudian.xyz/en/docs/install/
- Obsidian community listing: https://community.obsidian.md/plugins/realclaudian
