---
title: "Branch-Aware Semantic Code Search with Qdrant"
draft: false
slug: branch-aware-code-search
short_description: "A vector index over code is branch-blind: it returns whatever it indexed. Branch-aware search scopes each query to one branch's live view."
description: "Branch-aware code search in Qdrant scopes each query to one Git branch, so semantic code search returns the version your branch runs, not a stale one."
preview_image: /blog/branch-aware-code-search/hero.png
social_preview_image: /blog/branch-aware-code-search/hero.png
date: 2026-06-01
author: Dylan Couzon
featured: true
tags:
  - branch-aware-search
  - code-search
  - vector-search
  - rag
  - ai-agents
---

Most code search is lexical. You grep a string or jump to a definition, and because it runs on your checkout, it always reflects the branch you have open. Semantic code search goes further: you index the codebase as vectors and search by meaning, which is how you hand an AI agent the right context in one lookup instead of a long grep loop. But it brings a problem grep never has.

A vector index is built once, detached from any checkout. It doesn't know which branch you're on, so it answers from whatever it indexed. Build it from `main`, and a query from a month-old feature branch still gets `main`'s version of a function that branch already rewrote. The result looks right, but it's the wrong version: a function signature the reader's branch doesn't have. A coding agent will reference it as if it were current.

Branch-aware search scopes each query to one branch's live view: its own commits, plus what it inherited from its ancestors, minus anything a later commit replaced. The same idea fits anything kept in a Git tree, whether docs, configuration, schemas, or code. The [Branch-Aware Search tutorial](/documentation/tutorials-search-engineering/branch-aware-search/) covers the implementation. This post covers the decisions behind it: what to index, how to track a chunk across versions, and how to keep the index in sync with Git.

## The Wrong-Version Problem

Here is a real change from Qdrant's own Rust codebase. The function `optimizer_thresholds` gained an argument in [one commit](https://github.com/qdrant/qdrant/pull/8329), so the same function resolves differently depending on the branch.

![Branch-aware code search: three Git branches resolve the same function to different versions](/blog/branch-aware-code-search/divergence.png)

On `main`, it carries the new argument. On `release/v1.15`, cut before that change, it never did. A feature branch that forked before the change and edited the function would carry a third version, like the one the diagram sketches. An agent on the release branch needs the shorter call, but a vector index built from `main` returns the longer one. One function, several branches, several answers, and a plain index can't tell them apart.

## Choosing What to Index

The first decision is the chunk: what becomes one point. Two ideas carry most of the way.

**Chunk by structure, not by size.** Whole-file vectors blur many functions together and re-version the whole file on any edit. Fixed-size windows cut functions in half. Splitting along the code's structure with a parser like tree-sitter avoids both, and it measurably helps retrieval (see [cAST](https://arxiv.org/abs/2506.15655)). A codebase is more than functions, so the unit is any named declaration: methods, classes, structs, enums, constants, and the rest, with non-code like config or docs split by their own sections. Qdrant's [code-search tutorial](/documentation/tutorials-develop/code-search/) walks through it.

**For branch-aware search, identity decides.** Branch-aware search tracks each version by identity, so the chunk needs a stable one. A named declaration has it: a path plus symbol you can follow across commits. A sliding window doesn't, so named units are the better choice here.

## Tracking a Function Across Versions

Branch-aware search tracks each chunk's versions: which branch wrote it, and which later commit replaced it. That needs a stable identity across versions. For a file, the identity is its path. For a function, it is the path plus the qualified symbol name, like `optimizers_builder.rs::optimizer_thresholds`.

Three cases make that identity harder than it looks.

**Overloads and repeated names.** The same bare name often maps to several distinct declarations: methods overloaded by signature, or methods that share a name across different types. Path plus bare name isn't unique. Use a fully qualified symbol identity from a parser or language server (namespace or type, plus signature), not the name alone.

**Moves.** A function that moves to another file changes its path, so a path-based identity treats it as new and loses its history. If lineage matters, resolve identity by content similarity, the way Git detects moves, rather than by path alone.

**Renames.** A rename looks like a delete plus an add. You either accept that, which is the simplest option, or you detect it by similarity and carry the version history across.

This is the same problem Git itself only solves with heuristics. The honest approach is to pick a stable identity, decide how far you will chase renames and moves, and document where the line sits.

## Keeping the Index in Sync with Git

Qdrant holds a derived index; Git is the source of truth. You build the collection by replaying branch history, ideally from a branch event log rather than the raw commit graph. Deriving each point's ID from its branch, commit, and chunk identity makes that replay idempotent: as long as commit identity holds, a rebuild overwrites cleanly instead of duplicating. Rebases and force-pushes break that, since they rewrite commit identity: delete the affected branch's points before replaying, or stale versions linger. Merges and concurrent writers are each their own decision; the tutorial scopes them out to keep the core mechanic clear.

Two things scale differently as the repo grows. Storage grows with edits: every superseded version stays as a point, so a long-lived branch accumulates history. Pruning is branch-aware, though: a version one branch replaced may still be live for a branch that forked earlier, so only drop versions no active branch can see. The filter, by contrast, stays small: its size tracks a branch's lineage depth, not the indexed corpus, so even a deep history produces a compact filter.

## Seeing It Work

Each version becomes one point with a small payload: the branch that wrote it, a per-branch commit number, and a record of which later commit replaced it. A single payload filter walks the branch's ancestry, keeps the versions in its live view, and drops anything superseded. The semantic query rides on top: a metadata filter and a vector query combined at query time, which is what composable retrieval means in practice.

To see it in action, we indexed 141 functions from Qdrant's own `lib/collection` source into a local Qdrant instance, one point per function. Every point carries that payload: its branch, commit number, and overwrite record.

![The indexed collection in the Qdrant Web UI: per-function points carrying branch, seq, and overwritten_in payloads](/blog/branch-aware-code-search/collection.png)

The same query, scoped to each branch, returns that branch's version:

```text
Query: "how are segment optimizer thresholds for indexing and memmap computed"

main     ->  optimizer_thresholds(&self, num_indexing_threads, deferred_internal_id)
release  ->  optimizer_thresholds(&self, num_indexing_threads)
```

One query, one collection, two branches, each result scoped to the version that branch runs. Matching an English question to code is the embedding's job, not the filter's: a general-purpose model worked here because the query shares vocabulary with the function, but for natural-language code search in general, use a code embedding model or enrich each chunk with its symbol name and signature.

## Build It

The [Branch-Aware Search tutorial](/documentation/tutorials-search-engineering/branch-aware-search/) walks through the full implementation step by step, from a single file to a multi-branch collection with the visibility filter that scopes every query. It builds the example on a small documentation corpus, where the mechanics are easiest to follow, but the same filter applies unchanged to code. New to semantic code search? Start with [Semantic Search for Code](/documentation/tutorials-develop/code-search/), then layer branch-awareness on top.

You can run the whole pattern on a free [Qdrant Cloud](https://cloud.qdrant.io/signup) cluster, scoping every query to the exact version a branch sees.
