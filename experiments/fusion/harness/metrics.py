"""Metrics and intervals.

pytrec_eval decides ties by document id where we decided them by point id
ascending, so runs are handed over as rank positions rather than scores: the
list order pytrec_eval scores is then exactly the list the replay produced.
"""

from __future__ import annotations

import numpy as np
import pytrec_eval

TRUNCATE = 200
MEASURES = ("ndcg_cut_10", "recall_100", "mrr_10")


def qrels_dict(qrels_frame) -> dict:
    out: dict[str, dict[str, int]] = {}
    for query_id, point_id, relevance in zip(
        qrels_frame["query_id"], qrels_frame["point_id"], qrels_frame["relevance"]
    ):
        out.setdefault(str(query_id), {})[str(int(point_id))] = int(relevance)
    return out


def run_entry(point_ids, limit: int = TRUNCATE) -> dict:
    """Rank positions as scores, so the evaluator keeps our declared order."""
    return {str(int(pid)): float(-rank) for rank, pid in enumerate(point_ids[:limit])}


def evaluate(qrels: dict, run: dict) -> dict:
    """Per-query nDCG@10, Recall@100 and MRR@10."""
    evaluator = pytrec_eval.RelevanceEvaluator(qrels, {"ndcg_cut.10", "recall.100"})
    scored = evaluator.evaluate(run)
    top10 = {qid: dict(list(entries.items())[:10]) for qid, entries in run.items()}
    mrr = pytrec_eval.RelevanceEvaluator(qrels, {"recip_rank"}).evaluate(top10)
    return {
        qid: {
            "ndcg_cut_10": values["ndcg_cut_10"],
            "recall_100": values["recall_100"],
            "mrr_10": mrr.get(qid, {}).get("recip_rank", 0.0),
        }
        for qid, values in scored.items()
    }


def bootstrap_interval(differences, resamples: int = 1000, seed: int = 42) -> dict:
    """Percentile interval for the mean paired difference between two arms."""
    differences = np.asarray(differences, dtype=np.float64)
    if len(differences) == 0:
        return {"mean": 0.0, "low": 0.0, "high": 0.0, "half_width": 0.0, "n": 0}
    rng = np.random.default_rng(seed)
    draws = rng.integers(0, len(differences), size=(resamples, len(differences)))
    means = differences[draws].mean(axis=1)
    low, high = np.percentile(means, [2.5, 97.5])
    return {
        "mean": float(differences.mean()),
        "low": float(low),
        "high": float(high),
        "half_width": float((high - low) / 2),
        "n": int(len(differences)),
    }


def ideal_ndcg_at_10(candidate_ids, relevance: dict, k: int = 10) -> float:
    """nDCG@10 of the best possible ordering of the candidate union.

    The ceiling any fusion setting can reach on this candidate set. Below the
    target, the fix is retrieval breadth, not a fusion parameter.
    """
    unique_ids = {int(pid) for pid in candidate_ids}
    gains = sorted((relevance.get(pid, 0) for pid in unique_ids), reverse=True)
    ideal = sorted(relevance.values(), reverse=True)
    return _dcg(gains[:k]) / _dcg(ideal[:k]) if any(ideal) else 0.0


def _dcg(gains) -> float:
    return float(sum(g / np.log2(i + 2) for i, g in enumerate(gains)))
