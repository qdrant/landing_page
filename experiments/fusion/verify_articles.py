"""Check every number the five articles print against the artifact behind it.

Run after any re-measurement. A failure here means an article and its artifact
disagree, which is the one defect no reading pass reliably catches.
"""

from __future__ import annotations

import json
import statistics
import sys

import pandas as pd

from harness import RESULTS, ROOT, STUDY
from harness import replay

ARTICLES = {
    "audit": "before-tuning-a-qdrant-collection",
    "depth": "candidate-depth",
    "fusion": "how-to-tune-hybrid-search",
    "rerank": "when-a-reranker-is-worth-it",
    "memory": "when-your-collection-outgrows-ram",
}
CONTENT = ROOT.parent.parent / "qdrant-landing" / "content" / "articles"
CORPORA = ["scifact", "arguana", "wands", "codesearchnet", "dbpedia-entity"]

failures: list[str] = []
checks = 0
_text: dict[str, str] = {}


def article_text(key: str) -> str:
    if key not in _text:
        _text[key] = (CONTENT / f"{ARTICLES[key]}.md").read_text()
    return _text[key]


def check(label: str, printed, measured, tolerance: float = 5e-4):
    """Compare a figure against its artifact, and against the article file.

    Two directions, because either alone drifts. The value below has to match
    the artifact, and the article has to actually contain that value: editing
    one without the other is exactly the failure this catches.
    """
    global checks
    checks += 1
    if isinstance(printed, str) or isinstance(measured, str):
        ok = printed == measured
    else:
        ok = abs(float(printed) - float(measured)) <= tolerance
    if not ok:
        failures.append(f"{label}: expected {printed}, artifact says {measured}")
        return

    key = label.split(":")[0]
    if key not in ARTICLES or isinstance(printed, (bool, str)):
        return
    text = article_text(key)
    # Accept the value however the prose renders it: bare, signed, or as a
    # percentage, at the precision it was written to.
    decimals = len(str(printed).split(".")[1]) if "." in str(printed) else 0
    forms = {f"{printed:.{decimals}f}", f"{abs(printed):.{decimals}f}"}
    if decimals:
        forms |= {f"{printed:+.{decimals}f}", f"{abs(printed) * 100:g}%"}
    else:
        forms |= {str(int(printed)), f"{int(printed):,}"}
    if not any(form in text for form in forms):
        failures.append(f"{label}: artifact agrees but {ARTICLES[key]}.md does not contain {printed}")


def load(name: str) -> dict:
    return json.loads((STUDY / f"{name}.json").read_text())


# ------------------------------------------------- the audit article: E1 and E2
e2 = load("e2_labeled_set_size")["across_corpora"]
for size, printed in (("25", 0.047), ("50", 0.035), ("100", 0.025), ("200", 0.018), ("300", 0.015)):
    check(f"audit: half-width at n={size}", printed, e2[size]["median_half_width"])

e1 = load("e1_held_out")
kept = [v["gain_kept_on_held_out"] for v in e1.values()]
check("audit: gain kept, low", 0.67, min(kept), tolerance=0.005)
check("audit: gain kept, high", 0.95, max(kept), tolerance=0.005)
ranks = [v["median_held_out_rank"] for v in e1.values()]
check("audit: held-out rank low", 1, min(ranks), tolerance=0.01)
check("audit: held-out rank high", 4, max(ranks), tolerance=0.01)
hurts = [v["hurts_on_held_out_share"] for v in e1.values()]
check("audit: hurts share high", 0.06, max(hurts), tolerance=0.005)
check("audit: arms ranked", 30, e1["scifact"]["arms_ranked"], tolerance=0)

# ----------------------------- dense against sparse against fused: E5, in fusion
e5 = load("e5_second_prefetch")
printed_alone = {
    "scifact": (0.6239, 0.6886, 0.7175, 0.0289),
    "arguana": (0.4905, 0.4224, 0.5216, 0.0311),
    "wands": (0.6921, 0.7098, 0.7254, 0.0156),
    "codesearchnet": (0.6299, 0.5126, 0.6555, 0.0256),
    "dbpedia-entity": (0.4677, 0.3857, 0.4638, -0.0039),
}
for name, (dense, sparse, fused, delta) in printed_alone.items():
    n = e5[name]["ndcg_10"]
    check(f"fusion: {name} dense alone", dense, n["dense_only"])
    check(f"fusion: {name} sparse alone", sparse, n["sparse_only"])
    check(f"fusion: {name} fused", fused, n["default"])
    check(f"fusion: {name} over better one", delta, n["default"] - n["best_single_prefetch"])

