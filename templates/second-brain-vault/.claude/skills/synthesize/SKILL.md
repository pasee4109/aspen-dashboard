---
name: synthesize
description: Answer a question by traversing the vault's concept graph and citing every claim. Trigger when the user asks a substantive question about topics in the vault.
---

# synthesize

## Steps

1. Extract 2-5 keyword phrases from the question.
2. Grep `Concepts/` and `Sources/` for each phrase, case-insensitive.
3. Read the top ~5 matching notes in full.
4. Walk `[[wikilinks]]` two hops out. Read anything that looks relevant.
5. Draft the answer:
   - Lead with the direct answer in 1-3 sentences.
   - Support each claim with an inline citation: `([[Note Name]])`.
   - If claims come from a Source, cite the Source: `([[Sources/X]])`.
6. End with a `## Gaps` section listing concepts the vault should cover
   but doesn't yet (based on what you looked for but couldn't find).
7. Do NOT invent facts to fill gaps — flag them instead.

## Output format

```md
<direct answer>

<supporting paragraphs with [[citations]]>

## Gaps

- <concept you searched for but didn't find>
- ...
```
