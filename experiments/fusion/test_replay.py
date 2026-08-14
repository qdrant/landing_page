"""Gate A: the Rust fusion fixtures, ported. No server needed.

Seven from reciprocal_rank_fusion.rs plus the Welford property test from
score_fusion.rs, which is what validates the DBSF port. Run: python test_replay.py
"""

import numpy as np

from harness.replay import (
    DEFAULT_RRF_K,
    distr_norm,
    min_max_norm,
    rrf_fuse,
    welford,
)

F32 = np.float32


def test_rrf_scoring_empty():
    ids, scores = rrf_fuse([], DEFAULT_RRF_K)
    assert len(ids) == 0
    assert len(scores) == 0


def test_rrf_scoring_one():
    ids, scores = rrf_fuse([[1]], DEFAULT_RRF_K)
    assert len(ids) == 1
    assert ids[0] == 1
    assert scores[0] == F32(0.5)  # 1 / (0 + 2)


def test_rrf_scoring():
    responses = [[2, 1], [1, 2, 3], [5, 3, 1]]
    ids, scores = rrf_fuse(responses, DEFAULT_RRF_K)
    assert len(ids) == 4
    assert all(scores[i] >= scores[i + 1] for i in range(len(scores) - 1))
    assert list(ids) == [1, 2, 3, 5]
    assert scores[0] == F32(1.0833334)
    assert scores[1] == F32(0.8333334)
    assert scores[2] == F32(0.5833334)
    assert scores[3] == F32(0.5)


def test_rrf_scoring_weighted():
    responses = [[1, 2], [2, 1]]
    _, scores = rrf_fuse(responses, DEFAULT_RRF_K)
    assert scores[0] == scores[1]

    ids, scores = rrf_fuse(responses, DEFAULT_RRF_K, weights=[3.0, 1.0])
    assert ids[0] == 2
    assert scores[0] > scores[1]


def test_rrf_scoring_weighted_ratio():
    responses = [list(range(11, 19)), list(range(21, 29))]
    ids, _ = rrf_fuse(responses, 60, weights=[3.0, 1.0])
    top_10 = ids[:10]
    from_source_1 = sum(1 for i in top_10 if 10 <= i < 20)
    from_source_2 = sum(1 for i in top_10 if 20 <= i < 30)
    assert from_source_1 >= 2 * from_source_2


def test_rrf_scoring_weights_length_mismatch():
    responses = [[1], [2]]
    for weights in ([1.0, 2.0, 3.0], [1.0]):
        try:
            rrf_fuse(responses, DEFAULT_RRF_K, weights=weights)
        except ValueError:
            continue
        raise AssertionError(f"expected a validation error for weights {weights}")


def test_rrf_scoring_zero_weight():
    ids, scores = rrf_fuse([[1], [2]], DEFAULT_RRF_K, weights=[1.0, 0.0])
    by_id = dict(zip(ids.tolist(), scores.tolist()))
    assert by_id[1] == 0.5  # 1/(0+2)
    assert by_id[2] == 0.0  # zero weight, still present


def test_welford_calc_vs_naive():
    """The repo's own property test, at its own tolerance: abs 1e-5 or rel 1e-4."""
    rng = np.random.default_rng(0)
    for _ in range(200):
        n = int(rng.integers(2, 1000))
        scores = rng.uniform(-100.0, 100.0, size=n).astype(F32)
        naive_mean = scores.sum(dtype=F32) / F32(n)
        naive_variance = ((scores - naive_mean) ** 2).sum(dtype=F32) / F32(n - 1)
        mean, variance = welford(scores)
        assert_close(mean, naive_mean)
        assert_close(variance, naive_variance)


def test_degenerate_normalization():
    """The branches the article's traps rest on."""
    # A query-less prefetch scores every point 1.0, so std_dev is zero and the
    # whole leg flattens to 0.5 instead of contributing any ordering.
    assert list(distr_norm(np.ones(5, dtype=F32))) == [0.5] * 5
    assert list(distr_norm(np.array([0.9], dtype=F32))) == [0.5]
    assert len(distr_norm(np.empty(0, dtype=F32))) == 0
    # min_max_norm leaves a single element alone where distr_norm rewrites it.
    assert list(min_max_norm(np.array([0.9], dtype=F32))) == [0.9]
    assert list(min_max_norm(np.ones(3, dtype=F32))) == [0.5] * 3


def assert_close(a, b):
    tolerance = max(1e-5, 1e-4 * max(abs(float(a)), abs(float(b))))
    assert abs(float(a) - float(b)) <= tolerance, f"{a} not close to {b}"


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for test in tests:
        test()
        print(f"pass  {test.__name__}")
    print(f"\nGate A: {len(tests)}/{len(tests)} passed")