# ------------------------------------------------- the depth article: E3 and E6
e3 = load("e3_breadth")
printed_depth_change = {
    "scifact": (0.103, 0.008),
    "arguana": (0.121, 0.002),
    "wands": (0.124, 0.007),
    "codesearchnet": (0.149, 0.010),
    "dbpedia-entity": (0.282, 0.003),
}
for name, (best_possible, current) in printed_depth_change.items():
    s = e3[name]["settings"]
    check(
        f"depth: {name} best possible score change",
        best_possible,
        s["ef128_depth500"]["ceiling_ndcg_10"] - s["ef128_depth10"]["ceiling_ndcg_10"],
        tolerance=0.001,
    )
    check(
        f"depth: {name} current score change",
        current,
        s["ef128_depth500"]["default_ndcg_10"] - s["ef128_depth10"]["default_ndcg_10"],
        tolerance=0.001,
    )
check(
    "depth: hnsw_ef quality span max",
    0.0022,
    max(v["hnsw_ef_sweep"]["default_span"]["span"] for v in e3.values()),
    tolerance=5e-5,
)
check(
    "depth: hnsw_ef recall span max",
    0.0040,
    max(v["hnsw_ef_sweep"]["recall_span"]["span"] for v in e3.values()),
    tolerance=5e-5,
)

e6 = load("e6_quantization")
for name in ("scifact", "dbpedia-entity"):
    v = e6[name]["verdicts"]
    check(f"depth: {name} best k holds under quantization", True, v["best_k_holds"])
    check(f"depth: {name} dbsf verdict holds", True, v["dbsf_beats_default_holds"])
    worst = max(abs(x) for x in v["default_ndcg_10_cost"].values())
    if worst > 0.0002 + 1e-9:
        failures.append(f"depth: {name} quantization moved fused nDCG by {worst}, article says at most 0.0002")
    checks += 1
check("depth: raw top-10 agreement", 0.984, e6["scifact"]["arms"]["raw"]["dense_agreement"]["top10_overlap"])

gaps = [v["settings"]["ef128_depth200"]["gap_to_ceiling"] for v in e3.values()]
check("rerank: headroom at depth 200, low", 0.247, min(gaps))
check("rerank: headroom at depth 200, high", 0.487, max(gaps))

lat = load("e3_latency")["per_corpus"]
# The hnsw_ef latency cost the depth article quotes as "4% to 49%".
ef_cost = []
for v in lat.values():
    s = v["settings"]
    low, high = s["fused_ef16_depth200"]["median_ms"], s["fused_ef512_depth200"]["median_ms"]
    ef_cost.append(100 * (high - low) / low)
check("depth: hnsw_ef latency cost, low", 4, min(ef_cost), tolerance=0.5)
check("depth: hnsw_ef latency cost, high", 49, max(ef_cost), tolerance=0.5)

depth_cost = []
for v in lat.values():
    s = v["settings"]
    low, high = s["fused_ef128_depth10"]["median_ms"], s["fused_ef128_depth500"]["median_ms"]
    depth_cost.append(100 * (high - low) / low)
check("depth: candidate-depth latency cost, low", 37, min(depth_cost), tolerance=0.5)
check("depth: candidate-depth latency cost, high", 43, max(depth_cost), tolerance=0.5)

# The same span read from the other end, which is what a reader cutting depth
# back from 500 gets. The article quotes it as "27% to 30%".
depth_saving = []
for v in lat.values():
    s = v["settings"]
    low, high = s["fused_ef128_depth10"]["median_ms"], s["fused_ef128_depth500"]["median_ms"]
    depth_saving.append(100 * (high - low) / high)
check("depth: depth cut latency saving, low", 27, min(depth_saving), tolerance=0.5)
check("depth: depth cut latency saving, high", 30, max(depth_saving), tolerance=0.5)

# What the second prefetch adds over running the dense one alone, quoted in both
# the fusion article and the audit article's cost-order table.
second_prefetch_ms = [
    v["settings"]["fused_ef128_depth200"]["median_ms"] - v["settings"]["dense_only_ef128_depth200"]["median_ms"]
    for v in lat.values()
]
check("audit: second prefetch latency, low", 0.6, min(second_prefetch_ms), tolerance=0.05)
check("audit: second prefetch latency, high", 1.5, max(second_prefetch_ms), tolerance=0.05)

