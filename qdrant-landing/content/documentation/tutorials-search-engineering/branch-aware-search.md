---
title: Branch-Aware Search
short_description: "Scope search to a version-controlled branch in Qdrant so a query returns that branch's live view, inherited from its ancestors."
description: "Index a versioned document corpus in Qdrant and scope each query to one branch's live view by walking its lineage with a payload filter."
weight: 12
aliases:
  - /documentation/tutorials/branch-aware-search/
---

# Branch-Aware Search Over Versioned Documents

| Time: 25 min | Level: Intermediate |
| --- | ----------- |

When a document corpus is versioned with git-style branches, an ordinary search leaks across them, returning content from another branch or a version the current branch already replaced. This tutorial indexes such a corpus in Qdrant and scopes each query to a single branch's live view: its own commits plus what it inherited from its ancestors, and nothing a later commit replaced. The pattern fits a documentation site with draft and published branches, a policy repository with regional forks, or a codebase where each feature branch needs its own view.

## Setup

Each version of a file is one point, embedded with a dense model for semantic search. The [Cloud Quickstart](/documentation/cloud-quickstart/) covers creating a cluster and connecting a client.

<aside role="status">
This tutorial uses <a href="/documentation/inference/#qdrant-cloud-inference">Qdrant Cloud Inference</a> to generate embeddings server-side. The free tier covers this tutorial's footprint. To self-host, generate dense vectors on the client with a library like <a href="/documentation/fastembed/">FastEmbed</a> and pass them as raw vectors instead of <code>models.Document</code>.
</aside>

```python
from qdrant_client import QdrantClient, models

MODEL = "sentence-transformers/all-MiniLM-L6-v2"  # 384-dim dense vectors, free on Cloud Inference

# Replace url and api_key with your own from https://cloud.qdrant.io
client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.create_collection(
    collection_name="content",
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
)
```

Every point also gets a derived ID, so replaying the same history produces the same IDs and a rebuild can `upsert` without duplicating points:

```python
import uuid

NS = uuid.UUID("00000000-0000-0000-0000-000000000042")

def point_id(branch: str, seq: int, path: str) -> str:
    return str(uuid.uuid5(NS, f"{branch}|{seq}|{path}"))
```

<aside role="status">
Each step creates a payload index at the point that first needs it, so you can see why each one exists. In production, create every index before loading data and you avoid the extra indexing pass.
</aside>

## Step 1: Add a File

Start with a single `root` branch and one commit that adds a file.

```text
root  ●            seq 0: add pricing.md
```

A commit is numbered with a per-branch `seq` (`0`, `1`, `2`, ...). Each file it writes becomes a point tagged with the `branch` that wrote it, the `seq`, and the file `path`. To find a file on a branch later, we filter on `path` and `branch`, so both need a payload index:

```python
client.create_payload_index(collection_name="content", field_name="path", field_schema=models.PayloadSchemaType.KEYWORD)
client.create_payload_index(collection_name="content", field_name="branch", field_schema=models.PayloadSchemaType.KEYWORD)
```

The write itself embeds the content and stores the three fields, plus an empty `overwritten_in` list we'll use shortly:

```python
def update(file_name, branch, seq, content):
    client.upsert(collection_name="content", points=[models.PointStruct(
        id=point_id(branch, seq, file_name),
        vector=models.Document(text=content, model=MODEL),
        payload={"path": file_name, "content": content, "branch": branch, "seq": seq, "overwritten_in": []},
    )])
```

Commit `seq 0` on `root`, which writes three files:

```python
update("pricing.md", "root", seq=0, content="The Pro tier costs $29 per month with 100 GB of storage.")
update("notes.md",   "root", seq=0, content="Internal launch notes. Remove before the public release.")
update("terms.md",   "root", seq=0, content="Standard terms of service apply to all plans.")
```

Reading a file back on a branch is a filter on `path` and `branch`. Use `scroll`, which returns points matching a filter:

