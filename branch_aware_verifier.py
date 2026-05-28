"""
Verifier for the Branch-Aware Search tutorial.

Replicates the tutorial's final functions and runs the seven-step fixture,
asserting every commented output. Runs in STRICT MODE (as Qdrant Cloud does), so
it actually exercises the payload-index requirements: the nested-array indexes
must be named overwritten_in[].by / overwritten_in[].seq or strict mode rejects
the filter.

Only difference from the tutorial: the client points at a LOCAL Docker Qdrant
with local inference (cloud_inference defaults to False), so models.Document is
embedded client-side via fastembed. Operations, payload, filter, model, and index
names match the tutorial exactly.

Run:  .venv-verify/bin/python branch_aware_verifier.py
"""

import uuid
from qdrant_client import QdrantClient, models

MODEL = "sentence-transformers/all-MiniLM-L6-v2"
COLLECTION = "content"

client = QdrantClient(url="http://localhost:6333")

# ---------------------------------------------------------------------------
# Collection in strict mode + payload indexes (bracket notation for the
# nested-array fields, which strict mode requires).
# ---------------------------------------------------------------------------
if client.collection_exists(COLLECTION):
    client.delete_collection(COLLECTION)

client.create_collection(
    collection_name=COLLECTION,
    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
    strict_mode_config=models.StrictModeConfig(
        enabled=True, unindexed_filtering_retrieve=False),
)

for field_name, schema in [
    ("path", models.PayloadSchemaType.KEYWORD),
    ("branch", models.PayloadSchemaType.KEYWORD),
    ("seq", models.PayloadSchemaType.INTEGER),
    ("overwritten_in[].by", models.PayloadSchemaType.KEYWORD),
    ("overwritten_in[].seq", models.PayloadSchemaType.INTEGER),
]:
    client.create_payload_index(
        collection_name=COLLECTION, field_name=field_name, field_schema=schema)

# ---------------------------------------------------------------------------
# Tutorial functions (final forms). Ancestry is passed in: a list of
# (branch, cutoff) from the branch itself (cutoff None) up to the root.
# ---------------------------------------------------------------------------
NS = uuid.UUID("00000000-0000-0000-0000-000000000042")

def point_id(branch, seq, path):
    return str(uuid.uuid5(NS, f"{branch}|{seq}|{path}"))

def supersede(point, by, seq):
    marks = point.payload.get("overwritten_in", []) + [{"by": by, "seq": seq}]
    client.set_payload(
        collection_name=COLLECTION,
        payload={"overwritten_in": marks},
        points=[point.id],
    )

def visibility_filter(ancestry, path=None):
    must = []
    if path:
        must.append(models.FieldCondition(
            key="path", match=models.MatchValue(value=path)))
    should, must_not = [], []
    for branch, cut in ancestry:
        candidate = [models.FieldCondition(
            key="branch", match=models.MatchValue(value=branch))]
        excluded = [models.FieldCondition(
            key="by", match=models.MatchValue(value=branch))]
        if cut is not None:  # an ancestor: only up to the fork point
            candidate.append(models.FieldCondition(
                key="seq", range=models.Range(lte=cut)))
            excluded.append(models.FieldCondition(
                key="seq", range=models.Range(lte=cut)))
        should.append(models.Filter(must=candidate))
        must_not.append(models.NestedCondition(nested=models.Nested(
            key="overwritten_in", filter=models.Filter(must=excluded))))
    return models.Filter(must=must, should=should, must_not=must_not)

def lookup(file_name, ancestry):
    points, _ = client.scroll(
        collection_name=COLLECTION,
        scroll_filter=visibility_filter(ancestry, path=file_name),
        limit=1, with_payload=True,
    )
    return points[0] if points else None

def update(file_name, branch, seq, content, ancestry):
    prev = lookup(file_name, ancestry)
    if prev:
        supersede(prev, by=branch, seq=seq)
    client.upsert(collection_name=COLLECTION, points=[models.PointStruct(
        id=point_id(branch, seq, file_name),
        vector=models.Document(text=content, model=MODEL),
        payload={"path": file_name, "content": content,
                 "branch": branch, "seq": seq, "overwritten_in": []},
    )])

def delete(file_name, branch, seq, ancestry):
    supersede(lookup(file_name, ancestry), by=branch, seq=seq)

def search(query, ancestry, limit=5):
    return client.query_points(
        collection_name=COLLECTION,
        query=models.Document(text=query, model=MODEL),
        query_filter=visibility_filter(ancestry),
        limit=limit, with_payload=True,
    ).points

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------
PASS = []

def check(label, got, want):
    assert got == want, f"\nFAIL: {label}\n  got:  {got!r}\n  want: {want!r}"
    PASS.append(label)
    print(f"OK  {label}")

def content(file_name, ancestry):
    p = lookup(file_name, ancestry)
    return p.payload["content"] if p else None

