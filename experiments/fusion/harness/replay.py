"""Offline replay of Qdrant's fusion, arithmetic-identical to the Rust.

Sources ported (qdrant v1.19.0, commit 74f3e85b9):
  lib/segment/src/common/reciprocal_rank_fusion.rs  -> rrf_fuse
  lib/segment/src/common/score_fusion.rs            -> dbsf_fuse, score_fusion

Everything runs in float32 because the server does. numpy defaults to float64
and diverges on every query, so the F32 casts here are load-bearing.
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np

F32 = np.float32
DEFAULT_RRF_K = 2

# The grid of section 5 of the plan. Weight pairs are absolute, never ratios:
# weighted RRF is not scale-invariant, so (2,4) and (1,2) are different arms.
RRF_KS = (1, 2, 5, 20, 61)
WEIGHT_PAIRS = ((1.0, 1.0), (1.0, 2.0), (1.0, 3.0), (2.0, 1.0), (3.0, 1.0), (2.0, 4.0))
DEFAULT_ARM = "rrf_k2_w1-1"


# --------------------------------------------------------------------------- RRF


@lru_cache(maxsize=4096)
def position_scores(n: int, k: int, weight: float) -> np.ndarray:
    """RRF contribution of positions 0..n-1: 1 / ((pos+1)/w + k - 1), in float32.

    weight <= 0 returns 0.0 for every position: the leg's documents are still
    inserted, at the bottom, rather than dropped.

    Cached because the grid replays the same (length, k, weight) millions of
    times. Callers read the array and never write to it.
    """
    if weight <= 0.0:
        return np.zeros(n, dtype=F32)
    pos_plus_one = np.arange(1, n + 1, dtype=F32)
    return F32(1.0) / (pos_plus_one / F32(weight) + F32(k) - F32(1.0))


def rrf_fuse(legs, k: int = DEFAULT_RRF_K, weights=None):
    """Fuse per-leg id lists (already in rank order) into (ids, scores).

    Returns ids sorted by score descending, then id ascending. The server sorts
    on score alone and leaves ties in hash order; the id tiebreak is ours, and
    it is declared once here so every metric downstream sees the same list.
    """
    legs = [np.asarray(leg, dtype=np.int64) for leg in legs]
    if weights is None:
        weights = [1.0] * len(legs)
    elif len(weights) != len(legs):
        raise ValueError(
            f"Number of weights in RRF should match number of pre-fetches: "
            f"got {len(weights)}, expected {len(legs)}"
        )
    if not legs:
        return np.empty(0, dtype=np.int64), np.empty(0, dtype=F32)

    ids, inverse = np.unique(np.concatenate(legs), return_inverse=True)
    total = np.zeros(len(ids), dtype=F32)
    offset = 0
    for leg, weight in zip(legs, weights):
        # Accumulate leg by leg, so a document found twice sums in prefetch
        # order exactly as the server's fold does.
        total[inverse[offset : offset + len(leg)]] += position_scores(len(leg), k, weight)
        offset += len(leg)
    return _sort(ids, total)


# --------------------------------------------------------------- score fusion


def welford(scores: np.ndarray):
    """Mean and *sample* variance in float32, one pass, as welfords_mean_variance."""
    mean = F32(0.0)
    aggregate = F32(0.0)
    for k, value in enumerate(scores, start=1):
        value = F32(value)
        old_delta = value - mean
        mean = mean + old_delta / F32(k)
        aggregate = aggregate + old_delta * (value - mean)
    return mean, aggregate / (F32(len(scores)) - F32(1.0))


def _rescale(scores: np.ndarray, low: F32, high: F32) -> np.ndarray:
    """The Rust `norm`: flat 0.5 when the extremes coincide, else linear rescale."""
    if low == high:
        return np.full(len(scores), F32(0.5), dtype=F32)
    return (scores.astype(F32) - low) / (high - low)


def distr_norm(scores: np.ndarray) -> np.ndarray:
    """Normalize against mean +/- 3 standard deviations. Scores are not clipped."""
    scores = np.asarray(scores, dtype=F32)
    if len(scores) < 2:
        return np.full(len(scores), F32(0.5), dtype=F32)
    mean, variance = welford(scores)
    std_dev = np.sqrt(variance, dtype=F32)
    return _rescale(scores, mean - F32(3.0) * std_dev, mean + F32(3.0) * std_dev)


def min_max_norm(scores: np.ndarray) -> np.ndarray:
    """The unreachable `Normalization::MinMax`. One element is returned unchanged."""
    scores = np.asarray(scores, dtype=F32)
    if len(scores) < 2:
        return scores
    return _rescale(scores, scores.min(), scores.max())


def sum_fuse(legs, normalized_legs, weights=None):
    """Weighted sum of already-normalized per-leg scores.

    A document found by one leg only keeps that single normalized score while
    competing against two-leg sums: the fold imputes nothing for the missing leg.
    """
    legs = [np.asarray(leg, dtype=np.int64) for leg in legs]
    if not legs:
        return np.empty(0, dtype=np.int64), np.empty(0, dtype=F32)
    if weights is None:
        weights = [1.0] * len(legs)

    ids, inverse = np.unique(np.concatenate(legs), return_inverse=True)
    total = np.zeros(len(ids), dtype=F32)
    offset = 0
    for leg, normalized, weight in zip(legs, normalized_legs, weights):
        weighted = (np.asarray(normalized, dtype=F32) * F32(weight)).astype(F32)
        total[inverse[offset : offset + len(leg)]] += weighted
        offset += len(leg)
    return _sort(ids, total)


def score_fusion(legs, leg_scores, norm=distr_norm, weights=None):
    """Sum of normalized per-leg scores. `dbsf()` is norm=distr_norm, weights=None."""
    return sum_fuse(legs, [norm(np.asarray(s, dtype=F32)) for s in leg_scores], weights)


def dbsf_fuse(legs, leg_scores):
    return score_fusion(legs, leg_scores, norm=distr_norm, weights=None)


def _sort(ids: np.ndarray, scores: np.ndarray):
    order = np.lexsort((ids, -scores))
    return ids[order], scores[order]


# --------------------------------------------------------------------- the arms


def arm_names(include_unreachable: bool = True):
    names = [f"rrf_k{k}_w{_w(a, b)}" for k in RRF_KS for a, b in WEIGHT_PAIRS]
    names.append("dbsf")
    names += ["dense_only", "sparse_only"]
    if include_unreachable:
        names += [f"unreachable_minmax_w{_w(a, b)}" for a, b in WEIGHT_PAIRS]
        names += [f"unreachable_distr_w{_w(a, b)}" for a, b in WEIGHT_PAIRS]
    return names


def _w(a: float, b: float) -> str:
    return f"{a:g}-{b:g}"


class QueryLegs:
    """One query's two candidate lists, with each normalization computed once."""

    __slots__ = ("ids", "raw", "_normalized")

    def __init__(self, dense_ids, dense_scores, sparse_ids, sparse_scores):
        self.ids = [
            np.asarray(dense_ids, dtype=np.int64),
            np.asarray(sparse_ids, dtype=np.int64),
        ]
        self.raw = [
            np.asarray(dense_scores, dtype=F32),
            np.asarray(sparse_scores, dtype=F32),
        ]
        self._normalized = {}

    def normalized(self, kind: str):
        if kind not in self._normalized:
            norm = min_max_norm if kind == "minmax" else distr_norm
            self._normalized[kind] = [norm(scores) for scores in self.raw]
        return self._normalized[kind]