```python
def lookup(file_name, branch):
    points, _ = client.scroll(
        collection_name="content",
        scroll_filter=models.Filter(must=[
            models.FieldCondition(key="path", match=models.MatchValue(value=file_name)),
            models.FieldCondition(key="branch", match=models.MatchValue(value=branch)),
        ]),
        limit=1, with_payload=True,
    )
    return points[0] if points else None
```

```python
lookup("pricing.md", "root").payload["content"]
# The Pro tier costs $29 per month with 100 GB of storage.
```

## Step 2: Update a File

A second commit changes a file that already exists.

```text
root  ●───────●        seq 1: update pricing.md
      seq 0   seq 1
```

The old point stays in the collection. We mark it superseded so a later read skips it: `overwritten_in` is a list of `{by, seq}` records, each meaning "replaced in branch `by` at that branch's commit `seq`." A write now first marks the version this branch currently sees, then upserts the new one:

```python
def supersede(point, by, seq):
    marks = point.payload["overwritten_in"] + [{"by": by, "seq": seq}]
    client.set_payload(collection_name="content", payload={"overwritten_in": marks}, points=[point.id])

def update(file_name, branch, seq, content):
    prev = lookup(file_name, branch)
    if prev:
        supersede(prev, by=branch, seq=seq)
    client.upsert(collection_name="content", points=[models.PointStruct(
        id=point_id(branch, seq, file_name),
        vector=models.Document(text=content, model=MODEL),
        payload={"path": file_name, "content": content, "branch": branch, "seq": seq, "overwritten_in": []},
    )])
```

To skip the superseded point, the read excludes any version this branch marked. That's the first index on `overwritten_in`, on the branch that did the replacing:

```python
client.create_payload_index(collection_name="content", field_name="overwritten_in.by", field_schema=models.PayloadSchemaType.KEYWORD)
```

`lookup` now adds a `must_not` that drops anything carrying this branch's mark:

```python
def visibility_filter(branch, path=None):
    must = [models.FieldCondition(key="branch", match=models.MatchValue(value=branch))]
    if path:
        must.append(models.FieldCondition(key="path", match=models.MatchValue(value=path)))
    excluded = models.NestedCondition(nested=models.Nested(
        key="overwritten_in",
        filter=models.Filter(must=[models.FieldCondition(key="by", match=models.MatchValue(value=branch))]),
    ))
    return models.Filter(must=must, must_not=[excluded])

def lookup(file_name, branch):
    points, _ = client.scroll(
        collection_name="content",
        scroll_filter=visibility_filter(branch, path=file_name),
        limit=1, with_payload=True,
    )
    return points[0] if points else None
```

Every point still records its `seq`; the filter only uses it once branches appear.

```python
update("pricing.md", "root", seq=1, content="The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.")

lookup("pricing.md", "root").payload["content"]
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
```

## Step 3: Delete a File

A delete is a commit too, so it carries a `seq` like any other. It writes the same supersession mark as an overwrite, with no replacement point behind it:

```text
root  ●───────●───────●    seq 2: delete notes.md
      seq 0   seq 1   seq 2
```

```python
def delete(file_name, branch, seq):
    supersede(lookup(file_name, branch), by=branch, seq=seq)  # mark, no replacement point
```

```python
delete("notes.md", "root", seq=2)

lookup("notes.md", "root")
# None
```

The point is still stored, but `notes.md` no longer resolves on `root`. That recorded `seq` is what will let a branch that forked before the delete keep the file.

## Step 4: Branch Off the Root

A fork records where it started, the parent and the parent's latest `seq`, and writes no points. Its view begins as whatever the parent has at that `seq`.

```text
root  ●──●──●            seq 0–2
            └── A ●      A forks at root seq 2; A seq 0: add roadmap.md
```

Lineage is the only durable state, and it mirrors what your version control already tracks. Store it however you like; here it's one record per branch:

```python
branches = {"root": None}  # branch -> (parent, fork_seq), or None for the root

def fork(child, parent, at_seq):
    branches[child] = (parent, at_seq)
```

