---
title: Branch-Aware Search
short_description: "Build branch-aware semantic search on Qdrant: query a corpus version, get back what's live on that branch."
description: "Index a versioned corpus in Qdrant and scope queries to a branch's HEAD using a materialized per-branch live-set of point IDs."
weight: 12
aliases:
  - /documentation/tutorials/branch-aware-search/
---

# Branch-Aware Search Over Versioned Documents

| Time: 30 min | Level: Intermediate | Output: [GitHub](https://github.com/qdrant/examples/tree/master/branch-aware-search) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/branch-aware-search/branch_aware_search.ipynb) |
| --- | ----------- | ----------- | ----------- |

Searching a versioned corpus needs to scope to "what's live on this branch right now." Without that, a query on a feature branch returns content from `main` the branch has overridden, or misses content the branch added. This tutorial builds the pattern: materialize each branch's HEAD as a set of point IDs and filter queries against that set. Creating a new branch copies that set. No new embeddings, no new Qdrant writes.

The pipeline applies anywhere a corpus has a branching history: IDE assistants searching a developer's feature branch, CMS systems searching draft content separately from published, policy or contract repositories with regional or jurisdictional variants. We use a synthetic mini-repo here so the mechanic is the focus.

This tutorial assumes you're comfortable with [hybrid search](/documentation/search/text-search/#combining-semantic-and-lexical-search-with-hybrid-search), [filtering](/documentation/search/filtering/), and the [Query API](/documentation/search/hybrid-queries/).

## Setup

Install the Python packages used throughout the tutorial:

```bash
pip install "qdrant-client>=1.18"
```

<aside role="status">
This tutorial uses <a href="/documentation/inference/#qdrant-cloud-inference">Qdrant Cloud Inference</a> to generate embeddings server-side. The free tier covers this tutorial's footprint.
</aside>

## The Synthetic Corpus

The corpus is a small in-memory documentation site: pricing pages, policies, getting-started guides, and API reference. Three branches: `main` (the live published version), plus two draft branches forked from main, `pricing-refresh` (marketing's draft) and `compliance-update` (legal's draft).

```python
main_docs = {
    "pricing/pro-tier.md":           "The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats.",
    "pricing/enterprise.md":         "Enterprise pricing is customized based on volume. Contact sales for a quote, custom SLAs, and an SSO demo.",
    "pricing/free-tier.md":          "The Free tier is permanently free with 1 GB of storage and 100 API calls per day. No credit card required.",
    "policies/refunds.md":           "Refunds are processed within 30 days of the original purchase. Pro-rated charges apply for partial periods.",
    "policies/data-retention.md":    "Customer data is retained for the duration of the contract and 90 days after termination, then permanently deleted.",
    "policies/acceptable-use.md":    "Our acceptable use policy prohibits scraping, automated abuse, and any content that violates applicable laws.",
    "getting-started/install.md":    "Install the CLI with pip install our-tool. The default config writes to ~/.our-tool/config.json.",
    "getting-started/auth.md":       "Authenticate with an API key from your dashboard. Set it via OUR_TOOL_API_KEY or in the config file.",
    "getting-started/first-query.md":"Run your first query with our-tool query 'your search here'. Results return as JSON or YAML.",
    "guides/python-sdk.md":          "The Python SDK wraps every API endpoint. Install with pip install our-tool-sdk and import from our_tool.",
    "guides/typescript-sdk.md":      "The TypeScript SDK ships type definitions for all API responses. Install with npm install @our-tool/sdk.",
    "guides/migrations.md":          "Schema migrations run automatically on deployment. Roll back with our-tool migrate --rollback.",
    "guides/monitoring.md":          "Metrics export in Prometheus format on port 9090. Dashboard templates ship for Grafana.",
    "guides/troubleshooting.md":     "Common errors and their resolutions. Check the status page first if multiple users are affected.",
    "guides/best-practices.md":      "Production-grade recommendations for security, performance, and reliability.",
    "api/overview.md":               "The REST API uses standard HTTPS with bearer token auth. All responses are JSON.",
    "api/rate-limits.md":            "Free plan is 100 requests per day. Pro plan is unlimited within fair use. Enterprise has custom limits.",
    "api/errors.md":                 "All errors return standard HTTP status codes with a JSON body describing the cause.",
    "README.md":                     "Overview of our tool for new users. Start with the Getting Started guide.",
    "CHANGELOG.md":                  "Release notes by version, newest first. Major releases follow semantic versioning.",
}

# Marketing draft: bump Pro tier pricing and refresh enterprise messaging.
pricing_refresh_overrides = {
    "pricing/pro-tier.md":     "The Pro tier costs $39 per month and includes 200 GB of storage, unlimited API calls, team collaboration for unlimited seats, and SSO support.",
    "pricing/enterprise.md":   "Enterprise pricing starts at $499 per month with custom volume discounts. SSO, audit logs, and dedicated support included.",
}

# Compliance draft: add GDPR language to the Pro tier page and tighten the refund window.
compliance_update_overrides = {
    "pricing/pro-tier.md":     "The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats. EU customers: data is processed under GDPR with EU-region storage.",
    "policies/refunds.md":     "Refunds are processed within 14 days for Pro customers and 30 days for Free tier. No questions asked within the first 7 days.",
}
```

Both drafts edit `pricing/pro-tier.md` with different angles: `pricing-refresh` changes the price and adds SSO, `compliance-update` adds GDPR copy at the original price. Each also touches one additional file unique to it. Everything else is shared across all three branches. Same path, three branches, three distinct versions of `pricing/pro-tier.md`: that's the picture we want to verify.

## Collection Schema and Branch State

The content lives in a Qdrant collection. For simplicity, the branch graph and per-branch live-set live in plain Python dictionaries.

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
    vectors_config={
        "dense": models.VectorParams(size=384, distance=models.Distance.COSINE),
    },
    sparse_vectors_config={
        "bm25": models.SparseVectorParams(modifier=models.Modifier.IDF),
    },
)
```

Branch membership lives outside the point payload, so no payload indexes are needed. In this design, where content-derived point IDs are shared across branches, storing live membership on each point (scalar tag, array of branches, or similar) would conflict with that sharing: each branch's update would either overwrite another branch's data or require writes across every shared point.

An alternative design that includes the branch in the point ID itself (e.g., `uuid5(NS, "branch|path|hash")`) would let branch info live on the point safely, at the cost of re-ingesting all of a parent's content on every fork. This tutorial trades that for cheap branching.

Branch state in Python:

```python
# Per-branch live-set: which point IDs are currently visible on this branch's HEAD
live_sets: dict[str, set[str]] = {}

