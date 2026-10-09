---
title: "Sync embeddings with changing source"
page: /documentation/tutorials-operations/incremental-embedding-updates/
# No skill: the catalog has nothing on keeping vectors in step with changing
# source text. The nearest entries are about switching models or slow indexing,
# and naming either would mislabel the prompt in the index.
---
Help me keep my embeddings in sync with source text that changes. Before anything else, check whether this pattern fits me at all: ask how many points I expect, whether my chunking is deterministic, and whether listing the current source is cheap, and tell me if I am past the point where diffing the whole collection on every run stops being affordable. If it does fit, design the two derived values for my data rather than copying the tutorial's: a deterministic ID built from whatever identifies a chunk's position in my source, and a content fingerprint over the exact text I embed. Say what my ID would be if a chunk moves, since that is what decides whether a move costs me a re-embed. Then give me the reconcile step that leaves unchanged chunks alone, re-embeds changed text, reuses the vector when text only moves, adds what is new, and deletes what is gone, and tell me how to verify a run did the right thing before I trust it on a schedule.