# The fusion article prints the same cost per corpus, as a column beside the
# relevance gain the second prefetch buys.
for name, printed in (
    ("scifact", 0.73), ("arguana", 1.47), ("wands", 0.60),
    ("codesearchnet", 0.68), ("dbpedia-entity", 0.64),
):
    s = lat[name]["settings"]
    cost = s["fused_ef128_depth200"]["median_ms"] - s["dense_only_ef128_depth200"]["median_ms"]
    check(f"fusion: {name} second prefetch cost", printed, cost, tolerance=0.005)

# ------------------------------------------------ the fusion article: the k grid
printed_k = {
    "arguana": {1: 0.517, 2: 0.522, 5: 0.530, 20: 0.527, 61: 0.521, "dbsf": 0.517},
    "codesearchnet": {1: 0.650, 2: 0.656, 5: 0.658, 20: 0.651, 61: 0.626, "dbsf": 0.672},
    "scifact": {1: 0.712, 2: 0.717, 5: 0.715, 20: 0.712, 61: 0.707, "dbsf": 0.732},
    "dbpedia-entity": {1: 0.462, 2: 0.464, 5: 0.464, 20: 0.468, 61: 0.461, "dbsf": 0.482},
    "wands": {1: 0.723, 2: 0.725, 5: 0.734, 20: 0.757, 61: 0.761, "dbsf": 0.764},
}
for name, row in printed_k.items():
    frame = pd.read_parquet(RESULTS / f"{name}.parquet")
    frame = frame[(frame["metric"] == "ndcg_cut_10") & (frame["build"] == 1)]
    mean = frame.groupby("arm")["value"].mean()
    for key, printed in row.items():
        arm = "dbsf" if key == "dbsf" else f"rrf_k{key}_w1-1"
        check(f"fusion: {name} {arm}", printed, mean[arm])

# ------------------------------------------- the fusion article: the weight sweep
# The best pair at each corpus's best equal-weight k, against equal weights at
# that same k, which is the comparison the article's weighting paragraph makes.
printed_weights = {
    "codesearchnet": ("rrf_k5_w2-1", 0.0096),
    "dbpedia-entity": ("rrf_k20_w1-3", 0.0060),
    "arguana": ("rrf_k5_w2-4", 0.0029),
}
for name, (arm, gain) in printed_weights.items():
    frame = pd.read_parquet(RESULTS / f"{name}.parquet")
    frame = frame[(frame["metric"] == "ndcg_cut_10") & (frame["build"] == 1)]
    mean = frame.groupby("arm")["value"].mean()
    equal = f"rrf_{arm.split('_')[1]}_w1-1"
    check(f"fusion: {name} best weight pair gain", gain, mean[arm] - mean[equal])

# Equal weights win outright at the best k on these two, which is why the
# article tells the reader to set k before touching the pair.
for name in ("scifact", "wands"):
    frame = pd.read_parquet(RESULTS / f"{name}.parquet")
    frame = frame[(frame["metric"] == "ndcg_cut_10") & (frame["build"] == 1)]
    mean = frame.groupby("arm")["value"].mean()
    equal = mean[[a for a in mean.index if a.startswith("rrf") and a.endswith("w1-1")]]
    best_k = equal.idxmax().split("_")[1]
    same_k = mean[[a for a in mean.index if a.startswith(f"rrf_{best_k}_")]]
    check(f"fusion: {name} equal weights win at best k", True, same_k.idxmax().endswith("w1-1"))

# The WANDS pair that wins at k=5 and loses once k=61 is selected.
frame = pd.read_parquet(RESULTS / "wands.parquet")
frame = frame[(frame["metric"] == "ndcg_cut_10") & (frame["build"] == 1)]
mean = frame.groupby("arm")["value"].mean()
check("fusion: wands k61 equal weights", 0.7614, mean["rrf_k61_w1-1"])
check("fusion: wands k61 pair 2-4", 0.7567, mean["rrf_k61_w2-4"])

# The decay ratios the k-sweep paragraph quotes, rank 1 against rank 10 at
# zero-based positions, which is 1 / (pos + k).
for k, printed in ((5, 2.80), (20, 1.45)):
    check(f"fusion: rank 1 over rank 10 at k={k}", printed, (9 + k) / k, tolerance=0.005)