# Per-branch (path -> set of point IDs). The set keeps the structure correct
# for the chunked-file case even though this tutorial uses one chunk per file.
path_to_points: dict[str, dict[str, set[str]]] = {}
```

<aside role="status">
These dictionaries live in memory, so a restart loses them. Production deployments would need to back them with a database, or rebuild them from the version-control system.
</aside>

## Ingest

Point IDs are derived from `(path, content_hash)`, so the same content at the same path always maps to the same point. Branches that share an unchanged file share the point too.

```python
import hashlib
import uuid

CONTENT_NS = uuid.UUID("00000000-0000-0000-0000-000000000001")

def point_id(path: str, content: str) -> str:
    """Deterministic UUID from (path, content): same inputs always produce the same ID."""
    content_hash = hashlib.sha256(content.encode()).hexdigest()
    return str(uuid.uuid5(CONTENT_NS, f"{path}|{content_hash}"))

def create_branch(name: str, parent: str | None):
    """Create a branch. A fork copies the parent's live-set, so the child starts identical and diverges as it commits."""
    if parent is None:
        live_sets[name] = set()
        path_to_points[name] = {}
    else:
        live_sets[name] = set(live_sets[parent])
        path_to_points[name] = {p: set(ids) for p, ids in path_to_points[parent].items()}

