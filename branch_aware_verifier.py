"""
Verifier for the Branch-Aware Search tutorial.

Replicates the tutorial's functions verbatim (final forms) and runs the exact
seven-step fixture, asserting every commented output the tutorial commits to.

Only difference from the tutorial, forced by running against a LOCAL Docker
Qdrant instead of Qdrant Cloud: the client points at http://localhost:6333 with
local inference (cloud_inference defaults to False), so models.Document is embedded
client-side via fastembed. Everything else (model name, operations, payload, filter
shape) matches the tutorial exactly.

Run:  .venv-verify/bin/python branch_aware_verifier.py
"""

import uuid
from qdrant_client import QdrantClient, models

MODEL = "sentence-transformers/all-MiniLM-L6-v2"  # fastembed-canonical casing (see note above)
COLLECTION = "content"

client = QdrantClient(url="http://localhost:6333")

# ---------------------------------------------------------------------------
# Collection + indexes (tutorial: create_collection in Setup, indexes per step)
# ---------------------------------------------------------------------------
if client.collection_exists(COLLECTION):
    client.delete_collection(COLLECTION)

client.create_collection(
    collection_name=COLLECTION,
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
)

client.create_payload_index(collection_name=COLLECTION, field_name="path", field_schema=models.PayloadSchemaType.KEYWORD)
client.create_payload_index(collection_name=COLLECTION, field_name="branch", field_schema=models.PayloadSchemaType.KEYWORD)
client.create_payload_index(collection_name=COLLECTION, field_name="overwritten_in.by", field_schema=models.PayloadSchemaType.KEYWORD)
client.create_payload_index(collection_name=COLLECTION, field_name="seq", field_schema=models.PayloadSchemaType.INTEGER)
client.create_payload_index(collection_name=COLLECTION, field_name="overwritten_in.seq", field_schema=models.PayloadSchemaType.INTEGER)

# ---------------------------------------------------------------------------
# Tutorial functions (final forms, verbatim)
# ---------------------------------------------------------------------------
NS = uuid.UUID("00000000-0000-0000-0000-000000000042")

def point_id(branch, seq, path):
    return str(uuid.uuid5(NS, f"{branch}|{seq}|{path}"))

def supersede(point, by, seq):
    marks = point.payload["overwritten_in"] + [{"by": by, "seq": seq}]
    client.set_payload(collection_name=COLLECTION, payload={"overwritten_in": marks}, points=[point.id])

def update(file_name, branch, seq, content):
    prev = lookup(file_name, branch)
    if prev:
        supersede(prev, by=branch, seq=seq)
    client.upsert(collection_name=COLLECTION, points=[models.PointStruct(
        id=point_id(branch, seq, file_name),
        vector=models.Document(text=content, model=MODEL),
        payload={"path": file_name, "content": content, "branch": branch, "seq": seq, "overwritten_in": []},
    )])

def delete(file_name, branch, seq):
    supersede(lookup(file_name, branch), by=branch, seq=seq)  # mark, no replacement point

branches = {"root": None}  # branch -> (parent, fork_seq), or None for the root

def fork(child, parent, at_seq):
    branches[child] = (parent, at_seq)

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

def lookup(file_name, branch):
    points, _ = client.scroll(
        collection_name=COLLECTION,
        scroll_filter=visibility_filter(branch, path=file_name),
        limit=1, with_payload=True,
    )
    return points[0] if points else None

def search(query, branch, limit=5):
    return client.query_points(
        collection_name=COLLECTION,
        query=models.Document(text=query, model=MODEL),
        query_filter=visibility_filter(branch),
        limit=limit, with_payload=True,
    ).points

# ---------------------------------------------------------------------------
# Assertion helpers
# ---------------------------------------------------------------------------
PASS = []

def check(label, got, want):
    assert got == want, f"\nFAIL: {label}\n  got:  {got!r}\n  want: {want!r}"
    PASS.append(label)
    print(f"OK  {label}")

def content(file_name, branch):
    p = lookup(file_name, branch)
    return p.payload["content"] if p else None