# ------------------------------------------------ the reranking article: E4
e4 = load("e4_reranking")
printed_baselines = {
    "scifact": (0.057, 0.033, 0.37),
    "arguana": (0.031, 0.017, 0.025),
    "wands": (0.039, -0.008, 0.0),
    "codesearchnet": (0.169, 0.135, 1.0),
    "dbpedia-entity": (0.137, 0.115, 1.0),
}
for name, (vs_default, vs_fusion, clears) in printed_baselines.items():
    cfg = e4[name]["configurations"]
    check(f"rerank: {name} best vs default", vs_default, max(v["vs_rrf_default"] for v in cfg.values()))
    check(f"rerank: {name} best vs tuned fusion", vs_fusion, max(v["vs_best_fusion_arm"] for v in cfg.values()))
    check(
        f"rerank: {name} held-out baseline",
        "split_selected_fusion_arm",
        e4[name]["held_out"]["baseline"],
    )
    check(f"rerank: {name} clears share", clears, e4[name]["held_out"]["clears_share"], tolerance=0.001)


def best_at(name: str, count: int) -> float:
    cfg = e4[name]["configurations"]
    return max(v["vs_best_fusion_arm"] for k, v in cfg.items() if k.endswith(f"@{count}"))


# The candidate-count figure's gloss: DBPedia flattens by 50, and no loss at 10
# ever reversed by 200 for any model.
check("rerank: dbpedia-entity best at 50", 0.111, best_at("dbpedia-entity", 50))
check("rerank: dbpedia-entity best at 200", 0.115, best_at("dbpedia-entity", 200))
check(
    "rerank: dbpedia-entity gain from 50 to 200",
    0.003,
    best_at("dbpedia-entity", 200) - best_at("dbpedia-entity", 50),
)
reversed_losses = 0
for name in CORPORA:
    cfg = e4[name]["configurations"]
    for model in {k.split("@")[0] for k in cfg}:
        at10 = cfg[f"{model}@10"]["vs_best_fusion_arm"]
        at200 = cfg[f"{model}@200"]["vs_best_fusion_arm"]
        reversed_losses += at10 < 0 and at200 > 0
check("rerank: losses at 10 that reversed by 200", True, reversed_losses == 0)

# The model-fit claims: the three 512-token models lose on four of five corpora,
# and the swap turns CodeSearchNet from a 0.032 loss into a 0.135 held-out win.
OLDER = ("ms-marco-MiniLM-L-6-v2", "ms-marco-MiniLM-L-12-v2", "bge-reranker-base")
older_losses = sum(
    max(
        v["vs_best_fusion_arm"]
        for k, v in e4[name]["configurations"].items()
        if k.split("@")[0] in OLDER
    )
    < 0
    for name in CORPORA
)
check("rerank: corpora where every 512-token model loses", True, older_losses == 4)
check(
    "rerank: codesearchnet older-model best vs fusion",
    -0.032,
    max(
        v["vs_best_fusion_arm"]
        for k, v in e4["codesearchnet"]["configurations"].items()
        if k.split("@")[0] in OLDER
    ),
)
check(
    "rerank: codesearchnet jina held-out gain",
    0.135,
    e4["codesearchnet"]["held_out"]["median_held_out_gain"],
)

# The gap-recovery paragraph and the intro's gap range, from the depth artifact.
e3_gaps = load("e3_breadth")
gaps = {name: e3_gaps[name]["settings"]["ef128_depth200"]["gap_to_ceiling"] for name in CORPORA}
check("rerank: codesearchnet gap at depth 200", 0.293, gaps["codesearchnet"])
check("rerank: dbpedia-entity gap at depth 200", 0.487, gaps["dbpedia-entity"])
check("rerank: gap range low", 0.247, min(gaps.values()))
check("rerank: gap range high", 0.487, max(gaps.values()))

# The worked example: the Lennon page sat at fused rank 49 and reranked first.
lennon = pd.read_parquet(STUDY / "rerank" / "dbpedia-entity__jina-reranker-v2-base-multilingual.parquet")
lennon = lennon[lennon["query_id"] == "INEX_LD-2012311"].sort_values("score", ascending=False)
check("rerank: lennon fused rank", 49, int(lennon[lennon["point_id"] == 10310]["fusion_rank"].iloc[0]) + 1)
check("rerank: lennon reranked first", True, int(lennon.iloc[0]["point_id"]) == 10310)

