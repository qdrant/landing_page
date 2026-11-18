#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["httpx==0.28.1"]
# ///

import argparse
import asyncio
import hashlib
import json
import math
import statistics
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import TypedDict, cast

import httpx

REPOSITORY = "elmoghany/Videos-Dataset-For-LLMs-RAG-That-Require-Audio-Vidoes-And-Text"
REVISION = "0ff2897e0124bf43fc61b6923fcd21d890f7d8ef"
ANNOTATION_PATH = "QA/3D-printing.json"
SOURCE_URL = (
    f"https://huggingface.co/datasets/{REPOSITORY}/resolve/{REVISION}/{ANNOTATION_PATH}"
)
SOURCE_SHA256 = "f5b301cfdc534899932d67143f5f8a3ae1a8c02758bf415fc77e3c473307ee2b"
SAMPLE_SIZE = 50


class Annotation(TypedDict):
    id: str
    timestamps: dict[str, list[list[float]]]


@dataclass(frozen=True)
class Interval:
    question_id: str
    source_file: str
    start_sec: float
    end_sec: float

    @property
    def duration(self) -> float:
        return self.end_sec - self.start_sec

    @property
    def key(self) -> str:
        return f"{self.source_file}:{self.start_sec:.6f}:{self.end_sec:.6f}"


@dataclass(frozen=True)
class WindowScore:
    interval_key: str
    best_single_window_iou: float
    fully_contained_in_one_window: bool
    minimum_windows_for_full_coverage: int


async def fetch_annotations() -> bytes:
    async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
        response = await client.get(SOURCE_URL)
        response.raise_for_status()
        return response.content


def select_intervals(data: bytes) -> tuple[list[Interval], dict[str, int]]:
    annotations = cast(list[Annotation], json.loads(data))
    unique: dict[str, Interval] = {}
    total = invalid = 0
    for annotation in sorted(annotations, key=lambda item: int(item["id"])):
        for source_file, pairs in sorted(annotation["timestamps"].items()):
            for start, end in pairs:
                total += 1
                if not (
                    math.isfinite(start) and math.isfinite(end) and 0 <= start < end
                ):
                    invalid += 1
                    continue
                interval = Interval(
                    annotation["id"], source_file, float(start), float(end)
                )
                unique.setdefault(interval.key, interval)
    ranked = sorted(
        unique.values(), key=lambda item: hashlib.sha256(item.key.encode()).hexdigest()
    )
    if len(ranked) < SAMPLE_SIZE:
        raise ValueError("The source contains fewer than 50 valid distinct intervals.")
    counts = {
        "qa_records_in_source": len(annotations),
        "interval_occurrences_in_source": total,
        "invalid_interval_occurrences": invalid,
        "valid_distinct_intervals": len(unique),
        "selected_intervals": SAMPLE_SIZE,
    }
    return ranked[:SAMPLE_SIZE], counts


def score_interval(interval: Interval, width: float, stride: float) -> WindowScore:
    # Only windows with positive intersection can maximize temporal IoU.
    first = max(0, math.floor((interval.start_sec - width) / stride) + 1)
    stop = math.ceil(interval.end_sec / stride)
    best_iou = 0.0
    contained = False
    for index in range(first, stop):
        start = index * stride
        end = start + width
        intersection = max(
            0.0, min(interval.end_sec, end) - max(interval.start_sec, start)
        )
        union = interval.duration + width - intersection
        best_iou = max(best_iou, intersection / union)
        contained |= start <= interval.start_sec and interval.end_sec <= end

    # The latest window starting before the uncovered point reaches furthest.
    cursor = interval.start_sec
    count = 0
    while cursor < interval.end_sec:
        cursor = math.floor(cursor / stride) * stride + width
        count += 1
    if (count == 1) != contained:
        raise AssertionError("Coverage count disagrees with single-window containment.")
    return WindowScore(interval.key, round(best_iou, 6), contained, count)


