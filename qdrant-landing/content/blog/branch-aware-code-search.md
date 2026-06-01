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

Most code search is lexical. You grep a string or jump to a definition, and because it runs on your checkout, it's always on the branch you have open. Some teams go further and index their code as vectors, to search by meaning and to hand an AI agent context in one lookup instead of a long grep loop. Whether that beats a lexical loop depends on the codebase and the agent, but it brings a problem grep never has.

A vector index is built once, detached from any checkout. It doesn't know which branch you're on, so it answers from whatever it indexed. Build it from `main`, and a query from a month-old feature branch still gets `main`'s version of a function that branch already rewrote. The agent writes a call against a signature that doesn't exist on its branch, and the build fails.

Branch-aware search scopes each query to one branch's live view: its own commits, plus what it inherited, minus anything a later commit replaced. The same idea fits anything kept in a Git tree, whether docs, configuration, schemas, or code. The [Branch-Aware Search tutorial](/documentation/tutorials-search-engineering/branch-aware-search/) covers the implementation. This post covers the decisions behind it: what to index, how to track a chunk across versions, and how to keep the index in sync with Git.

## The Wrong-Version Problem

Here is a real change from Qdrant's own Rust codebase. The function `optimizer_thresholds` gained an argument in [one commit](https://github.com/qdrant/qdrant/pull/8329), so the same function now resolves differently depending on the branch:

![Branch-aware code search: three Git branches resolve the same function to different versions](/blog/branch-aware-code-search/divergence.png)

On `main`, it carries `deferred_internal_id`. On `release/v1.15`, cut before that change, it never did. A feature branch that forked before the change and edited the function itself would carry a third version, like the one the diagram sketches. An agent on the release branch needs the shorter call, but a vector index built from `main` returns the longer one, which won't compile there. One function, several branches, several answers, and a plain index can't tell them apart.

## Choosing What to Index

The first decision is the chunk: what becomes one point. Two ideas carry most of the way.

**Chunk by structure, not by size.** Whole-file vectors blur many functions together and re-version the whole file on any edit; fixed-size windows cut functions in half. Splitting along the code's structure, with a parser like tree-sitter, avoids both and measurably helps retrieval (see [cAST](https://arxiv.org/abs/2506.15655)). A codebase is more than functions, so the unit is any named declaration: methods, classes, structs, enums, constants, and the rest, with non-code like config or docs split by their own sections. Qdrant's [code-search tutorial](/documentation/tutorials-develop/code-search/) walks through it.

**For branch-aware search, identity decides.** The best granularity for pure retrieval is still debated ([a JetBrains study](https://arxiv.org/abs/2510.20609) finds a tuned line splitter competitive), but branch-aware search adds its own rule: it tracks versions by identity. A named declaration has a stable one, its path plus symbol, that you can follow across commits. A sliding window doesn't, so named units are usually the preferred choice here.

## Matching Questions to Code

One heads-up before you build. A function's body is code, but most queries are written in English, and a general-purpose text model only matches them when the query happens to share vocabulary with the code. For natural-language questions, reach for a code embedding model (trained on description-and-code pairs), or enrich each chunk with its symbol name, signature, and docstring. Branch-aware search is unaffected either way: it filters whatever vectors you produce.

## Tracking a Function Across Versions

Branch-aware search works by tracking each chunk's versions: which branch wrote it, and which later commit replaced it. That needs a stable identity across versions. For a file, the identity is its path. For a function, it is the path plus the qualified symbol name, like `optimizers_builder.rs::optimizer_thresholds`.

Three cases make that identity harder than it looks:

- **Overloads and repeated names.** Rust has methods that share a name across different `impl` blocks, and other languages allow overloads. Path plus bare name isn't unique. Use a fully qualified symbol identity from a parser or language server (type, trait, and signature), not the name alone.
- **Moves.** A function that moves to another file changes its path, so a path-based identity treats it as new and loses its history. If lineage matters, resolve identity by content similarity, the way Git detects moves, rather than by path alone.
- **Renames.** A rename looks like a delete plus an add. You either accept that, which is the simplest option, or you detect it by similarity and carry the version history across.

This is the same problem Git itself only solves with heuristics. The honest approach is to pick a stable identity, decide how far you will chase renames and moves, and document where the line sits.

## Keeping the Index in Sync

Qdrant holds a derived index. The source of truth is Git, so you build the collection by replaying branch history, and you can always rebuild it. Derive each point's ID from its branch, commit, and full chunk identity (for a function, the path plus its qualified symbol), and a replay is idempotent: the same commit writes the same point, so a rebuild overwrites cleanly instead of duplicating.

A clean, linear history maps to this directly. Three Git operations reshape lineage, and each is its own decision:

- **Merges.** A merge commit has two parents, and its resolved content can match neither of them. Index the merge as its own set of changes, or rebuild the branch after it, instead of assuming one side wins.
- **Rebases and force-push.** These rewrite commit identity, so any point ID derived from the old commits is now stale. Rebuild the affected branch from scratch: delete its existing points, then replay the new history, so the old versions don't linger.
- **Concurrent writers on one branch.** Two writers racing on the same branch need an order, like any write path. Serialize a branch's commits before you index them.

A practical pattern is to drive the index from a branch event log (commit added, file changed, branch forked) rather than from the raw commit graph. The log is easy to replay and easy to reason about.

Plan for one cost: storage grows with edits. Every superseded version stays as a point, so a long-lived branch accumulates history. Decide a retention policy early. Keep everything if you want to search old versions, or prune superseded points to reclaim memory.

One thing that doesn't grow with the codebase is the filter. It tracks the branch's ancestry, not the corpus. Each query adds a clause per ancestor, so even a branch with a long, merge-heavy history produces a filter bounded by its lineage, not by the millions of functions you indexed.

## Seeing It Work

Each version is a point with a small payload: the branch that wrote it, a per-branch commit number, and a record of which branch and commit replaced it. One payload filter walks the branch's ancestry, keeps the versions in its live view, and drops anything superseded. The semantic query rides on top. This isn't a second engine or a second pass. It's a metadata filter and a vector query, combined at query time, which is what composable retrieval means in practice.

To try it, we indexed 141 functions from Qdrant's own `lib/collection` source into a local Qdrant, one point per function. Every point carries that payload: its branch, commit number, and overwrite record.

![The indexed collection in the Qdrant Web UI: per-function points carrying branch, seq, and overwritten_in payloads](/blog/branch-aware-code-search/collection.png)

A single query, scoped to each branch, returns that branch's version:

```text
Query: "how are segment optimizer thresholds for indexing and memmap computed"

main      ->  optimizer_thresholds(&self, num_indexing_threads, deferred_internal_id)
release   ->  optimizer_thresholds(&self, num_indexing_threads)
```

One query. One collection. Two branches. Two correct answers. The embeddings here come from a general-purpose model, which lands because the query shares vocabulary with the function.

## Build It

The [Branch-Aware Search tutorial](/documentation/tutorials-search-engineering/branch-aware-search/) has the full implementation, step by step. New to semantic code search? Start with [Semantic Search for Code](/documentation/tutorials-develop/code-search/).
