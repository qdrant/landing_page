"""Generate the companion notebook. Destination: qdrant/examples/fusion-methods/."""

import json
import pathlib

OUT = pathlib.Path(__file__).parent / "notebook" / "Tuning_Hybrid_Fusion.ipynb"


def _lines(text):
    """nbformat wants each source line to keep its newline, except the last."""
    parts = text.split("\n")
    return [line + "\n" for line in parts[:-1]] + parts[-1:]


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": _lines(text.strip())}


def code(text):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": _lines(text.strip("\n")),
    }


CELLS = [
    md("""
# Tuning Hybrid Fusion: Is Your Gain Real?

| | |
|---|---|
| **Time** | 40 min |
| **Level** | Intermediate |
| **Requires** | Qdrant 1.17.x or later |

Sweeping the fusion grid always produces a winner. This notebook decides whether that winner is
worth deploying, by measuring how large a gain has to be on your own labeled set before it means
anything.

It runs end to end on BEIR/SciFact. Swap in your own data at the cell marked **Your Data**.
The companion article is [How to Tune Hybrid Search in Qdrant](https://qdrant.tech/articles/how-to-tune-hybrid-search/).
"""),
    md("## Setup"),
    code("""
!pip install -q "qdrant-client>=1.17.0" datasets pandas numpy fastembed
"""),
    md("""
<aside role="status">This notebook uses <a href="https://qdrant.tech/documentation/inference/#qdrant-cloud-inference">Qdrant Cloud Inference</a>
to embed documents server-side, so no model runs in the notebook. The free tier covers this corpus.
To run against a self-hosted cluster instead, drop <code>cloud_inference=True</code> and produce the
vectors with FastEmbed locally.</aside>
"""),
    code("""
import numpy as np
import pandas as pd
from datasets import load_dataset
from google.colab import userdata
from qdrant_client import QdrantClient, models

# Set QDRANT_URL and QDRANT_API_KEY as Colab secrets (left sidebar, key icon).
# Values come from https://cloud.qdrant.io
client = QdrantClient(
    url=userdata.get("QDRANT_URL"),
    api_key=userdata.get("QDRANT_API_KEY"),
    cloud_inference=True,
)

COLLECTION = "fusion_tuning"
DENSE_MODEL = "sentence-transformers/all-minilm-l6-v2"
DENSE_DIM = 384
BM25_MODEL = "qdrant/bm25"
DEPTH = 200      # candidates per leg; the article measures why this matters more than k
SEED = 42

rng = np.random.default_rng(SEED)
"""),
    md("""
## Your Data

Everything downstream reads three objects: `documents` (a list of strings), `queries`
(query id to text), and `qrels` (query id to a dict of document index to relevance).
The next cell fills them from SciFact. **This is the cell to replace with your own data.**

Around 50 labeled queries is the floor for the interval at the end to say anything.
[Retrieval relevance](https://qdrant.tech/documentation/improve-search/retrieval-relevance/)
covers building a labeled set, including the warning that synthetic queries inflate scores.
"""),
    code("""
corpus_ds = load_dataset("BeIR/scifact", "corpus", split="corpus")
queries_ds = load_dataset("BeIR/scifact", "queries", split="queries")
qrels_ds = load_dataset("BeIR/scifact-qrels", split="test")

documents = [f"{d.get('title', '')} {d.get('text', '')}".strip() for d in corpus_ds]
row_of_doc = {d["_id"]: i for i, d in enumerate(corpus_ds)}

qrels = {}
for row in qrels_ds:
    if row["score"] > 0:
        qrels.setdefault(str(row["query-id"]), {})[row_of_doc[str(row["corpus-id"])]] = int(row["score"])

queries = {str(q["_id"]): q["text"] for q in queries_ds if str(q["_id"]) in qrels}
print(f"{len(documents):,} documents, {len(queries):,} labeled queries")
print(f"{np.mean([len(v) for v in qrels.values()]):.1f} relevant documents per query")
"""),
    md("""
## Split the Queries

The grid is swept on one half and the winner is checked on the other. Selecting and reporting on
the same queries is how a sweep manufactures a gain that does not repeat.
"""),
    code("""
query_ids = sorted(queries)
shuffled = rng.permutation(len(query_ids))
half = len(query_ids) // 2
tune_ids = [query_ids[i] for i in sorted(shuffled[:half])]
test_ids = [query_ids[i] for i in sorted(shuffled[half:])]
print(f"{len(tune_ids)} queries to sweep on, {len(test_ids)} held back")
"""),
    md("""
## Measure `avg_len` for BM25

BM25 divides document length by `avg_len`, which defaults to 256. The length it compares against is
the token count *after* stopword removal and stemming, so counting words overstates it. On SciFact
the word count is 225 and the number BM25 actually uses is 151.
"""),
    code("""
from fastembed.common.utils import remove_non_alphanumeric
from fastembed.sparse.bm25 import Bm25

_bm25 = Bm25(BM25_MODEL)
lengths = [len(_bm25._stem(_bm25.tokenizer.tokenize(remove_non_alphanumeric(t)))) for t in documents]
AVG_LEN = round(float(np.mean(lengths)), 1)
print(f"avg_len = {AVG_LEN}  (mean word count would be "
      f"{np.mean([len(t.split()) for t in documents]):.1f})")
"""),
    md("""
## Index Both Legs

One point per document, carrying a dense vector and a BM25 sparse vector. `Modifier.IDF` tells
Qdrant to apply inverse document frequency server-side, which is what makes the sparse vectors
behave like BM25 rather than raw term counts.
"""),
    code("""
if client.collection_exists(COLLECTION):
    client.delete_collection(COLLECTION)

client.create_collection(
    collection_name=COLLECTION,
    vectors_config={"dense": models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE)},
    sparse_vectors_config={"bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)},
)

client.upload_points(
    collection_name=COLLECTION,
    points=[
        models.PointStruct(
            id=i,
            vector={
                "dense": models.Document(text=text, model=DENSE_MODEL),
                "bm25": models.Document(text=text, model=BM25_MODEL, options={"avg_len": AVG_LEN}),
            },
        )
        for i, text in enumerate(documents)
    ],
    batch_size=256,
)
print(f"indexed {len(documents):,} points")
"""),
    md("""
## Fetch the Candidates Once

Every fusion setting below reorders the same two candidate lists, so they are fetched once and
replayed offline. That turns a grid sweep from hundreds of round trips into arithmetic.
"""),
    code("""
def candidates(query_id):
    dense, sparse = client.query_batch_points(
        collection_name=COLLECTION,
        requests=[
            models.QueryRequest(
                query=models.Document(text=queries[query_id], model=DENSE_MODEL),
                using="dense", limit=DEPTH, with_payload=False,
            ),
            models.QueryRequest(
                query=models.Document(text=queries[query_id], model=BM25_MODEL,
                                      options={"avg_len": AVG_LEN}),
                using="bm25", limit=DEPTH, with_payload=False,
            ),
        ],
    )
    return {
        leg: (
            np.array([p.id for p in response.points], dtype=np.int64),
            np.array([p.score for p in response.points], dtype=np.float32),
        )
        for leg, response in (("dense", dense), ("sparse", sparse))
    }


legs = {qid: candidates(qid) for qid in query_ids}
print(f"cached candidates for {len(legs)} queries")
"""),
    md("""
## Replay the Fusion Offline

Qdrant computes RRF as `1 / ((pos + 1) / weight + k - 1)` per leg, summed across legs, in float32.
DBSF normalizes each leg against its mean plus or minus three sample standard deviations, then sums.
Both are reproduced here so a whole grid can be scored without re-querying. The float32 casts match
the engine; float64 diverges on every query.
"""),
    code("""
F32 = np.float32


def rrf(legs_for_query, k=2, weights=(1.0, 1.0)):
    ids, scores = _union(legs_for_query)
    for (leg_ids, _), weight, slot in zip(legs_for_query.values(), weights, _slots(legs_for_query, ids)):
        positions = np.arange(1, len(leg_ids) + 1, dtype=F32)
        scores[slot] += F32(1.0) / (positions / F32(weight) + F32(k) - F32(1.0))
    return _rank(ids, scores)


def dbsf(legs_for_query):
    ids, scores = _union(legs_for_query)
    for (_, raw), slot in zip(legs_for_query.values(), _slots(legs_for_query, ids)):
        scores[slot] += _distr_norm(raw)
    return _rank(ids, scores)


def _distr_norm(raw):
    if len(raw) < 2:
        return np.full(len(raw), F32(0.5), dtype=F32)
    mean, aggregate = F32(0.0), F32(0.0)
    for n, value in enumerate(raw, start=1):          # Welford, in float32, as the engine does
        delta = F32(value) - mean
        mean = mean + delta / F32(n)
        aggregate = aggregate + delta * (F32(value) - mean)
    spread = F32(3.0) * np.sqrt(aggregate / (F32(len(raw)) - F32(1.0)), dtype=F32)
    low, high = mean - spread, mean + spread
    if low == high:                                    # a leg with no spread contributes nothing
        return np.full(len(raw), F32(0.5), dtype=F32)
    return (raw - low) / (high - low)


def _union(legs_for_query):
    ids = np.unique(np.concatenate([leg_ids for leg_ids, _ in legs_for_query.values()]))
    return ids, np.zeros(len(ids), dtype=F32)


def _slots(legs_for_query, ids):
    return [np.searchsorted(ids, leg_ids) for leg_ids, _ in legs_for_query.values()]


def _rank(ids, scores):
    # Fusion sorts on score alone and leaves ties in arbitrary order. Breaking them
    # by id keeps two identical queries from returning two different orders.
    return ids[np.lexsort((ids, -scores))]
"""),
    md("""
## Move 1: Can Fusion Help At All?

Fusion reorders the candidates the legs returned, so the best it could possibly do is order that
union perfectly. If that ceiling is already below your target, the fix is a larger prefetch `limit`
or a better retriever, and no value of `k` will reach it.
"""),
    code("""
def dcg(gains):
    return sum(gain / np.log2(i + 2) for i, gain in enumerate(gains[:10]))


def ndcg_from_gains(gains, query_id):
    ideal = sorted(qrels[query_id].values(), reverse=True)
    return dcg(gains) / dcg(ideal) if any(ideal) else 0.0


def ndcg_at_10(ranked, query_id):
    return ndcg_from_gains([qrels[query_id].get(int(doc), 0) for doc in ranked[:10]], query_id)


def ceiling(query_id):
    # The best nDCG@10 any ordering of these candidates could reach.
    union = np.unique(np.concatenate([ids for ids, _ in legs[query_id].values()]))
    return ndcg_from_gains(
        sorted((qrels[query_id].get(int(doc), 0) for doc in union), reverse=True), query_id
    )


achieved = np.mean([ndcg_at_10(rrf(legs[q]), q) for q in test_ids])
best_possible = np.mean([ceiling(q) for q in test_ids])
print(f"default fusion nDCG@10 : {achieved:.4f}")
print(f"candidate ceiling      : {best_possible:.4f}")
print(f"headroom fusion can use: {best_possible - achieved:.4f}")
"""),
    md("""
## Move 2: Does Each Leg Earn Its Place?

Split the default arm's top 10 by which leg found each result. A leg whose unique documents never
survive into the top 10 is paying latency for nothing; a leg that contributes relevant documents no
other leg found is worth keeping even when it scores poorly alone.
"""),
    code("""
rows = []
for query_id in test_ids:
    dense_ids = set(legs[query_id]["dense"][0].tolist())
    sparse_ids = set(legs[query_id]["sparse"][0].tolist())
    for doc in rrf(legs[query_id])[:10]:
        doc = int(doc)
        rows.append({
            "source": "both" if doc in dense_ids and doc in sparse_ids
                      else ("dense only" if doc in dense_ids else "sparse only"),
            "relevant": qrels[query_id].get(doc, 0) > 0,
        })

top10 = pd.DataFrame(rows)
print(top10.groupby("source").agg(share=("relevant", "size"), relevant=("relevant", "mean")))
"""),
    md("""
## Move 3: Which Way to Move `k`

Low `k` rewards a document that one leg ranked first. High `k` rewards documents both legs found.
Corpora with about one relevant document per query tend to want low `k`; corpora with many relevant
documents tend to want high `k`. Sweep on the tuning half only.
"""),
    code("""
GRID = {"dbsf": None}
for k in (1, 2, 5, 20, 61):
    for a, b in ((1, 1), (1, 2), (1, 3), (2, 1), (3, 1), (2, 4)):
        GRID[f"k={k} w=({a},{b})"] = (k, (float(a), float(b)))
DEFAULT = "k=2 w=(1,1)"


def run_arm(name, ids):
    setting = GRID[name]
    fuse = (lambda q: dbsf(legs[q])) if setting is None else (lambda q: rrf(legs[q], *setting))
    return np.array([ndcg_at_10(fuse(q), q) for q in ids])


tuning = {name: run_arm(name, tune_ids) for name in GRID}
summary = pd.Series({name: values.mean() for name, values in tuning.items()}).sort_values(ascending=False)
print(summary.head(8).round(4).to_string())
"""),
    md("""
## Move 4: When to Stop

Resampling the queries with replacement gives a 95% interval on the mean per-query gain over the
default. A setting whose interval includes zero did not beat the default; it beat this particular
sample of queries.
"""),
    code("""
def interval(gains, resamples=1000):
    gains = np.asarray(gains, dtype=float)
    draws = np.random.default_rng(SEED).integers(0, len(gains), size=(resamples, len(gains)))
    low, high = np.percentile(gains[draws].mean(axis=1), [2.5, 97.5])
    return gains.mean(), low, high


baseline = tuning[DEFAULT]
report = pd.DataFrame(
    [(name, *interval(values - baseline)) for name, values in tuning.items() if name != DEFAULT],
    columns=["arm", "gain", "low", "high"],
).sort_values("gain", ascending=False)
report["clears"] = report["low"] > 0
print(report.head(10).round(4).to_string(index=False))
print(f"\\nmedian interval width: {(report['high'] - report['low']).median():.4f}")
"""),
    md("""
## The Decision

A rule, not a table. Take the mildest setting that clears its interval, then confirm it on the half
you held back. A gain that does not repeat on unseen queries was a property of the tuning sample.
"""),
    code("""
def extremity(name):
    # Distance from the default, so the mildest clearing setting wins.
    if GRID[name] is None:
        return float("inf")                 # a different method, not a milder setting
    k, (a, b) = GRID[name]
    return abs(np.log2(k / 2)) + abs(np.log2(a / b))


clearing = report[report["clears"]]["arm"].tolist()
if best_possible - achieved > 0.20 and not clearing:
    print("Candidate ceiling is far above what fusion reaches and nothing clears: raise the "
          "prefetch limit or improve a leg before tuning fusion.")
elif not clearing:
    print(f"Nothing clears the interval. Keep the default ({DEFAULT}). This is a real answer.")
else:
    choice = min(clearing, key=extremity)
    held_out = run_arm(choice, test_ids) - run_arm(DEFAULT, test_ids)
    gain, low, high = interval(held_out)
    print(f"Candidate setting : {choice}")
    print(f"On held-out queries: {gain:+.4f}  interval [{low:+.4f}, {high:+.4f}]")
    print("Deploy it." if low > 0 else "It did not repeat on held-out queries. Keep the default.")
"""),
    md("""
## What This Leaves You With

A setting you can defend, or the default and a reason. Both are results. Two things to re-run
rather than assume: the interval widens as your labeled set shrinks, and the winning setting can
change when you change the prefetch `limit`, because fusion only ever reorders what the legs
returned.

The measurements behind the defaults here, across five corpora, are in
[How to Tune Hybrid Search in Qdrant](https://qdrant.tech/articles/how-to-tune-hybrid-search/).
"""),
]

NOTEBOOK = {
    "cells": CELLS,
    "metadata": {
        "colab": {"provenance": []},
        "kernelspec": {"display_name": "Python 3", "name": "python3"},
        "language_info": {"name": "python"},
    },
    "nbformat": 4,
    "nbformat_minor": 0,
}

if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(NOTEBOOK, indent=1))
    print(f"wrote {OUT} ({len(CELLS)} cells)")