PRICING_V1 = "The Pro tier costs $29 per month with 100 GB of storage."
PRICING_V2 = "The Pro tier costs $39 per month with 200 GB of storage and unlimited seats."
PRICING_A  = "The Pro tier costs $39 per month with 200 GB of storage, unlimited seats, and SSO."
PRICING_B  = "The Pro tier costs $39 per month with 200 GB of storage. EU customers: data stays in-region under GDPR."
NOTES      = "Internal launch notes. Remove before the public release."
TERMS_V1   = "Standard terms of service apply to all plans."
TERMS_V2   = "Updated terms of service, effective Q3, with the new data-retention clause."
ROADMAP    = "Draft roadmap for the next two quarters. Not for publication."

ROOT = [("root", None)]
A    = [("A", None), ("root", 2)]
B    = [("B", None), ("root", 3)]

# Step 1: add files on root (seq 0)
update("pricing.md", "root", seq=0, content=PRICING_V1, ancestry=ROOT)
update("notes.md",   "root", seq=0, content=NOTES,      ancestry=ROOT)
update("terms.md",   "root", seq=0, content=TERMS_V1,   ancestry=ROOT)
check("step 1  pricing.md@root == $29", content("pricing.md", ROOT), PRICING_V1)

# Step 2: update pricing.md (seq 1)
update("pricing.md", "root", seq=1, content=PRICING_V2, ancestry=ROOT)
check("step 2  pricing.md@root == $39", content("pricing.md", ROOT), PRICING_V2)

# Step 3: delete notes.md (seq 2)
delete("notes.md", "root", seq=2, ancestry=ROOT)
check("step 3  notes.md@root is None", content("notes.md", ROOT), None)

# Step 4: fork A at root seq 2, add roadmap.md (A seq 0)
update("roadmap.md", "A", seq=0, content=ROADMAP, ancestry=A)
check("step 4  roadmap.md@A == draft",   content("roadmap.md", A), ROADMAP)
check("step 4  roadmap.md@root is None", content("roadmap.md", ROOT), None)
check("step 4  pricing.md@A inherited",  content("pricing.md", A), PRICING_V2)

# Step 5: A updates inherited pricing.md (A seq 1)
update("pricing.md", "A", seq=1, content=PRICING_A, ancestry=A)
check("step 5  pricing.md@A == SSO",       content("pricing.md", A), PRICING_A)
check("step 5  pricing.md@root unchanged", content("pricing.md", ROOT), PRICING_V2)

# Step 6: root updates terms.md after the fork (seq 3)
update("terms.md", "root", seq=3, content=TERMS_V2, ancestry=ROOT)
check("step 6  terms.md@A pre-fork", content("terms.md", A), TERMS_V1)
check("step 6  terms.md@root new",   content("terms.md", ROOT), TERMS_V2)

# Step 7: fork B at root seq 3, overwrite pricing.md (B seq 0)
update("pricing.md", "B", seq=0, content=PRICING_B, ancestry=B)
check("step 7  pricing.md@root", content("pricing.md", ROOT), PRICING_V2)
check("step 7  pricing.md@A",    content("pricing.md", A), PRICING_A)
check("step 7  pricing.md@B",    content("pricing.md", B), PRICING_B)

# Searching a branch (dense, same filter)
QUERY = "how much does the pro plan cost"
for anc, want, name in [(ROOT, PRICING_V2, "root"), (A, PRICING_A, "A"), (B, PRICING_B, "B")]:
    top = search(QUERY, anc, limit=1)[0].payload["content"]
    check(f"search  cost@{name} top-1", top, want)

# Search must not leak a hidden version even below rank 1
for anc, hidden, name in [(A, PRICING_B, "A"), (B, PRICING_A, "B"), (ROOT, PRICING_A, "root")]:
    seen = [p.payload["content"] for p in search(QUERY, anc, limit=5)]
    check(f"search  no leak of other branch @{name}", hidden in seen, False)

# Step 7 leaves both marks on root's pricing.md point
root_pricing = lookup("pricing.md", ROOT)
marks = {(m["by"], m["seq"]) for m in lookup("pricing.md", ROOT) and
         client.retrieve(COLLECTION, ids=[point_id("root", 1, "pricing.md")])[0].payload["overwritten_in"]}
check("marks on root pricing seq1 == {(A,1),(B,0)}", marks, {("A", 1), ("B", 0)})

# Physical points: 3 (root seq0) + 1 (root seq1) + 1 (root seq3) + 1 (A roadmap)
#                  + 1 (A pricing) + 1 (B pricing) = 8 (delete writes no point)
stored = client.count(COLLECTION, exact=True).count
check("physical points stored == 8", stored, 8)

print(f"\nALL ASSERTIONS PASSED ({len(PASS)} checks). Physical points stored: {stored}")
