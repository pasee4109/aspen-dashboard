# Vault conventions

You are working inside a Karpathy-style LLM Wiki (Second Brain). Read this
before any capture, edit, or synthesize task.

## Folder invariants

- `Concepts/` — atomic notes. 1 idea = 1 file. Filename is a noun phrase
  in Title Case (`Attention Mechanism.md`, not `notes_on_attention.md`).
- `Sources/` — raw source material: paper summaries, article excerpts,
  transcripts. Filename: `<Author> - <Short Title>.md` when known,
  otherwise the domain + slug.
- `Journal/` — daily notes, ISO date filename: `YYYY-MM-DD.md`.
- `Ideas/` — half-baked. Move to `Concepts/` once you can defend it in
  one paragraph.

## Writing style

- Short imperative sentences. No filler ("It is important to note that…").
- Every non-trivial claim links to a `Sources/` note using `[[wikilink]]`.
- Every new note links to ≥1 existing `Concepts/` note. If nothing fits,
  first ask the user whether the concept genuinely doesn't exist yet.
- Prefer bullet lists over prose when structure matters.

## When capturing

1. If input is a URL: fetch it, extract the substantive content, drop
   navigation/ads.
2. Create `Sources/<name>.md` with: link, one-line summary, key claims
   as bullets, a `## Related` section listing `[[Concepts]]` you linked.
3. For each new concept the source introduces, either link an existing
   `Concepts/*.md` or create a stub (title + 2-sentence definition +
   link back to the Source).

## When synthesizing

1. Grep across `Concepts/` and `Sources/` for terms in the question.
2. Walk `[[wikilinks]]` two hops out from the top hits.
3. Answer inline; cite as `([[Note Name]])` after each claim.
4. End with `## Gaps` listing concepts the vault doesn't cover yet.

## Never

- Rewrite an existing note's meaning silently. Propose the diff first.
- Delete Journal entries.
- Create files outside the folders above without asking.