A read on a branch now considers that branch and every ancestor up to its fork point. Walk the lineage, then build one candidate clause and one exclusion clause per branch on the path. The candidates (a `should`, so any one can match) gather each branch's versions; the exclusions (a `must_not`) drop anything those branches superseded:

```python
def ancestry(branch):
    yield branch
    node = branches[branch]
    while node is not None:
        parent, _ = node
        yield parent
        node = branches[parent]

def visibility_filter(branch, path=None):
    must = [models.FieldCondition(key="path", match=models.MatchValue(value=path))] if path else []
    should, must_not = [], []
    for b in ancestry(branch):
        should.append(models.Filter(must=[models.FieldCondition(key="branch", match=models.MatchValue(value=b))]))
        must_not.append(models.NestedCondition(nested=models.Nested(
            key="overwritten_in",
            filter=models.Filter(must=[models.FieldCondition(key="by", match=models.MatchValue(value=b))]),
        )))
    return models.Filter(must=must, should=should, must_not=must_not)
```

Fork `A` and add a file that only `A` has:

```python
fork("A", "root", at_seq=2)
update("roadmap.md", "A", seq=0, content="Draft roadmap for the next two quarters. Not for publication.")

lookup("roadmap.md", "A").payload["content"]   # A's own file
# Draft roadmap for the next two quarters. Not for publication.
lookup("roadmap.md", "root")                   # root never sees it
# None
lookup("pricing.md", "A").payload["content"]   # inherited from root
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
```

## Step 5: Change an Inherited File on the Branch

`A` edits `pricing.md`, a file it inherited from `root`.

```text
root  ●──●──●            seq 0–2
            └── A ●──●   A seq 1: update pricing.md
```

Nothing new is needed. `update` looks up the version `A` currently sees, which is `root`'s, and marks it, this time with `by: A`:

```python
update("pricing.md", "A", seq=1, content="The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.")
```

The mark `{by: A, seq: 1}` lands on `root`'s `pricing.md` point. Because the exclusion matches on `by`, it removes that version for `A` but not for `root`, whose filter only drops versions marked `by: root`. The same file now resolves differently on each branch:

```python
lookup("pricing.md", "A").payload["content"]
# The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.
lookup("pricing.md", "root").payload["content"]
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
```

## Step 6: Commit on the Root After the Fork

`root` keeps moving after `A` forked off. It updates `terms.md`, a file `A` inherited but never touched.

```text
root  ●──●──●──────●    root seq 3: update terms.md
            └── A ●──●  A forked at seq 2, so it should not see seq 3
```

```python
update("terms.md", "root", seq=3, content="Updated terms of service, effective Q3, with the new data-retention clause.")
```

`A` forked at `root` `seq 2`, so it should not see anything `root` committed later, including this `seq 3` edit. The bound is the `seq` we've recorded all along: each ancestor counts only up to the `seq` where this branch forked from it. <br>The cutoff applies on both sides of the filter: the candidate clause includes an ancestor's versions only up to the fork `seq`, and the exclusion clause honors only the marks it stamped by then, so a later change can neither appear nor hide the version `A` kept.

That cutoff is a range on `seq`, on both the points and the marks, so both fields need an index:

```python
client.create_payload_index(collection_name="content", field_name="seq", field_schema=models.PayloadSchemaType.INTEGER)
client.create_payload_index(collection_name="content", field_name="overwritten_in.seq", field_schema=models.PayloadSchemaType.INTEGER)
```

The walk now carries each branch's cutoff: the branch itself has none (all its own commits count), and each ancestor is bound to its fork `seq`. This is the final form of the filter:

