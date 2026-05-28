---
title: Branch-Aware Search
short_description: "Scope search to a version-controlled branch in Qdrant so a query returns that branch's live view, inherited from its ancestors."
description: "Index a versioned corpus in Qdrant and scope queries to a branch's live view with an ancestor-walk filter over per-version branch and seq payload fields."
weight: 12
aliases:
  - /documentation/tutorials/branch-aware-search/
---

# Branch-Aware Search Over Versioned Documents

| Time: 25 min | Level: Intermediate |
| --- | ----------- |

A search on a specific branch should return exactly the content that is live on that branch, and nothing from another. Without that scoping, a query returns content from other branches, or a version this branch already replaced.

Each version of a file is one point in the Qdrant collection, tagged with the `branch` that wrote it and a `seq` (the commit number on that branch). <br>When a later commit overwrites or deletes a file, the previous version's point records which branch did it, and when. A search on a branch is then a single filter: it reads from that branch and the branches it forked from, and skips anything they later replaced.

## Setup

Install the Python client:

```bash
pip install "qdrant-client>=1.18"
```

<aside role="status">
This tutorial uses <a href="/documentation/inference/#qdrant-cloud-inference">Qdrant Cloud Inference</a> to generate embeddings server-side. The free tier covers this tutorial's footprint.
</aside>

## The Synthetic Corpus

The corpus is a small documentation site: pricing pages, policies, getting-started guides, and API reference. There are three branches: `main` is the published version, with `pricing-refresh` (marketing's) and `compliance-update` (legal's) forked from it.

```python
main_docs = {
    "pricing/pro-tier.md":            "The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats.",
    "pricing/enterprise.md":          "Enterprise pricing is customized based on volume. Contact sales for a quote, custom SLAs, and an SSO demo.",
    "pricing/free-tier.md":           "The Free tier is permanently free with 1 GB of storage and 100 API calls per day. No credit card required.",
    "policies/refunds.md":            "Refunds are processed within 30 days of the original purchase. Pro-rated charges apply for partial periods.",
    "policies/data-retention.md":     "Customer data is retained for the duration of the contract and 90 days after termination, then permanently deleted.",
    "policies/acceptable-use.md":     "Our acceptable use policy prohibits scraping, automated abuse, and any content that violates applicable laws.",
    "getting-started/install.md":     "Install the CLI with pip install our-tool. The default config writes to ~/.our-tool/config.json.",
    "getting-started/auth.md":        "Authenticate with an API key from your dashboard. Set it via OUR_TOOL_API_KEY or in the config file.",
    "getting-started/first-query.md": "Run your first query with our-tool query 'your search here'. Results return as JSON or YAML.",
    "guides/python-sdk.md":           "The Python SDK wraps every API endpoint. Install with pip install our-tool-sdk and import from our_tool.",
    "guides/typescript-sdk.md":       "The TypeScript SDK ships type definitions for all API responses. Install with npm install @our-tool/sdk.",
    "guides/migrations.md":           "Schema migrations run automatically on deployment. Roll back with our-tool migrate --rollback.",
    "guides/monitoring.md":           "Metrics export in Prometheus format on port 9090. Dashboard templates ship for Grafana.",
    "guides/troubleshooting.md":      "Common errors and their resolutions. Check the status page first if multiple users are affected.",
    "guides/best-practices.md":       "Production-grade recommendations for security, performance, and reliability.",
    "api/overview.md":                "The REST API uses standard HTTPS with bearer token auth. All responses are JSON.",
    "api/rate-limits.md":             "Free plan is 100 requests per day. Pro plan is unlimited within fair use. Enterprise has custom limits.",
    "api/errors.md":                  "All errors return standard HTTP status codes with a JSON body describing the cause.",
    "README.md":                      "Overview of our tool for new users. Start with the Getting Started guide.",
    "CHANGELOG.md":                   "Release notes by version, newest first. Major releases follow semantic versioning.",
}

# Marketing branch: raise the Pro price and refresh enterprise messaging.
pricing_refresh = {
    "pricing/pro-tier.md":   "The Pro tier costs $39 per month and includes 200 GB of storage, unlimited API calls, team collaboration for unlimited seats, and SSO support.",
    "pricing/enterprise.md": "Enterprise pricing starts at $499 per month with custom volume discounts. SSO, audit logs, and dedicated support included.",
}

# Compliance branch: add GDPR language to the Pro tier page and tighten the refund window.
compliance_update = {
    "pricing/pro-tier.md": "The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats. EU customers: data is processed under GDPR with EU-region storage.",
    "policies/refunds.md": "Refunds are processed within 14 days for Pro customers and 30 days for Free tier. No questions asked within the first 7 days.",
}

# main keeps committing after the two branches fork off: it edits a shared file and adds a new one.
main_later_edit = {
    "api/rate-limits.md": "Free plan is 60 requests per minute. Pro and Enterprise are unlimited within fair use, with burst credits.",
    "policies/sla.md":    "Service level agreement: 99.9% uptime for Pro and Enterprise, measured monthly with service credits for breaches.",
}
```