# Exact content strings from the tutorial
PRICING_V1 = "The Pro tier costs $29 per month with 100 GB of storage."
PRICING_V2 = "The Pro tier costs $39 per month with 200 GB of storage and unlimited seats."
PRICING_A  = "The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO."
PRICING_B  = "The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR."
NOTES      = "Internal launch notes. Remove before the public release."
TERMS_V1   = "Standard terms of service apply to all plans."
TERMS_V2   = "Updated terms of service, effective Q3, with the new data-retention clause."
ROADMAP    = "Draft roadmap for the next two quarters. Not for publication."

# ---------------------------------------------------------------------------
# Step 1: add files on root (seq 0)
# ---------------------------------------------------------------------------
update("pricing.md", "root", seq=0, content=PRICING_V1)
update("notes.md",   "root", seq=0, content=NOTES)
update("terms.md",   "root", seq=0, content=TERMS_V1)
check("step 1  lookup pricing.md@root == $29", content("pricing.md", "root"), PRICING_V1)

# ---------------------------------------------------------------------------
# Step 2: update pricing.md on root (seq 1)
# ---------------------------------------------------------------------------
update("pricing.md", "root", seq=1, content=PRICING_V2)
check("step 2  lookup pricing.md@root == $39", content("pricing.md", "root"), PRICING_V2)

# ---------------------------------------------------------------------------
# Step 3: delete notes.md on root (seq 2)
# ---------------------------------------------------------------------------
delete("notes.md", "root", seq=2)
check("step 3  lookup notes.md@root is None", content("notes.md", "root"), None)

# ---------------------------------------------------------------------------
# Step 4: fork A at root seq 2, add roadmap.md (A seq 0)
# ---------------------------------------------------------------------------
fork("A", "root", at_seq=2)
update("roadmap.md", "A", seq=0, content=ROADMAP)
check("step 4  lookup roadmap.md@A == draft",   content("roadmap.md", "A"), ROADMAP)
check("step 4  lookup roadmap.md@root is None", content("roadmap.md", "root"), None)
check("step 4  lookup pricing.md@A inherited",  content("pricing.md", "A"), PRICING_V2)

# ---------------------------------------------------------------------------
# Step 5: A updates inherited pricing.md (A seq 1)
# ---------------------------------------------------------------------------
update("pricing.md", "A", seq=1, content=PRICING_A)
check("step 5  lookup pricing.md@A == SSO",        content("pricing.md", "A"), PRICING_A)
check("step 5  lookup pricing.md@root unchanged",  content("pricing.md", "root"), PRICING_V2)

# ---------------------------------------------------------------------------
# Step 6: root commits terms.md after the fork (root seq 3)
# ---------------------------------------------------------------------------
update("terms.md", "root", seq=3, content=TERMS_V2)
check("step 6  lookup terms.md@A pre-fork version", content("terms.md", "A"), TERMS_V1)
check("step 6  lookup terms.md@root updated",       content("terms.md", "root"), TERMS_V2)

# ---------------------------------------------------------------------------
# Step 7: fork B at root seq 3, overwrite pricing.md (B seq 0)
# ---------------------------------------------------------------------------
fork("B", "root", at_seq=3)
update("pricing.md", "B", seq=0, content=PRICING_B)
check("step 7  lookup pricing.md@root", content("pricing.md", "root"), PRICING_V2)
check("step 7  lookup pricing.md@A",    content("pricing.md", "A"), PRICING_A)
check("step 7  lookup pricing.md@B",    content("pricing.md", "B"), PRICING_B)

# ---------------------------------------------------------------------------
# Searching a Branch (semantic, dense)
# ---------------------------------------------------------------------------
QUERY = "how much does the pro plan cost"
expected_search = {"root": PRICING_V2, "A": PRICING_A, "B": PRICING_B}
for branch, want in expected_search.items():
    top = search(QUERY, branch, limit=1)[0].payload["content"]
    check(f"search  {QUERY!r}@{branch} top-1", top, want)

# ---------------------------------------------------------------------------
# Physical point count: 3 (root seq0) + 1 (root seq1) + 1 (root seq3)
#                       + 1 (A roadmap) + 1 (A pricing) + 1 (B pricing) = 8
# (the notes.md delete writes no point)
# ---------------------------------------------------------------------------
stored = client.count(COLLECTION, exact=True).count
check("physical points stored == 8", stored, 8)

print(f"\nALL ASSERTIONS PASSED ({len(PASS)} checks). Physical points stored: {stored}")