def ingest_commit(branch: str, files: dict[str, str]):
    """Upsert a commit's files, then update the branch's live-set: evict each path's old point IDs and add the new ones."""
    points = []
    # New point IDs grouped by path (one per file here; a set so the multi-chunk case works too).
    new_ids_by_path: dict[str, set[str]] = {}
    for path, content in files.items():
        pid = point_id(path, content)
        new_ids_by_path.setdefault(path, set()).add(pid)
        points.append(models.PointStruct(
            id=pid,
            vector={
                "dense": models.Document(text=content, model="sentence-transformers/all-minilm-l6-v2"),
                "bm25":  models.Document(text=content, model="qdrant/bm25", options={"avg_len": 12}),
            },
            payload={"path": path, "content": content},
        ))

    # Write to Qdrant first; only mutate branch state after the upsert is durably
    # acknowledged. If the upsert fails the exception propagates and the in-memory
    # branch HEAD is unchanged.
    client.upsert(collection_name="content", points=points, wait=True)

    for path, new_ids in new_ids_by_path.items():
        prev_ids = path_to_points[branch].get(path, set())
        live_sets[branch] -= prev_ids
        live_sets[branch] |= new_ids
        path_to_points[branch][path] = new_ids

def delete_files(branch: str, paths: list[str]):
    """Delete files from a branch by dropping their point IDs from the live-set."""
    for path in paths:
        ids = path_to_points[branch].pop(path, set())
        live_sets[branch] -= ids
```

Removing a file from a branch drops its point IDs from that branch's live-set, so queries on that branch stop returning it. The point itself stays in Qdrant: the tutorial never deletes points, so it remains both for other branches that reference it and after the last branch drops it (reclaiming those is the storage-growth concern in Scaling to Production). A filter-based design that walks ancestors would need a tombstone here, because the ancestor clause keeps matching the parent's copy. The live-set sidesteps that.

Set up the fixture:

```python
create_branch("main", parent=None)
ingest_commit("main", main_docs)

create_branch("pricing-refresh", parent="main")     # marketing draft forks from main's HEAD
ingest_commit("pricing-refresh", pricing_refresh_overrides)

