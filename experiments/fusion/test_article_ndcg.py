"""The nDCG@10 printed in article 1 against pytrec_eval, on SciFact.

The article ships its own ten-line metric rather than an external evaluator, so
this runs that code block verbatim out of the markdown and requires exact
per-query agreement with the harness. Run it after editing the snippet.
"""

from __future__ import annotations

import pathlib
import re
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, str(pathlib.Path(__file__).parent))

from harness import metrics as M
from harness import replay
import run as R

ARTICLE = (
    pathlib.Path(__file__).parents[2]
    / "qdrant-landing/content/articles/before-tuning-a-qdrant-collection.md"
)


def article_ndcg():
    """The ndcg_at_k the article prints, executed from the markdown itself."""
    blocks = re.findall(r"```python\n(.*?)```", ARTICLE.read_text(), re.S)
    block = next(b for b in blocks if "def ndcg_at_k" in b)
    namespace: dict = {}
    exec(block, namespace)
    return namespace["ndcg_at_k"]


def main():
    ndcg_at_k = article_ndcg()
    qrels = M.qrels_dict(pd.read_parquet("cache/scifact_qrels.parquet"))
    run, article = {}, {}
    for query_id, legs in R.load_legs("scifact", 1).items():
        ids, _ = replay.rrf_fuse(list(legs.ids), k=replay.DEFAULT_RRF_K)
        run[str(query_id)] = M.run_entry(ids)
        article[str(query_id)] = ndcg_at_k(
            [str(int(point_id)) for point_id in ids], qrels.get(str(query_id), {})
        )

    harness = {qid: values["ndcg_cut_10"] for qid, values in M.evaluate(qrels, run).items()}
    queries = sorted(harness.keys() & article.keys())
    assert len(queries) == 300, f"expected 300 SciFact queries, got {len(queries)}"
    worst = max(abs(harness[qid] - article[qid]) for qid in queries)
    print(
        f"queries={len(queries)} worst per-query difference={worst:.2e} "
        f"pytrec_eval={np.mean([harness[q] for q in queries]):.4f} "
        f"article={np.mean([article[q] for q in queries]):.4f}"
    )
    assert worst == 0.0, "the article snippet no longer reproduces pytrec_eval"


if __name__ == "__main__":
    main()