def run_arm(name: str, legs: QueryLegs):
    """Fuse one query under one arm. Leg order is dense first, then sparse."""
    if name == "dbsf":
        return sum_fuse(legs.ids, legs.normalized("distr"))
    if name == "dense_only":
        return _sort(legs.ids[0], legs.raw[0])
    if name == "sparse_only":
        return _sort(legs.ids[1], legs.raw[1])
    if name.startswith("rrf_"):
        k, weights = _parse_rrf(name)
        return rrf_fuse(legs.ids, k=k, weights=weights)
    if name.startswith("unreachable_"):
        _, kind, weight_part = name.split("_", 2)
        return sum_fuse(legs.ids, legs.normalized(kind), _parse_weights(weight_part))
    raise ValueError(f"unknown arm {name}")


def leg_contributions(name: str, legs: QueryLegs):
    """What each leg added, position by position, for the given arm.

    Same numbers the fusion summed, so the exhibit can show where a fused score
    came from instead of reconstructing it at drafting time.
    """
    if name == "dense_only":
        return [legs.raw[0], np.zeros(len(legs.ids[1]), dtype=F32)]
    if name == "sparse_only":
        return [np.zeros(len(legs.ids[0]), dtype=F32), legs.raw[1]]
    if name.startswith("rrf_"):
        k, weights = _parse_rrf(name)
        return [
            position_scores(len(ids), k, weight) for ids, weight in zip(legs.ids, weights)
        ]
    kind = "distr" if name == "dbsf" else name.split("_", 2)[1]
    weights = [1.0, 1.0] if name == "dbsf" else _parse_weights(name.split("_", 2)[2])
    return [
        (np.asarray(scores, dtype=F32) * F32(weight)).astype(F32)
        for scores, weight in zip(legs.normalized(kind), weights)
    ]


def _parse_rrf(name: str):
    _, k_part, weight_part = name.split("_", 2)
    return int(k_part[1:]), _parse_weights(weight_part)


def _parse_weights(part: str):
    return [float(x) for x in part.lstrip("w").split("-")]
