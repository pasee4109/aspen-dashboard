---
name: capture
description: Capture a URL, paper, or raw text into Sources/ and link it into the concept graph. Trigger when the user pastes a link or says "add this / capture this / save this".
---

# capture

## Steps

1. Identify the input:
   - URL → fetch it (WebFetch), extract substantive content
   - Paper title / arxiv id → resolve to a link, then fetch
   - Pasted text → treat as-is, ask for source URL if missing
2. Draft a filename: `Sources/<Author> - <Short Title>.md` when known,
   else `Sources/<domain>-<slug>.md`.
3. Write the source note using this template:

```md
# <Title>

- **Link**: <url>
- **Author**: <author or unknown>
- **Captured**: <ISO date>

## TL;DR

<one sentence>

## Key claims

- ...
- ...

## Related

- [[Concept A]]
- [[Concept B]]
```

4. For each concept referenced, grep `Concepts/` case-insensitive. If a
   file exists, link to it. If not, create a stub:

```md
# <Concept>

<2-sentence definition in your own words>

## Sources

- [[Sources/<the source you just captured>]]
```

5. Report back: which Source was created, which Concepts were touched
   (new vs existing), and any concepts the user should confirm.