def summarize(
    intervals: list[Interval], width: float, overlap: float
) -> dict[str, object]:
    stride = width * (1 - overlap)
    scores = [score_interval(interval, width, stride) for interval in intervals]
    return {
        "window_seconds": width,
        "overlap_fraction": overlap,
        "stride_seconds": stride,
        "mean_best_single_window_iou": round(
            statistics.mean(item.best_single_window_iou for item in scores), 6
        ),
        "fully_contained_intervals": sum(
            item.fully_contained_in_one_window for item in scores
        ),
        "fully_contained_fraction": sum(
            item.fully_contained_in_one_window for item in scores
        )
        / len(scores),
        "mean_minimum_windows_for_full_coverage": statistics.mean(
            item.minimum_windows_for_full_coverage for item in scores
        ),
        "theoretical_long_run_window_seconds_multiplier": width / stride,
        "per_interval": [asdict(item) for item in scores],
    }


def experiment(data: bytes) -> dict[str, object]:
    checksum = hashlib.sha256(data).hexdigest()
    if checksum != SOURCE_SHA256:
        raise ValueError("The annotation bytes differ from the pinned source.")
    intervals, counts = select_intervals(data)
    return {
        "experiment": "AVHaystacks annotation-only oracle window coverage",
        "run_date": datetime.now(UTC).date().isoformat(),
        "source": {
            "repository": REPOSITORY,
            "revision": REVISION,
            "annotation_path": ANNOTATION_PATH,
            "download_url": SOURCE_URL,
            "sha256": checksum,
            "paper": "https://arxiv.org/abs/2506.07016",
            "media_downloaded": False,
            "source_durations_used": False,
            "terms_note": "Author dataset card states 'Google Youtube Fair Use License'; no media is redistributed here.",
        },
        "selection": {
            "rule": "Deduplicate (source_file, start, end); sort by SHA-256 of source_file:start_6dp:end_6dp; take the first 50. For duplicate intervals, retain the lowest numeric question ID.",
            "scope": "One topic: 3D printing. A deterministic smoke test, not a representative benchmark sample.",
            **counts,
            "distinct_sources_selected": len({item.source_file for item in intervals}),
            "min_evidence_seconds": min(item.duration for item in intervals),
            "median_evidence_seconds": statistics.median(
                item.duration for item in intervals
            ),
            "max_evidence_seconds": max(item.duration for item in intervals),
        },
        "method": {
            "grid": "Analytical windows [k * stride, k * stride + width], integer k >= 0, anchored at source time zero; no trimming at an unknown media end.",
            "iou": "Maximum intersection-over-union between the labeled interval and any single grid window.",
            "containment": "Whether at least one single grid window contains the complete labeled interval.",
            "coverage": "Minimum number of grid windows whose union covers the complete labeled interval, chosen with oracle access to that interval.",
            "overlap_cost": "Width / stride is a theoretical asymptotic multiplier for indexed window-seconds. It is not a measured corpus cost or duplicate-seconds total.",
            "limits": "No media, model, retrieval, ranking, answers, or acoustic boundaries are evaluated. Labels are used as supplied and may be approximate. Results cannot establish an optimal chunk size.",
        },
        "intervals": [{"interval_key": item.key, **asdict(item)} for item in intervals],
        "configurations": [
            summarize(intervals, width, overlap)
            for width in (10.0, 20.0, 40.0)
            for overlap in (0.0, 0.5)
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Measure fixed-window coverage of 50 real AVHaystacks evidence intervals; no media or models."
    )
    parser.add_argument(
        "--source",
        type=Path,
        help="Optional local copy of the exact pinned annotation JSON.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Destination for computed temporal-results.json.",
    )
    arguments = parser.parse_args()
    data = (
        arguments.source.read_bytes()
        if arguments.source
        else asyncio.run(fetch_annotations())
    )
    results = experiment(data)
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    arguments.output.write_text(json.dumps(results, indent=2) + "\n")
    print(
        json.dumps(
            {
                "selection": results["selection"],
                "configurations": [
                    {key: value for key, value in item.items() if key != "per_interval"}
                    for item in cast(list[dict[str, object]], results["configurations"])
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
