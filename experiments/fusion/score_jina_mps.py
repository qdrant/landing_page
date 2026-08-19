"""Score jina-reranker-v2 on MPS, writing the same parquet schema as study.e4_score.

Torch scores are sigmoid(ONNX logits); parity verified on 5 pairs. Rankings identical,
and study.e4 only uses within-model score order.
"""

import sys
import time

sys.path.insert(0, "/Users/dylanc/Documents/GitHub/landing_page/experiments/fusion")

import pandas as pd
from harness import CACHE, replay
from run import load_legs
from sentence_transformers import CrossEncoder
from study import E4_DEPTH, E4_QUERIES, RERANK, _sample_queries, _slug

MODEL_NAME = "jinaai/jina-reranker-v2-base-multilingual"
CORPORA = ("scifact", "arguana", "wands", "codesearchnet", "dbpedia-entity")

model = CrossEncoder(
    MODEL_NAME,
    trust_remote_code=True,
    device="mps",
    max_length=1024,
    automodel_args={"torch_dtype": "auto"},
)

for name in CORPORA:
    path = RERANK / f"{name}__{_slug(MODEL_NAME)}.parquet"
    if path.exists():
        print(f"{name} cached", flush=True)
        continue
    legs = load_legs(name, 1)
    texts = pd.read_parquet(CACHE / f"{name}_corpus.parquet").set_index("point_id")["text"]
    query_text = pd.read_parquet(CACHE / f"{name}_queries.parquet").set_index("query_id")["text"]
    sample = _sample_queries(legs, E4_QUERIES)

    started, pairs, rows = time.time(), 0, []
    for position, query_id in enumerate(sample, start=1):
        candidates = [int(p) for p in replay.run_arm(replay.DEFAULT_ARM, legs[query_id])[0][:E4_DEPTH]]
        documents = [texts.loc[pid] for pid in candidates]
        q = query_text.loc[str(query_id)]
        scores = model.predict(
            [(q, d) for d in documents],
            batch_size=16,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        rows.extend(
            (str(query_id), pid, rank, float(score))
            for rank, (pid, score) in enumerate(zip(candidates, scores))
        )
        pairs += len(documents)
        if position % 25 == 0:
            rate = pairs / (time.time() - started)
            print(f"{name} {position}/{len(sample)} {rate:.1f} docs/sec", flush=True)
    frame = pd.DataFrame(rows, columns=["query_id", "point_id", "fusion_rank", "score"])
    frame.to_parquet(path, index=False)
    print(f"{name} done: {pairs} pairs in {time.time() - started:.0f}s", flush=True)

print("ALL DONE", flush=True)