throughput = json.loads((STUDY / "rerank" / "throughput.json").read_text())
for model, (lo, hi) in {
    "ms-marco-MiniLM-L-6-v2": (64, 212),
    "ms-marco-MiniLM-L-12-v2": (34, 117),
    "bge-reranker-base": (16, 45),
}.items():
    rates = [v["docs_per_second"] for k, v in throughput.items() if k.endswith(model)]
    check(f"rerank: {model} slowest", lo, min(rates), tolerance=1.0)
    check(f"rerank: {model} fastest", hi, max(rates), tolerance=1.0)

# jina-v2's quality scores came from PyTorch on MPS (its ONNX export is
# single-threaded on CPU); throughput_mps.json holds the rates from that run.
# The 10-candidate figures derive from the smallest CPU model's range.
mps = json.loads((STUDY / "rerank" / "throughput_mps.json").read_text())
mps_rates = [v["docs_per_second"] for v in mps.values()]
check("rerank: jina MPS slowest", 32, min(mps_rates), tolerance=1.0)
check("rerank: jina MPS fastest", 310, max(mps_rates), tolerance=1.0)
check("rerank: 10-candidate test fastest ms", 47, 10_000 / 212, tolerance=1.0)
check("rerank: 10-candidate test slowest ms", 156, 10_000 / 64, tolerance=1.0)

# --------------------------------------------- the memory article: E7a and E7b
E7 = ROOT / "e7"
e7 = lambda name: json.loads((E7 / name).read_text())

split = e7("cells.json")["e7a"]["query_split"]
e7a = {(c["storage"], c["rescore"], c["oversampling"]): c for c in e7("results/e7a.json")["cells"]}


def reported(cell, key):
    """The reporting half, which is the half every published quality figure
    comes from. Selection ran on the other one."""
    rows = [cell["per_query"][q][key] for q in split["report"] if q in cell["per_query"]]
    return sum(rows) / len(rows)


printed_quality = {
    ("turbo_bits4", False, None): (0.3218, 0.918),
    ("turbo_bits4", True, 4.0): (0.3238, 0.993),
    ("turbo_bits1", False, None): (0.2786, 0.605),
    ("turbo_bits1", True, 1.0): (0.3114, 0.951),
    ("turbo_bits1", True, 2.0): (0.3128, 0.977),
    ("turbo_bits1", True, 4.0): (0.3178, 0.988),
}
for key, (ndcg, retention) in printed_quality.items():
    label = f"{key[0]} rescore={key[1]} x{key[2]}"
    check(f"memory: {label} nDCG@10", ndcg, reported(e7a[key], "ndcg_cut_10"))
    check(f"memory: {label} retention", retention, reported(e7a[key], "retention"), tolerance=5e-4)

# The float32 row comes from `e7a_float32.json`, not from `e7a.json`, whose
# float32 cell measured int8 without rescoring.
base = e7("results/e7a_float32.json")
check("memory: float32 nDCG@10", 0.3103, reported(base, "ndcg_cut_10"))
check("memory: float32 retention", 0.957, reported(base, "retention"), tolerance=5e-4)
check("memory: graph loss against exact", 4, 100 * (1 - reported(base, "retention")), tolerance=0.5)

decision = e7("results/decision.json")["selected"]
check("memory: selected storage class", "turbo_bits1", decision["storage"])
check("memory: selected oversampling", 1, decision["oversampling"], tolerance=0)
check("memory: held-out gap", -0.0011, decision["held_out_ndcg_gap"], tolerance=5e-5)
check("memory: held-out retention gap", 0.006, decision["held_out_retention_gap"], tolerance=6e-4)
check("memory: interval low", -0.003, decision["paired_ndcg_difference"]["low"], tolerance=5e-4)
check("memory: interval high", 0.005, decision["paired_ndcg_difference"]["high"], tolerance=5e-4)
check("memory: cleared on the reporting half", True, decision["clears_on_report"])

sizes = e7("memory-e7a-turbo_bits1.json")["resident"]["on_disk_bytes"]
check("memory: original vectors GB", 7.121, sizes["originals"] / 1e9, tolerance=5e-4)
check("memory: bits1 copy GB", 0.260, sizes["quantized"] / 1e9, tolerance=5e-4)
check("memory: documents", 4635922, e7("corpus.json")["docs"], tolerance=0)
# E7b publishes only the runs whose block reads agree with their cell's median,
# so the article's latency table is rebuilt here through the same gate.
verdicts = {(r["name"], r["round"]): r["verdict"] for r in e7("results/e7b_check.json")["runs"]}
reads = {(r["name"], r["round"]): r["bytes_read"] for r in e7("results/e7b_check.json")["runs"]}
kept: dict[str, list] = {}
for run in e7("results/e7b.json")["runs"]:
    ref = (run["name"], run["round"])
    if verdicts[ref] == "consistent":
        kept.setdefault(run["name"], []).append((run["latency_ms"]["p50"], reads[ref], run))

