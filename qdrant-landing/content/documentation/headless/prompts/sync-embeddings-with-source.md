---
title: "Sync embeddings with changing source"
page: /documentation/tutorials-operations/incremental-embedding-updates/
---
Help me keep my embeddings in sync when the source text changes.

First, check whether comparing the full source with the collection on every run is practical. Ask how many points I expect, whether my chunking is deterministic, and how expensive it is to list the current source. Tell me if a full comparison on each run would be too costly before designing the sync process.

If this approach fits, help me define two values based on my data:
- A deterministic ID based on what identifies a chunk’s position in the source.
- A content fingerprint based on the exact text I embed.

Explain what happens to the ID when a chunk moves, and how to recognize unchanged text at a new position so I can reuse its vector.

Then show me a reconciliation step that leaves unchanged chunks alone, re-embeds changed text, reuses existing vectors when text only moves, adds new chunks, and deletes chunks that are no longer in the source.

Finish with checks I can run to verify that the sync made the right changes before I schedule it to run automatically.