create_branch("compliance-update", parent="main")   # compliance draft forks from main's HEAD as a sibling
ingest_commit("compliance-update", compliance_update_overrides)
```

Forking copied main's set, and each draft swapped in new point IDs only for the files it changed. Everything else stays shared:

![Three branch live-sets (main, pricing-refresh, and compliance-update), each holding 20 point IDs. The two drafts forked from main and copied its set, then swapped in new point IDs only for the files they changed; all other files keep the same IDs as main. One Qdrant collection stores 24 physical points: seven versions of the three edited files plus 17 shared files.](/documentation/tutorials/branch-aware-search/branch-live-sets.png)

After ingest:

- Each live-set has 20 point IDs (one per document at that branch's HEAD).
- `main`'s 20 IDs include the original `pricing/pro-tier.md`, `pricing/enterprise.md`, and `policies/refunds.md`.
- `pricing-refresh`'s 20 IDs swap in the new pricing copy for `pricing/pro-tier.md` and the new enterprise copy for `pricing/enterprise.md`. The other 18 are shared with main.
- `compliance-update`'s 20 IDs swap in the GDPR-extended `pricing/pro-tier.md` and the tightened `policies/refunds.md`. The other 18 are shared with main.
- The Qdrant collection physically stores 24 points: 20 from main, plus four new versions written by the two drafts. Old versions stay in the collection but drop out of the branches that overrode them.

## Query

Branch-aware search is a single hybrid query restricted to the points in the branch's live-set, using Qdrant's [Has id](/documentation/search/filtering/#has-id) filter:

```python
def search(branch: str, query: str, limit: int = 5):
    branch_filter = models.Filter(
        must=[models.HasIdCondition(has_id=list(live_sets[branch]))]
    )
    return client.query_points(
        collection_name="content",
        prefetch=[
            models.Prefetch(
                query=models.Document(text=query, model="sentence-transformers/all-minilm-l6-v2"),
                using="dense",
                filter=branch_filter,
                limit=50,
            ),
            models.Prefetch(
                query=models.Document(text=query, model="qdrant/bm25", options={"avg_len": 12}),
                using="bm25",
                filter=branch_filter,
                limit=50,
            ),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=limit,
    ).points
```

<aside role="status">
The branch filter works with any search type. This tutorial uses hybrid (dense + BM25) as it is a solid default for mixed text. Use dense alone when relevance is mostly semantic, sparse/BM25 when exact terms matter most (identifiers, error strings, or codes), and hybrid when you need both. See <a href="/documentation/search/text-search/">Text Search</a> and <a href="/documentation/search/hybrid-queries/">Hybrid Queries</a> for details.
</aside>

Run the same query against all three branches and print each one's top result:

```python
query = "Pro tier monthly cost"

print("main:", search("main", query, limit=1)[0].payload["content"])
print("pricing-refresh:", search("pricing-refresh", query, limit=1)[0].payload["content"])
print("compliance-update:", search("compliance-update", query, limit=1)[0].payload["content"])

# Output:
# main: The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats.
# pricing-refresh: The Pro tier costs $39 per month and includes 200 GB of storage, unlimited API calls, team collaboration for unlimited seats, and SSO support.
# compliance-update: The Pro tier costs $29 per month and includes 100 GB of storage, unlimited API calls, and team collaboration for up to 10 seats. EU customers: data is processed under GDPR with EU-region storage.
```

Same query, three branches, three answers. The drafts stay isolated: `pricing-refresh`'s result never mentions GDPR, and `compliance-update`'s never mentions SSO.

## Adapting to Other Content Types

This tutorial stores one chunk per document because each document is short. Real corpora are usually chunked, and the mechanic carries over: the live-set still holds point IDs, the query is still a Has id filter, and the point ID gains a chunk anchor, becoming `(path, anchor, content_hash)`, so chunks within a file get distinct IDs. Editing one chunk changes only that chunk's point ID:

![A code file split by function. The point ID for one function is built as uuid5 of three parts: the path, the anchor (its AST symbol path), and the content_hash. Editing that function changes only its content_hash, so only its point ID changes; the unchanged functions keep their IDs and stay shared across branches.](/documentation/tutorials/branch-aware-search/chunk-id-mapping.png)

The anchor has to be stable, like a heading path, an AST symbol path, or a clause number, so unchanged content keeps its ID across edits. Unstable anchors like line numbers or byte offsets shift on every insertion and force the whole file to re-embed. For how to split each content type, see the [chunking strategies course](/course/essentials/day-1/chunking-strategies/).

On update, re-chunk the whole file and pass all of its chunks, not only the changed ones: eviction is path-scoped, so a partial update would drop the unchanged chunks from the live-set. Passing every chunk means re-submitting the unchanged ones, which still carry the same IDs. Set the upsert's [update mode](/documentation/manage-data/points/#update-mode) to `models.UpdateMode.INSERT_ONLY` so those existing IDs are skipped and only the new or changed chunks get written.

## Scaling to Production

This pattern uses the simplest Qdrant primitives on purpose. The inline Has id filter carries the branch's whole ID set on every query, which stays comfortable into the thousands of points per branch, enough for most corpora. A few spots still need hardening before production:

- **Storage growth.** Every edit adds a new point and keeps the old one, so long-lived branches accumulate versions. Reclaiming superseded points is a production concern, much like log compaction.

- **Durable branch state.** The live-sets here live in Python dictionaries for clarity. In production, back them with a database, or rebuild them from the version-control system, which is the real source of truth.

- **Out of scope.** Three-way merges, force-push, and concurrent writers on a branch are each their own design decision and aren't needed to show the core mechanic. Treat Qdrant as the search index and git as the source of truth: if the index drifts, rebuild it.