printed_latency = {
    "fits-cached_pinned-rescoreFalse": (5, 3.8, 3.1, 4.3, 0.30),
    "fits-cached_pinned-rescoreTrue": (2, 4.1, 3.8, 4.3, 0.52),
    "exceeds-cached_pinned-rescoreFalse": (3, 4.3, 4.0, 4.3, 0.30),
    "exceeds-cached_pinned-rescoreTrue": (4, 43.4, 42.7, 47.3, 2.98),
    "exceeds-cold_cached-rescoreTrue": (3, 45.7, 42.8, 52.8, 3.02),
    "exceeds-cold_pinned-rescoreTrue": (3, 52.0, 43.8, 56.1, 3.50),
}
for name, (runs, p50, low, high, read_gb) in printed_latency.items():
    rows = kept[name]
    latencies = [row[0] for row in rows]
    check(f"memory: {name} runs", runs, len(rows), tolerance=0)
    check(f"memory: {name} p50", p50, statistics.median(latencies), tolerance=0.05)
    check(f"memory: {name} fastest", low, min(latencies), tolerance=0.05)
    check(f"memory: {name} slowest", high, max(latencies), tolerance=0.05)
    read = statistics.median(row[1] for row in rows) / 1e9
    check(f"memory: {name} GB read", read_gb, read, tolerance=0.005)

check("memory: runs total", 30, e7("results/e7b_check.json")["total"], tolerance=0)
check("memory: runs kept", 20, e7("results/e7b_check.json")["consistent"], tolerance=0)

# The two cache readings the article quotes as the mechanism behind the gap.
def cgroup_stat(run, field, when):
    reading = run[f"memory_{when}"]["cgroup"]["memory.stat"]
    return int(dict(line.split(" ") for line in reading.split("\n"))[field])


def median_delta(name, field):
    """The change across the measured window. The counters run from container
    boot, so the raw `after` value also carries the load and the warm-up pass."""
    return statistics.median(
        cgroup_stat(row[2], field, "after") - cgroup_stat(row[2], field, "before")
        for row in kept[name]
    )


tight, roomy = "exceeds-cached_pinned-rescoreTrue", "fits-cached_pinned-rescoreTrue"
check("memory: refault rise under the tight limit", 613388, median_delta(tight, "workingset_refault_file"), tolerance=0.5)
check("memory: refault rise under the roomy limit", 0, median_delta(roomy, "workingset_refault_file"), tolerance=0)
check(
    "memory: file cache at the end of the roomy pass GB",
    9.46,
    statistics.median(cgroup_stat(row[2], "file", "after") for row in kept[roomy]) / 1e9,
    tolerance=0.005,
)

check("memory: rounds per cell", 5, 1 + max(r["round"] for r in e7("results/e7b.json")["runs"]), tolerance=0)

verdict_counts: dict[str, int] = {}
for run in e7("results/e7b_check.json")["runs"]:
    verdict_counts[run["verdict"]] = verdict_counts.get(run["verdict"], 0) + 1
check("memory: runs whose reads disagreed", 8, verdict_counts["reads disagree with siblings, cache was not cold"], tolerance=0)
check("memory: runs whose counter reset", 2, verdict_counts["counter reset, unusable"], tolerance=0)

# The article rounds this to three and a half minutes, so only the artifact side
# is checked here.
check("apply: bits1 seconds", 210.1, e7a[("turbo_bits1", True, 1.0)]["apply_seconds"], tolerance=0.05)
ingest = e7("ingest.json")
check(
    "memory: upload and index minutes",
    21,
    (ingest["upload_seconds"] + ingest["index_seconds"]) / 60,
    tolerance=0.5,
)

# ---------------------------------------------------------------------- verdict
print(f"{checks} numbers checked against artifacts")
if failures:
    print(f"\n{len(failures)} MISMATCH:")
    for line in failures:
        print(f"  {line}")
    sys.exit(1)
print("every figure in the five articles matches its artifact")
