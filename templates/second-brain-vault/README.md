# Second Brain Vault (Karpathy-style LLM Wiki)

โครงสร้าง vault เริ่มต้นสำหรับใช้เป็น "LLM Wiki" / Second Brain กับ
[Claudian](https://github.com/YishenTu/claudian) หรือ Claude Code ทั่วไป
แนวคิดยืมจาก Andrej Karpathy — ทุกอย่างเป็น markdown flat file
LLM agent เดิน link + ค้นเนื้อหาได้เอง ไม่มี database พึ่งเอง

## วิธีใช้

1. Copy โฟลเดอร์นี้ไปเป็น vault ใหม่ (ตั้งชื่อได้ตามใจ เช่น `~/Vaults/brain`)
2. เปิดใน Obsidian → Trust vault
3. ติดตั้ง Claudian (`scripts/install-claudian.sh /path/to/brain`)
4. เปิด Claudian sidebar → เริ่มคุยกับ agent

## Layout

```
brain/
├── CLAUDE.md              # conventions ที่ agent อ่านก่อน (invariants)
├── Concepts/              # atomic concept notes — 1 idea = 1 file
├── Sources/               # papers, articles, transcripts (raw material)
├── Journal/               # daily notes / stream of consciousness
├── Ideas/                 # half-baked, in-progress
└── .claude/skills/        # reusable prompts (เรียกด้วย $ ใน Claudian)
    ├── capture/
    └── synthesize/
```

## หลักการ 4 ข้อ

1. **Atomic** — 1 concept = 1 file ตั้งชื่อไฟล์เป็น noun phrase
   (`Attention Mechanism.md`, ไม่ใช่ `notes on attention.md`)
2. **Linked** — ทุกไฟล์ใหม่ต้อง link ไป concept ที่มีอยู่แล้วอย่างน้อย 1 อัน
   ใช้ `[[wikilinks]]` ของ Obsidian
3. **Sourced** — claim ที่ไม่ trivial ต้องอ้าง source ใน `Sources/`
4. **Agent-writable** — เขียน note ให้ short, imperative, ไม่มี fluff
   agent ต้อง grep เจอง่าย

## Karpathy pattern

Karpathy บอกว่า notes ของเขา = "growing knowledge graph ที่ LLM ช่วยจัดให้"
key insight: อย่ากลัวจะให้ LLM เขียน/แก้ notes ของเราเอง เพราะสุดท้าย
เราจะ query notes ผ่าน LLM ตลอด ดังนั้น optimize สำหรับ LLM ก่อน แล้ว
มนุษย์อ่านทีหลัง (คล้ายๆ ทำไม docs ที่ดีสุดคือ docs ที่ Claude Code
เขียนได้ตรงคำถามแรก)

Workflow ทั่วไป:
- **Capture** — โยน link/paper/thought ลงมาแล้วบอก agent "add this"
- **Link** — agent หา concept ใกล้ๆ แล้วเสนอ `[[link]]`
- **Synthesize** — ถามคำถาม, agent traverse graph + คืนคำตอบพร้อม backlink

## Skills ที่ให้มา

- `capture` — รับ URL หรือ text → สร้าง Source note + link ไป Concepts
- `synthesize` — รับคำถาม → traverse graph → คืนคำตอบพร้อม inline citation

พิมพ์ `$capture` หรือ `$synthesize` ใน Claudian sidebar เพื่อเรียก
