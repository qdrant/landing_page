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
from typing import List, Tuple

# 384-dim dense vectors, free on Cloud Inference
MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Replace url and api_key with your own from https://cloud.qdrant.io
client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.create_collection(
    collection_name="content",
    vectors_config=models.VectorParams(
        size=384, distance=models.Distance.COSINE),
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
client.create_payload_index(
    collection_name="content", field_name="path",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
client.create_payload_index(
    collection_name="content", field_name="branch",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

The write embeds the content and stores the three fields:

```python
def update(file_name, branch, seq, content):
    client.upsert(collection_name="content", points=[models.PointStruct(
        id=point_id(branch, seq, file_name),
        vector=models.Document(text=content, model=MODEL),
        payload={"path": file_name, "content": content,
                 "branch": branch, "seq": seq},
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
            models.FieldCondition(
                key="path", match=models.MatchValue(value=file_name)),
            models.FieldCondition(
                key="branch", match=models.MatchValue(value=branch)),
        ]),
        limit=1, with_payload=True,
    )
    return points[0] if points else None

lookup("pricing.md", "root").payload["content"]
# The Pro tier costs $29 per month with 100 GB of storage.
```

Storage state:

```javascript
{ path: 'pricing.md', branch: root, seq: 0 }
{ path: 'notes.md',   branch: root, seq: 0 }
{ path: 'terms.md',   branch: root, seq: 0 }
```

## Step 2: Update a File

A second commit changes a file that already exists.

```text
root  ●───────●        seq 1: update pricing.md
      seq 0   seq 1
```

The old point stays in the collection. We tag it as superseded so a later read skips it, with an `overwritten_in` entry: a `{by, seq}` record naming the branch that replaced it and the commit that did so. A write now tags the version this branch currently sees, then upserts the new one with an empty `overwritten_in`:

```python
def supersede(point, by, seq):
    marks = point.payload.get("overwritten_in", []) + [{"by": by, "seq": seq}]
    client.set_payload(
        collection_name="content",
        payload={"overwritten_in": marks},
        points=[point.id],
    )

def update(file_name, branch, seq, content):
    prev = lookup(file_name, branch)
    if prev:
        supersede(prev, by=branch, seq=seq)
    client.upsert(collection_name="content", points=[models.PointStruct(
        id=point_id(branch, seq, file_name),
        vector=models.Document(text=content, model=MODEL),
        payload={"path": file_name, "content": content, "branch": branch,
                 "seq": seq, "overwritten_in": []},
    )])
```

To skip a superseded version, the read drops anything this branch marked. That filters on `by` inside the `overwritten_in` array, so it needs an index on that nested field, written with `[]`:

```python
client.create_payload_index(
    collection_name="content", field_name="overwritten_in[].by",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
```

`lookup` now adds a `must_not` with a [nested filter](/documentation/search/filtering/#nested-object-filter) that drops any version carrying this branch's mark:

```python
def visibility_filter(branch, path=None):
    """
    Returns a filter matching a branch's view of one
    file (or of every file, when path is None).

    Simplified example of the result:

    filter: {
        must = [
            branch == "root",
            path == "pricing.md"
        ]
        must_not = [
            { "nested": overwritten_in { by == "root" } }
        ]
    }
    """
    ...
```

<details>

<summary>Full filter code</summary>

```python
def visibility_filter(branch, path=None):

    # Match the requested branch (and file, if given)
    must = [
        models.FieldCondition(
            key="branch",
            match=models.MatchValue(value=branch)
        )
    ]

    if path:
        must.append(
            models.FieldCondition(
                key="path",
                match=models.MatchValue(value=path)
            )
        )

    # Drop versions this branch already replaced
    must_not = [
        models.NestedCondition(
            nested=models.Nested(
                key="overwritten_in",
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="by",
                            match=models.MatchValue(value=branch)
                        )
                    ]
                )
            )
        )
    ]

    return models.Filter(must=must, must_not=must_not)
```

</details>

`lookup` passes that filter to a scroll:

```python
def lookup(file_name, branch):
    points, _ = client.scroll(
        collection_name="content",
        scroll_filter=visibility_filter(branch, path=file_name),
        limit=1, with_payload=True,
    )
    return points[0] if points else None
```

`by` is always `root` for now; it starts telling branches apart once we fork. The commit:

```python
update("pricing.md", "root", seq=1, content="The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.")

lookup("pricing.md", "root").payload["content"]
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
```

Both versions are still stored. The old one now carries the mark; the new one is clean:

```javascript
{ path: 'pricing.md', branch: root, seq: 0, overwritten_in: [{by: root, seq: 1}] }
{ path: 'pricing.md', branch: root, seq: 1, overwritten_in: [] }
```

## Step 3: Delete a File

A delete is a commit too, so it carries a `seq` like any other.

```text
root  ●───────●───────●    seq 2: delete notes.md
      seq 0   seq 1   seq 2
```

It writes the same mark as an overwrite, with no replacement point behind it:

```python
def delete(file_name, branch, seq):
    supersede(lookup(file_name, branch), by=branch, seq=seq)  # no new point

delete("notes.md", "root", seq=2)

lookup("notes.md", "root")
# None
```

The point is still stored, but `notes.md` no longer resolves on `root`. That recorded `seq` is what will let a branch that forked before the delete keep the file.

Storage state:

```javascript
{ path: 'notes.md', branch: root, seq: 0, overwritten_in: [{by: root, seq: 2}] }
```

## Step 4: Branch Off the Root

A fork records where it started: the parent and the parent's latest `seq`. It writes no points; its view begins as whatever the parent has at that `seq`.

```text
root  ●──●──●            seq 0–2
            └── A ●      A forks at root seq 2; A seq 0: add roadmap.md
```

A read on a branch now considers that branch and every ancestor up to its fork point. The branch itself is passed separately; its **ancestry** lists only the parents as `(branch, fork seq)` pairs, ordered from the nearest parent down to the root. Build it once when the branch is created and store it alongside the branch:

```python
# Parents only, each capped at the fork seq. The current branch is
# passed separately and counts all of its own commits.
# The fork seq is stored now but only starts mattering in Step 6.
root_ancestry = []                 # root has no parents
A_ancestry    = [("root", 2)]      # A forked at root seq 2
```

Now that a read spans more than one branch, factor the branch logic into its own `branch_filter`. It builds one candidate clause and one exclusion per branch: the current branch first, then every ancestor. The candidates (a `should`, so any one can match) gather each branch's versions; the exclusions (a `must_not`) drop anything that branch replaced:

```python
def branch_filter(
        branch: str,
        ancestry: List[Tuple[str, int]]
    ) -> models.Filter:
    """
    Returns a filter that matches only the files
    visible in the current branch's view.

    Ancestry is a list of (branch, fork_seq) pairs,
    ordered from the nearest parent down to the root.
    Example:
        branch = "A"
        ancestry = [("root", 2)]

    Simplified example of the result:

    filter: {
        should = [
            { "must": [ branch == "A" ] },
            { "must": [ branch == "root" ] }
        ]
        must_not = [
            { "nested": overwritten_in { by == "A" } },
            { "nested": overwritten_in { by == "root" } }
        ]
    }
    """
    ...
```

<details>

<summary>Full filter code</summary>

```python
def branch_filter(
        branch: str,
        ancestry: List[Tuple[str, int]]
    ) -> models.Filter:

    # Selector for the current branch
    should = [
        models.FieldCondition(
            key="branch",
            match=models.MatchValue(value=branch)
        )
    ]

    # Exclude files this branch overwrote or deleted
    must_not = [
        models.NestedCondition(
            nested=models.Nested(
                key="overwritten_in",
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="by",
                            match=models.MatchValue(value=branch)
                        )
                    ]
                )
            )
        )
    ]

    # One selector and one exclusion per ancestor
    for parent, _cut in ancestry:
        should.append(
            models.Filter(
                must=[
                    models.FieldCondition(
                        key="branch",
                        match=models.MatchValue(value=parent)
                    )
                ]
            )
        )

        must_not.append(
            models.NestedCondition(
                nested=models.Nested(
                    key="overwritten_in",
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="by",
                                match=models.MatchValue(value=parent)
                            )
                        ]
                    )
                )
            )
        )

    return models.Filter(should=should, must_not=must_not)
```

</details>

`visibility_filter` wraps it, adding the optional file path:

```python
def visibility_filter(branch, ancestry, path=None):
    must = []

    if path:
        must.append(
            models.FieldCondition(
                key="path",
                match=models.MatchValue(value=path)
            )
        )

    must.append(branch_filter(branch, ancestry))

    return models.Filter(must=must)
```

`lookup` and `update` now take the branch and its ancestry:

```python
def lookup(file_name, branch, ancestry):
    points, _ = client.scroll(
        collection_name="content",
        scroll_filter=visibility_filter(branch, ancestry, path=file_name),
        limit=1, with_payload=True,
    )
    return points[0] if points else None

def update(file_name, branch, seq, content, ancestry):
    prev = lookup(file_name, branch, ancestry)
    if prev:
        supersede(prev, by=branch, seq=seq)
    client.upsert(collection_name="content", points=[models.PointStruct(
        id=point_id(branch, seq, file_name),
        vector=models.Document(text=content, model=MODEL),
        payload={"path": file_name, "content": content, "branch": branch,
                 "seq": seq, "overwritten_in": []},
    )])
```

Fork `A` and add a file only `A` has:

```python
update("roadmap.md", "A", seq=0, content="Draft roadmap for the next two quarters. Not for publication.", ancestry=A_ancestry)

lookup("roadmap.md", "A", A_ancestry).payload["content"]   # A's own file
# Draft roadmap for the next two quarters. Not for publication.
lookup("roadmap.md", "root", root_ancestry)                # root never sees it
# None
lookup("pricing.md", "A", A_ancestry).payload["content"]   # inherited from root
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
```

Storage state:

```javascript
{ path: 'roadmap.md', branch: A, seq: 0, overwritten_in: [] }
```

## Step 5: Change an Inherited File on the Branch

`A` edits `pricing.md`, a file it inherited from `root`.

```text
root  ●──●──●            seq 0–2
            └── A ●──●   A seq 1: update pricing.md
```

Nothing new is needed. `update` looks up the version `A` currently sees, which is `root`'s, and marks it, this time with `by: A`:

```python
update("pricing.md", "A", seq=1, content="The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.", ancestry=A_ancestry)
```

The mark `{by: A, seq: 1}` lands on `root`'s `pricing.md` point. `A`'s exclusion drops it (it matches `by: A`), while `root`'s exclusion only drops marks with `by: root`, so `root` keeps its version. The same file now resolves differently on each branch:

```python
lookup("pricing.md", "A", A_ancestry).payload["content"]
# The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.
lookup("pricing.md", "root", root_ancestry).payload["content"]
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
```

Storage state:

```javascript
{ path: 'pricing.md', branch: root, seq: 0, overwritten_in: [{by: root, seq: 1}] }
{ path: 'pricing.md', branch: root, seq: 1, overwritten_in: [{by: A, seq: 1}] }
{ path: 'pricing.md', branch: A,    seq: 1, overwritten_in: [] }
```

## Step 6: Commit on the Root After the Fork

`root` keeps moving after `A` forked off. It updates `terms.md`, a file `A` inherited but never touched.

```text
root  ●──●──●──────●    root seq 3: update terms.md
            └── A ●──●  A forked at seq 2, so it should not see seq 3
```

`root` commits the edit at `seq 3`:

```python
update("terms.md", "root", seq=3, content="Updated terms of service, effective Q3, with the new data-retention clause.", ancestry=root_ancestry)
```

`A` forked at `root` `seq 2`, so it should not see anything `root` committed later, including this `seq 3` edit. This is where the fork `seq` in the ancestry earns its place: each ancestor counts only up to it. <br>The cutoff is a range on `seq`, applied to the points and to the marks: on the candidate side so `A` stops seeing `root`'s later versions, and on the exclusion side so a mark `root` added after the fork can't hide a version `A` kept. Both fields need an index:

```python
client.create_payload_index(
    collection_name="content", field_name="seq",
    field_schema=models.PayloadSchemaType.INTEGER,
)
client.create_payload_index(
    collection_name="content", field_name="overwritten_in[].seq",
    field_schema=models.PayloadSchemaType.INTEGER,
)
```

`branch_filter` now reads the cutoff: the branch itself has none (all its own commits count), and each ancestor is bound to its fork `seq`.
This is the final form:

```python
def branch_filter(
        branch: str,
        ancestry: List[Tuple[str, int]]
    ) -> models.Filter:
    """
    Returns a filter that matches only the files
    visible in the current branch's view.

    Ancestry is a list of (branch, fork_seq) pairs,
    ordered from the nearest parent down to the root.
    Each ancestor now counts only up to its fork seq.
    Example:
        branch = "A"
        ancestry = [("root", 2)]

    Simplified example of the result:

    filter: {
        should = [
            { "must": [ branch == "A" ] },
            { "must": [ branch == "root", seq <= 2 ] }
        ]
        must_not = [
            { "nested": overwritten_in { by == "A" } },
            { "nested": overwritten_in { by == "root", seq <= 2 } }
        ]
    }
    """
    ...

```

<details>

<summary>Full filter code</summary>

```python
def branch_filter(
        branch: str,
        ancestry: List[Tuple[str, int]]
    ) -> models.Filter:

    # Selector for the current branch
    should = [
        models.FieldCondition(
            key="branch",
            match=models.MatchValue(value=branch)
        )
    ]

    # Exclude files this branch overwrote or deleted
    must_not = [
        models.NestedCondition(
            nested=models.Nested(
                key="overwritten_in",
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="by",
                            match=models.MatchValue(value=branch)
                        )
                    ]
                )
            )
        )
    ]

    # One selector and one exclusion per ancestor,
    # each capped at the fork seq
    for parent, cut in ancestry:
        branch_selector = models.Filter(
            must=[
                models.FieldCondition(
                    key="branch",
                    match=models.MatchValue(value=parent)
                ),
                models.FieldCondition(
                    key="seq",
                    range=models.Range(lte=cut)
                )
            ]
        )
        should.append(branch_selector)

        overwrite_exclusion = models.NestedCondition(
            nested=models.Nested(
                key="overwritten_in",
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="by",
                            match=models.MatchValue(value=parent)
                        ),
                        models.FieldCondition(
                            key="seq",
                            range=models.Range(lte=cut)
                        )
                    ]
                )
            )
        )
        must_not.append(overwrite_exclusion)

    return models.Filter(should=should, must_not=must_not)

```

The `visibility_filter` wrapper is unchanged from Step 4; it still adds the optional file path on top of `branch_filter`:

```python
def visibility_filter(branch, ancestry, path=None):
    must = []

    if path:
        must.append(
            models.FieldCondition(
                key="path",
                match=models.MatchValue(value=path)
            )
        )

    must.append(branch_filter(branch, ancestry))

    return models.Filter(must=must)
```

</details>

`A` keeps the `terms.md` it forked from; `root` sees the new one:

```python
lookup("terms.md", "A", A_ancestry).payload["content"]
# Standard terms of service apply to all plans.
lookup("terms.md", "root", root_ancestry).payload["content"]
# Updated terms of service, effective Q3, with the new data-retention clause.
```

Storage state:

```javascript
{ path: 'terms.md', branch: root, seq: 0, overwritten_in: [{by: root, seq: 3}] }
{ path: 'terms.md', branch: root, seq: 3, overwritten_in: [] }
```


## Step 7: A Second Branch, Same File

Fork `B` off `root` and have it overwrite `pricing.md`, the same file `A` already changed.

```text
root  ●──●──●──────●         root seq 0–3
            ├── A ●──●       A: pricing.md with SSO
            └── B ●          B forks at root seq 3; B seq 0: update pricing.md
```

Record `B`'s ancestry and commit its version:

```python
B_ancestry = [("root", 3)]      # B forked at root seq 3
update("pricing.md", "B", seq=0, content="The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR.", ancestry=B_ancestry)
```

`root`'s `pricing.md` point now carries two marks, `{by: A, seq: 1}` and `{by: B, seq: 0}`. Each branch's exclusion matches only its own `by` on a single record, so the three branches resolve the same path three ways, with no leakage between the two forks:

```python
for branch, anc in [("root", root_ancestry), ("A", A_ancestry), ("B", B_ancestry)]:
    print(lookup("pricing.md", branch, anc).payload["content"])
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
# The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.
# The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR.
```

Storage state:

```javascript
{ path: 'pricing.md', branch: root, seq: 0, overwritten_in: [{by: root, seq: 1}] }
{ path: 'pricing.md', branch: root, seq: 1, overwritten_in: [{by: A, seq: 1}, {by: B, seq: 0}] }
{ path: 'pricing.md', branch: A,    seq: 1, overwritten_in: [] }
{ path: 'pricing.md', branch: B,    seq: 0, overwritten_in: [] }
```

## Searching a Branch

`lookup` resolves one known path; a search ranks the whole corpus by relevance. It's the same visibility filter, passed to a semantic query instead of a path scroll:

```python
def search(query, branch, ancestry, limit=5):
    return client.query_points(
        collection_name="content",
        query=models.Document(text=query, model=MODEL),
        query_filter=visibility_filter(branch, ancestry),
        limit=limit, with_payload=True,
    ).points
```

The same query, scoped to each branch, returns that branch's live version of the page:

```python
for branch, anc in [("root", root_ancestry), ("A", A_ancestry), ("B", B_ancestry)]:
    hit = search("how much does the pro plan cost", branch, anc, limit=1)[0]
    print(hit.payload["content"])
# The Pro tier costs $39 per month with 200 GB of storage and unlimited seats.
# The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO.
# The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR.
```

## Scaling to Production

- **The filter grows with lineage depth, not corpus size.** Each query walks the ancestry once, adding one candidate clause and one exclusion clause per ancestor. The filter's size tracks how deep a branch sits, not how many files or versions the collection holds.

- **Qdrant is a derived index.** Branch ancestry and history live in version control. Build the collection by replaying that history, and if the index ever drifts, rebuild it. The derived point IDs make a full replay idempotent: the same commit writes the same point, so `upsert` overwrites cleanly.

- **Storage grows with edits.** Every overwrite keeps the old version as a point, so long-lived branches accumulate versions. Reclaiming superseded versions is a production concern.

- **Out of scope.** Three-way merges, force-push, and concurrent writers on a branch are each their own design decision and are not needed to show the core mechanic.

## Related Reading

- [Filtering](/documentation/search/filtering/) for the full set of filter clauses, including the [nested object filter](/documentation/search/filtering/#nested-object-filter) that binds `by` and `seq` on the same record.
- [Payload Indexing](/documentation/manage-data/indexing/#payload-index) for the index types the visibility fields use.
- [Qdrant Cloud Inference](/documentation/inference/#qdrant-cloud-inference) for generating the dense embeddings server-side.
