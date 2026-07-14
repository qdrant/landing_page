---
name: qdrant-content
description: "Writing and review standard for Qdrant content in this repo — blog posts, articles, tutorials, docs, case studies, web copy, and READMEs. Use this whenever you draft or review anything customer-facing under qdrant-landing/content/ or elsewhere in the repo. It carries the house rules on brevity, plain language, and Qdrant vocabulary, then routes you through the review gates (/qdrant-messaging, /andrey-review, /trim) before the work ships. Trigger on 'write a blog/article/tutorial/doc', 'review this draft', 'edit this page', 'is this ready to ship', or any authoring or reviewing of Qdrant-facing prose."
---

# Writing Qdrant Content

This skill is the shared standard for anything customer-facing we publish from this repo: blog posts, articles, tutorials, docs, case studies, web copy, READMEs.

Read it before you draft or review. It has two parts: the three rules that matter most, then the full checklist and the review gates.

## The three rules — get these right first

Most rework comes from missing one of these. They are not style preferences; they are what makes our content read as Qdrant.

### 1. Be brief. Answer, then stop.

Lead with the result or the point. Cut the runway.

- State each point once. No recap section that repeats the body, no results narrated item-by-item or dataset-by-dataset.
- If a draft runs about twice as long as it needs to, that reads as AI-written. Cut it back.
- Reference detail — stack, parameters, caveats — goes in a caption, footnote, or link, not the main line.
- A reviewer who says "one paragraph" means one paragraph, not three plus a code block. Scope markers are ceilings.
- Prefer prose over code blocks unless the reader needs to see the code.

### 2. No jargon. No coined terms.

Use the plain word, and use the word our published content already uses.

- Never invent a term. Insider shorthand — "load-bearing", "idempotent", "canonical", "sibling", "qrels", "relevance judgments" — gets replaced with the plain equivalent. Say "eval set with known-relevant documents", not "qrels".
- If a noun doesn't appear in sibling pieces already published, it's probably coined. Cut it.
- One idea per sentence. A sentence carrying three concepts gets split.
- Describe what things are and do, not what they aren't. A sentence built on "none / never / no / rather than" gets restructured around the actual fields and operations.
- No hedges ("honest", "just", "actually", "basically"), no defensive disclaimers. Tradeoffs get numbers.

### 3. Qdrant vocabulary. Never "vector database".

Describe Qdrant as a **vector search engine**. Not a "vector database" — that phrasing invites commodity comparisons and it isn't how we position ourselves. You may mention the category in passing, but never as Qdrant's own description.

- Verify every product fact against a canonical source before you assert it: versions, API names, parameters, defaults, behavior. Never write one from memory.
- In docs, lead with the parameter the reader will use and what it does — not the API mechanism or the plumbing behind it. When a feature uses a Qdrant capability, name it and link the official docs page instead of re-explaining the mechanics.
- Write as if the current design is the only design. After a change, don't reference "the old way" — readers can't see the doc's history.

## Full checklist

Before the gates, check the draft against these:

- **Match the siblings first.** Read one or two existing pieces of the same type and mirror their vocabulary, density, and sentence length.
- **Problem first.** Lead with what breaks before you introduce what fixes it. Don't give the answer in the opening line.
- **Proof, not adjectives.** "75% RAM reduction" beats "significantly more efficient". Every marketing claim gets a proof point right after it. If the result is modest, say so and stay open-ended — don't pick a metric that flatters a marginal number.
- **Clear the expertise bar.** A blog or article implies "we know this space." Something a reader would try first anyway doesn't earn a standalone piece — go deeper into the hard question, or fold it into a tutorial.
- **Right channel.** Blog is narrative, docs are reference, examples are runnable code. A caveated technical recommendation belongs in docs, not a blog.
- **Tutorial code:** use obviously-broken placeholders over runnable-but-wrong defaults when a silent mismatch would look like a product bug (`from your_embedding_model import embed`, not a concrete model that must match the collection). Illustrative examples can be plausible-but-fabricated; load-bearing ones get verified.
- **Mechanics:** American English, Oxford comma, active voice, Title Case for headings. No em dashes. Meaningful link text, never "click here". Don't hard-wrap prose — one line per paragraph.

## The review gates — run them in order

Draft, self-check against the rules above, then run the gates. Each owns a different job. Don't skip.

All three ship in this repo or org-wide, so they're already available — nothing to install.

1. **`/qdrant-messaging` — mandatory, every customer-facing piece.** Owns voice, positioning, and brand facts. Docs are not exempt.
2. **`/andrey-review` — default on substantive pieces** (blog post, tutorial, article, workshop, example) before you hand it back. Owns technical credibility: correct, non-trivial, measurable, lean. Skip only for small edits to an existing piece.
3. **`/trim` — for scope.** Cut to the shortest version that still does the job: does this section need to exist, does an existing piece already cover it, can it be shorter.

If a gate flags something, fix it and note the fix — don't argue it away. The gates exist to catch what a single pass misses.