Two cases this design has to get right:

1. **Per-branch versions of the same file.** Both forks edit `pricing/pro-tier.md`: `pricing-refresh` raises the price and adds SSO, while `compliance-update` adds GDPR copy at the original price. The same path should resolve to three different versions across the three branches.
2. **Timing.** After both branches fork off `main`, `main` keeps moving: it edits the shared `api/rate-limits.md` and adds `policies/sla.md`. Each fork should still see `main`'s files as they were at the fork point, not these later changes.

## How a Branch Sees Content

A branch records its fork point as `(parent, parent's seq at fork)`. From there, what the branch sees is its own commits plus everything inherited from its ancestors up to the fork point, minus anything superseded along the way:

```text
main ──● seq0 ───────────────────● seq1
       │  (20 base files)          (edit api/rate-limits.md, add policies/sla.md)
       ├── pricing-refresh ● seq0
       └── compliance-update ● seq0
```

Both branches forked at `main seq0`, so each sees `main` as it stood at that fork. 

Three pieces of runtime state encode this in plain Python:

```python
lineage: dict[str, tuple[str, int] | None] = {}  # branch -> (parent, fork_seq)
last_seq: dict[str, int] = {}  # branch -> its latest commit seq (-1 before first)
head: dict[str, dict[str, str]] = {}  # branch -> {path -> current point id}
```

`lineage` is the durable per-branch record. <br>`head` and `last_seq` are replay bookkeeping, rebuilt from version control on startup.

<aside role="status">
In the tutorial these dicts live in process memory. In production, persist the per-branch <code>lineage</code> records (the only durable state) somewhere small and reachable: a JSON manifest checked into the repo, a metadata table, or a separate Qdrant collection with one point per branch. The <code>head</code> map stays a replay cache, rebuild it from version control alongside the collection.
</aside>

## Collection Schema

Each point in the collection has three payload fields:

- `branch`: the branch that wrote a version.
- `seq`: a per-branch counter we assign on each commit (`0`, `1`, `2`, ...), not the git commit hash. It orders each branch's commits, so the filter can include only the commits at or before each ancestor's fork point.
- `overwritten_in`: a list of `{by, seq}` records, each meaning "replaced in branch `by` at that branch's commit `seq`." Overwrites and deletes both append one.

Every field the visibility filter touches needs a payload index:

```python
from qdrant_client import QdrantClient, models

# Replace url and api_key with your own from https://cloud.qdrant.io
client = QdrantClient(
    url="https://xyz-example.qdrant.io:6333",
    api_key="<your-api-key>",
    cloud_inference=True,
)

client.create_collection(
    collection_name="content",
    sparse_vectors_config={
        "bm25": models.SparseVectorParams(modifier=models.Modifier.IDF),
    },
)

client.create_payload_index(
    collection_name="content",
    field_name="branch",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
client.create_payload_index(
    collection_name="content",
    field_name="seq",
    field_schema=models.PayloadSchemaType.INTEGER,
)
client.create_payload_index(
    collection_name="content",
    field_name="overwritten_in[].by",
    field_schema=models.PayloadSchemaType.KEYWORD,
)
client.create_payload_index(
    collection_name="content",
    field_name="overwritten_in[].seq",
    field_schema=models.PayloadSchemaType.INTEGER,
)
```

## Ingest

