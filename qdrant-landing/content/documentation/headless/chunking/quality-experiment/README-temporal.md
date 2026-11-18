# Annotation-only temporal coverage check

This script measures how fixed windows cover 50 real timestamp annotations
from the authors' AVHaystacks release. It is an **oracle coverage calculation**:
the script already knows each reference interval and finds its best matching
window. It does not download audio or video, create embeddings, run a retriever,
generate answers, or measure model quality.

## Run

Requires uv. From the repository root:

```sh
./qdrant-landing/content/documentation/headless/chunking/quality-experiment/temporal.py \
  --output qdrant-landing/static/guides_data/chunking/quality-experiment/temporal-results.json
```

The executable uv script selects Python 3.12 and pins httpx to 0.28.1. Its
adjacent lockfile pins transitive dependencies. It downloads only the annotation
JSON and rejects it if its SHA-256 differs from the documented source. To avoid
downloading the annotation again, pass `--source /path/to/3D-printing.json`.

The output includes every selected interval and its individual scores. The
committed content-directory copy and the public static copy contain the same
results. After rerunning, synchronize the content copy:

```sh
cp qdrant-landing/static/guides_data/chunking/quality-experiment/temporal-results.json \
  qdrant-landing/content/documentation/headless/chunking/quality-experiment/temporal-results.json
```

## Source and selection

- Dataset: [AVHaystacks](https://schowdhury671.github.io/magnet_project/),
  [author-hosted annotation file](https://huggingface.co/datasets/elmoghany/Videos-Dataset-For-LLMs-RAG-That-Require-Audio-Vidoes-And-Text/blob/0ff2897e0124bf43fc61b6923fcd21d890f7d8ef/QA/3D-printing.json).
- Revision: `0ff2897e0124bf43fc61b6923fcd21d890f7d8ef`.
- Annotation SHA-256: `f5b301cfdc534899932d67143f5f8a3ae1a8c02758bf415fc77e3c473307ee2b`.
- Scope: one topic, 3D printing. The source has 100 QA records with 187 interval
  occurrences. All have finite, positive duration and nonnegative start times.
- Deduplicate by source filename, start, and end; retain the lowest numeric
  question ID for duplicates. This leaves 87 distinct intervals.
- Format each key as `source_file:start_6dp:end_6dp`, rank by the hexadecimal
  SHA-256 of that key, and select the first 50. No outcomes influence selection.
- The selected intervals refer to 14 source IDs, range from 4 to 847 seconds,
  and have a median duration of 93.5 seconds.

Each interval is scored independently, including when its original question
requires multiple intervals or videos. This is not a representative sample of
the full benchmark, a complete-question evaluation, or a confidence interval
for corpus-wide performance. Timestamps are used as supplied; their accuracy
against the media is not checked.

## Window model and metrics

The annotation file contains no full-video durations. The inspected topic
metadata CSV contains filenames only. The experiment therefore uses an
analytical grid anchored at source time zero:

`[k * stride, k * stride + width]`, for integer `k >= 0`.

Widths are 10, 20, and 40 seconds; stride is either the width or half the width.
Windows are not trimmed at an unknown video end. A final annotation endpoint
is not treated as a video duration. Consequently, these scores describe this
grid, not decoded clip files or a complete video's indexing cost. End trimming
could change temporal IoU in an implementation with known media durations.

- **Best single-window temporal IoU:** maximum intersection-over-union between
  the labeled interval and any single grid window. Report the mean across the
  50 intervals. This is not AVHaystacks' multi-video MTGS or retrieval Recall@k.
- **Contained in one window:** number of labeled intervals fully enclosed by
  at least one window. This does not establish that an actual retriever finds it.
- **Minimum covering windows:** fewest grid windows whose union covers the
  entire interval. The script chooses the furthest-reaching eligible window
  until coverage is complete. Report the mean across intervals.
- **Theoretical overlap cost:** `width / stride`, the asymptotic window-seconds
  multiplier when indexing every window of a long recording. It is 1x or 2x;
  no total duplicated seconds or embedding cost is claimed.

## Recorded result

Actual calculation on November 18, 2026:

| Window | Overlap | Mean best IoU | Contained in one window | Mean minimum covering windows |
|---|---|---|---|---|
| 10 s | 0% | 0.1583 | 1/50 (2%) | 12.02 |
| 10 s | 50% | 0.1601 | 1/50 (2%) | 11.78 |
| 20 s | 0% | 0.2740 | 2/50 (4%) | 6.48 |
| 20 s | 50% | 0.2861 | 3/50 (6%) | 6.28 |
| 40 s | 0% | 0.4059 | 3/50 (6%) | 3.74 |
| 40 s | 50% | 0.4345 | 6/50 (12%) | 3.50 |

Most selected evidence intervals are longer than the tested windows. Overlap
changes boundary placement but cannot fit an interval longer than the window
inside one chunk. The numbers describe coverage of these annotations; they
do not identify an optimal production chunk size or show an answer-quality
improvement.

## Verification and reuse

Ruff 0.17.5 formatting/linting and ty 0.0.105 type checking passed. An independent
brute-force intersection calculation and breadth-first minimum-cover search
matched all 300 interval/configuration scores.

```sh
uvx ruff==0.17.5 format --check qdrant-landing/content/documentation/headless/chunking/quality-experiment/temporal.py
uvx ruff==0.17.5 check qdrant-landing/content/documentation/headless/chunking/quality-experiment/temporal.py
uvx --with httpx==0.28.1 ty==0.0.105 check qdrant-landing/content/documentation/headless/chunking/quality-experiment/temporal.py
```

The [author dataset card](https://huggingface.co/datasets/elmoghany/Videos-Dataset-For-LLMs-RAG-That-Require-Audio-Vidoes-And-Text)
states "Google Youtube Fair Use License," which is not a clear permissive
license. This example redistributes no source media or question/answer text;
it records selected source IDs, numeric intervals, and computed metrics.
See the [MAGNET paper](https://arxiv.org/abs/2506.07016) for the benchmark's
construction and its retrieval, temporal-grounding, and answer metrics.