```python
def ancestry(branch):
    yield (branch, None)  # the branch itself: no upper bound on its own commits
    node = branches[branch]
    while node is not None:
        parent, fork_seq = node
        yield (parent, fork_seq)
        node = branches[parent]

def visibility_filter(branch, path=None):
    must = [models.FieldCondition(key="path", match=models.MatchValue(value=path))] if path else []
    should, must_not = [], []
    for b, cut in ancestry(branch):
        candidate = [models.FieldCondition(key="branch", match=models.MatchValue(value=b))]
        excluded = [models.FieldCondition(key="by", match=models.MatchValue(value=b))]
        if cut is not None:  # an ancestor: only up to the fork point
            candidate.append(models.FieldCondition(key="seq", range=models.Range(lte=cut)))
            excluded.append(models.FieldCondition(key="seq", range=models.Range(lte=cut)))
        should.append(models.Filter(must=candidate))
        must_not.append(models.NestedCondition(nested=models.Nested(
            key="overwritten_in", filter=models.Filter(must=excluded))))
    return models.Filter(must=must, should=should, must_not=must_not)
```

The candidate clause stops including `root`'s versions past `seq 2`, and the exclusion ignores marks stamped after `seq 2`. `A` keeps the `terms.md` it forked from; `root` sees the new one:

```python
lookup("terms.md", "A").payload["content"]
# Standard terms of service apply to all plans.
lookup("terms.md", "root").payload["content"]
# Updated terms of service, effective Q3, with the new data-retention clause.
```

## Step 7: A Second Branch, Same File

Fork `B` off `root` and have it overwrite `pricing.md`, the same file `A` already changed.

```text
root  ●──●──●──────●         root seq 0–3
            ├── A ●──●       A: pricing.md with SSO
            └── B ●          B forks at root seq 3; B seq 0: update pricing.md
```

```python
fork("B", "root", at_seq=3)
update("pricing.md", "B", seq=0, content="The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR.")
```

`root`'s `pricing.md` point now carries two marks, `{by: A, seq: 1}` and `{by: B, seq: 0}`. Each branch's exclusion matches only its own `by` on a single record, so the three branches resolve the same path three ways, with no leakage between the two forks:

```python
for branch in ["root", "A", "B"]:
    print(branch, "→", lookup("pricing.md", branch).payload["content"])
# root → The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
# A    → The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.
# B    → The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR.
```

## Searching a Branch

`lookup` resolves one known path; a search ranks the whole corpus by relevance. It's the same visibility filter, passed to a semantic query instead of a path scroll:

```python
def search(query, branch, limit=5):
    return client.query_points(
        collection_name="content",
        query=models.Document(text=query, model=MODEL),
        query_filter=visibility_filter(branch),
        limit=limit, with_payload=True,
    ).points
```

The same query, scoped to each branch, returns that branch's live version of the page:

```python
for branch in ["root", "A", "B"]:
    print(branch, "→", search("how much does the pro plan cost", branch, limit=1)[0].payload["content"])
# root → The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
# A    → The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.
# B    → The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR.
```

## Scaling to Production

- **The filter grows with lineage depth, not corpus size.** Each query walks the lineage once, adding one candidate clause and one exclusion clause per ancestor. The filter's size tracks how deep a branch sits, not how many files or versions the collection holds.

- **Qdrant is a derived index.** Branch lineage and history live in version control. Build the collection by replaying that history, and if the index ever drifts, rebuild it. The derived point IDs make a full replay idempotent: the same commit writes the same point, so `upsert` overwrites cleanly.

- **Storage grows with edits.** Every overwrite keeps the old version as a point, so long-lived branches accumulate versions. Reclaiming superseded versions is a production concern.

- **Out of scope.** Three-way merges, force-push, and concurrent writers on a branch are each their own design decision and are not needed to show the core mechanic.

## Related Reading

- [Filtering](/documentation/search/filtering/) for the full set of filter clauses, including the [nested object filter](/documentation/search/filtering/#nested-object-filter) that binds `by` and `seq` on the same record.
- [Payload Indexing](/documentation/manage-data/indexing/#payload-index) for the index types the visibility fields use.
- [Qdrant Cloud Inference](/documentation/inference/#qdrant-cloud-inference) for generating the dense embeddings server-side.