A commit writes a new point for each file it adds or changes, tagged with the branch and its current `seq`. If the file already had a version on this branch, that prior point gets a `{by, seq}` appended to the `overwritten_in` field, marking it superseded.
<br>The point ID is derived from `(branch, seq, path)`, so replaying the same history produces the same IDs and the rebuild path can `upsert` without duplicating points.

<aside role="status">
This tutorial uses one point per file. For chunked corpora the branch logic is unchanged, the point ID gains a stable chunk anchor, becoming <code>(branch, seq, path, anchor)</code>. See <a href="/course/essentials/day-1/chunking-strategies/">chunking strategies</a> for how to split each content type.
</aside>

```python
import uuid

NS = uuid.UUID("00000000-0000-0000-0000-000000000042")

# BM25's key parameter for short fields: the average word count.
word_counts = [len(text.split()) for text in main_docs.values()]
AVG_LEN = round(sum(word_counts) / len(word_counts), 1)  # ~15.3 here

def point_id(branch: str, seq: int, path: str) -> str:
    return str(uuid.uuid5(NS, f"{branch}|{seq}|{path}"))

def create_branch(name: str, parent: str | None):
    """Record a branch. A fork inherits the parent's view, no points written."""
    last_seq[name] = -1
    if parent is None:
        lineage[name] = None
        head[name] = {}
    else:
        # fork point: parent + parent's latest seq
        lineage[name] = (parent, last_seq[parent])
        head[name] = dict(head[parent])  # start from parent's view

def supersede(branch: str, path: str, at_seq: int):
    """Mark the version of `path` that `branch` currently sees, at `at_seq`."""
    prev = head[branch].get(path)
    if prev is None:
        return
    point = client.retrieve("content", ids=[prev])[0]
    marks = point.payload["overwritten_in"]
    marks.append({"by": branch, "seq": at_seq})
    client.set_payload(
        "content",
        payload={"overwritten_in": marks},
        points=[prev],
    )

def commit(branch: str, writes: dict[str, str] | None = None, deletes: list[str] | None = None):
    """One commit at one seq: write or overwrite files, and/or delete files."""
    writes, deletes = writes or {}, deletes or []
    seq = last_seq[branch] + 1
    last_seq[branch] = seq
    points = []
    for path, content in writes.items():
        supersede(branch, path, seq)  # mark the version this commit replaces
        pid = point_id(branch, seq, path)
        points.append(models.PointStruct(
            id=pid,
            vector={
                "bm25": models.Document(
                    text=content,
                    model="qdrant/bm25",
                    options={"avg_len": AVG_LEN},
                ),
            },
            payload={
                "path": path,
                "content": content,
                "branch": branch,
                "seq": seq,
                "overwritten_in": [],
            },
        ))
        head[branch][path] = pid
    for path in deletes:
        supersede(branch, path, seq)  # same record, no replacement point
        head[branch].pop(path, None)
    if points:
        client.upsert(collection_name="content", points=points, wait=True)
```

A delete writes the same record as an overwrite, with no replacement point behind it, and it is a real commit, so it carries a `seq` like any other. That `seq` is what lets a branch that forked before the delete keep the file, while the branch that deleted it (and anything forked after) does not.

Build the fixture:

```python
create_branch("main", parent=None)
commit("main", writes=main_docs)

create_branch("pricing-refresh", parent="main")  # forks at main seq0
commit("pricing-refresh", writes=pricing_refresh)

create_branch("compliance-update", parent="main")  # also at main seq0
commit(
    "compliance-update",
    writes=compliance_update,
    deletes=["policies/acceptable-use.md"],
)

commit("main", writes=main_later_edit)  # main seq1, after both forks
```

Each fork wrote only the files it changed, and `main`'s later commit wrote two points (the edited `api/rate-limits.md` and the new `policies/sla.md`). The collection holds 26 physical points: the 20 base files, two versions from each fork, and the two from `main`'s later commit.

## Query

A query on a branch is one filter built from a lineage walk. <br>For each branch on the path there's a **cutoff**, the highest `seq` to include from that branch: for the querying branch itself, that's its latest commit; for an ancestor, the `seq` at which this line forked from it. <br>Both filter clauses key off those cutoffs. The `should` clause (the candidates to consider) gathers each branch's versions up to its cutoff. The `must_not` clause (the ones to drop) excludes anything that branch superseded at or before its cutoff, using a [nested filter](/documentation/search/filtering/#nested-object-filter) so `by` and `seq` match on the same record:

```python
def candidate_clause(b: str, cut: int) -> models.Filter:
    """Versions written on branch b with seq up to cut."""
    return models.Filter(must=[
        models.FieldCondition(key="branch", match=models.MatchValue(value=b)),
        models.FieldCondition(key="seq", range=models.Range(lte=cut)),
    ])

def exclusion_clause(b: str, cut: int) -> models.NestedCondition:
    """Match if overwritten_in has {by: b, seq <= cut} on the same record."""
    return models.NestedCondition(nested=models.Nested(
        key="overwritten_in",
        filter=models.Filter(must=[
            models.FieldCondition(key="by", match=models.MatchValue(value=b)),
            models.FieldCondition(key="seq", range=models.Range(lte=cut)),
        ]),
    ))

def visibility_filter(branch: str) -> models.Filter:
    # Walk lineage: (branch, cutoff) for this branch then each ancestor.
    cutoffs = [(branch, last_seq[branch])]
    node = lineage[branch]
    while node is not None:
        parent, fork = node
        cutoffs.append((parent, fork))
        node = lineage[parent]

    should, must_not = [], []
    for b, cut in cutoffs:
        should.append(candidate_clause(b, cut))
        must_not.append(exclusion_clause(b, cut))
    return models.Filter(should=should, must_not=must_not)

def search(branch: str, query: str, limit: int = 5):
    return client.query_points(
        collection_name="content",
        query=models.Document(
            text=query,
            model="qdrant/bm25",
            options={"avg_len": AVG_LEN},
        ),
        using="bm25",
        query_filter=visibility_filter(branch),
        limit=limit,
        with_payload=True,
    ).points
```

Run a query that lands on `pricing/pro-tier.md`, against all three branches:

```python
for branch in ["main", "pricing-refresh", "compliance-update"]:
    print(f"{branch}:", search(branch, "Pro tier storage and seats", limit=1)[0].payload["content"])

# Output:
# main: The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats.
# pricing-refresh: The Pro tier costs $39 per month and includes 200 GB of storage, unlimited API calls, team collaboration for unlimited seats, and SSO support.
# compliance-update: The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats. EU customers: data is processed under GDPR with EU-region storage.
```

Same query, three branches, three different answers. `pricing-refresh` returns its $39 page with SSO. `compliance-update` returns its GDPR variant. `main` returns the original.

Now the timing case. `main` edited `api/rate-limits.md` at `seq 1`, after both branches forked. `main` now shows the new text; the forks still see the version they inherited:

```python
for branch in ["main", "pricing-refresh"]:
    print(f"{branch}:", search(branch, "rate limits requests free plan", limit=1)[0].payload["content"])

# Output:
# main: Free plan is 60 requests per minute. Pro and Enterprise are unlimited within fair use, with burst credits.
# pricing-refresh: Free plan is 100 requests per day. Pro plan is unlimited within fair use. Enterprise has custom limits.
```

`pricing-refresh` forked at `main`'s `seq 0`, before the `seq 1` edit. Its cutoff for `main` is `0`, so the record stamped at `seq 1` falls past the cutoff, the exclusion doesn't apply, and the pre-edit version stays visible. The same cutoff hides `policies/sla.md` (which `main` added at `seq 1`) from both forks.

## Scaling to Production

- **The filter grows with lineage depth, not corpus size.** The query walks the lineage once, adding one `should` clause and one `must_not` clause per ancestor. The filter's size tracks how deep a branch sits, not how many files or versions the collection holds.

- **Qdrant is a derived index.** Branch lineage and history live in version control. Build the collection by replaying that history, and if the index ever drifts, rebuild it. Nothing here needs the index to be the source of truth.

- **Storage grows with edits.** Every overwrite keeps the old version as a point, so long-lived branches accumulate versions. Reclaiming superseded versions is a production concern.

- **Out of scope.** Three-way merges, force-push, and concurrent writers on a branch are each their own design decision and are not needed to show the core mechanic.

## Related Reading

- [Filtering](/documentation/search/filtering/) for the full set of filter clauses.
- [Text Search](/documentation/search/text-search/) for BM25 and the `avg_len` parameter.
- [Payload Indexing](/documentation/manage-data/indexing/#payload-index) for the index types the visibility fields use.
