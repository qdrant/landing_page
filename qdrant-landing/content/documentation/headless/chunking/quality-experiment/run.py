#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = [
#   "httpx==0.28.1",
#   "numpy==2.2.6",
#   "qdrant-client==1.20.0",
#   "sentence-transformers==6.1.0",
#   "torch==2.15.0",
#   "transformers==5.20.1",
# ]
# ///

import argparse
import asyncio
import bisect
import csv
import hashlib
import importlib.metadata
import io
import json
import platform
import re
import statistics
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from itertools import pairwise
from pathlib import Path
from typing import Literal, TypedDict, cast

import httpx
import numpy as np
import torch
from numpy.typing import NDArray
from qdrant_client import AsyncQdrantClient, models
from sentence_transformers import SentenceTransformer
from transformers import PreTrainedTokenizerFast

DATA_REVISION = "e708410d1c61cb76a85cd9d433630ef89b9c6b85"
DATA_BASE = (
    "https://raw.githubusercontent.com/brandonstarxel/chunking_evaluation/"
    f"{DATA_REVISION}/chunking_evaluation/evaluation_framework/general_evaluation_data"
)
MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
MODEL_REVISION = "1110a243fdf4706b3f48f1d95db1a4f5529b4d41"
IMAGE = "qdrant/qdrant@sha256:9bfc89f9914fc14876a88c05270685921a55b8877b254a98bcc1cc2f0a424cd2"
CORPUS_ID = "state_of_the_union"
BUDGET = 512
SEMANTIC_THRESHOLD = 0.5
SENTENCE_PATTERN = r"(?<=[.!?])\s+|\n+"
Method = Literal["fixed", "sentence", "recursive", "semantic"]
Span = tuple[int, int]


@dataclass(frozen=True)
class Configuration:
    name: str
    method: Method
    cap: int
    overlap: int = 0


CONFIGURATIONS = [
    Configuration("fixed_64_0", "fixed", 64),
    Configuration("fixed_128_0", "fixed", 128),
    Configuration("fixed_128_32", "fixed", 128, 32),
    Configuration("fixed_192_0", "fixed", 192),
    Configuration("sentence_128_0", "sentence", 128),
    Configuration("recursive_128_0", "recursive", 128),
    Configuration("semantic_128_0", "semantic", 128),
]


class Reference(TypedDict):
    content: str
    start_index: int
    end_index: int


@dataclass(frozen=True)
class Question:
    id: str
    csv_row: int
    question: str
    references: list[Reference]
    gold_tokens: frozenset[int]


@dataclass(frozen=True)
class Chunk:
    id: int
    token_start: int
    token_end: int
    char_start: int
    char_end: int
    content_tokens: int
    text: str

    @property
    def source_tokens(self) -> int:
        return self.token_end - self.token_start


class Scores(TypedDict):
    recall: float
    precision: float
    iou: float
    duplicate_fraction: float
    source_tokens: int
    content_tokens: int
    unique_source_tokens: int
    relevant_tokens: int
    gold_tokens: int
    full_evidence: bool


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


async def download_inputs(output: Path) -> dict[str, dict[str, str | int]]:
    urls = {
        "state_of_the_union.md": f"{DATA_BASE}/corpora/state_of_the_union.md",
        "questions_df.csv": f"{DATA_BASE}/questions_df.csv",
        "LICENSE": (
            "https://raw.githubusercontent.com/brandonstarxel/chunking_evaluation/"
            f"{DATA_REVISION}/LICENSE"
        ),
    }
    manifest: dict[str, dict[str, str | int]] = {}
    async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
        for name, url in urls.items():
            response = await client.get(url)
            response.raise_for_status()
            content = response.content
            (output / name).write_bytes(content)
            manifest[name] = {
                "url": url,
                "sha256": sha256(content),
                "bytes": len(content),
            }
    return manifest


def token_offsets(text: str, tokenizer: PreTrainedTokenizerFast) -> list[Span]:
    result = tokenizer(
        text,
        add_special_tokens=False,
        return_offsets_mapping=True,
        truncation=False,
        verbose=False,
    )
    return cast(list[Span], result["offset_mapping"])


def content_length(text: str, tokenizer: PreTrainedTokenizerFast) -> int:
    return len(tokenizer.encode(text, add_special_tokens=False, truncation=False))


def load_questions(path: Path, source: str, offsets: list[Span]) -> list[Question]:
    questions = []
    for row_number, row in enumerate(csv.DictReader(io.StringIO(path.read_text()))):
        if row["corpus_id"] != CORPUS_ID:
            continue
        references = cast(list[Reference], json.loads(row["references"]))
        gold: set[int] = set()
        for ref in references:
            start, end = ref["start_index"], ref["end_index"]
            assert source[start:end] == ref["content"], (row_number, ref)
            gold.update(i for i, (a, b) in enumerate(offsets) if a < end and b > start)
        assert gold
        questions.append(
            Question(
                f"sotu-{row_number:03d}",
                row_number,
                row["question"],
                references,
                frozenset(gold),
            )
        )
    assert len(questions) == 76
    assert sum(len(question.references) for question in questions) == 95
    return questions


def spans_at_boundaries(source: str, offsets: list[Span], pattern: str) -> list[Span]:
    starts = [a for a, _ in offsets]
    boundaries = {0, len(offsets)}
    boundaries.update(
        bisect.bisect_left(starts, match.end())
        for match in re.finditer(pattern, source)
    )
    ordered = sorted(boundaries)
    return list(pairwise(ordered))


def hard_split(span: Span, cap: int) -> list[Span]:
    start, end = span
    return [(i, min(i + cap, end)) for i in range(start, end, cap)]


def pack_units(
    units: list[Span], cap: int, similarities: list[float] | None = None
) -> list[Span]:
    start, end = units[0]
    packed = []
    for i, (next_start, next_end) in enumerate(units[1:]):
        assert next_start == end
        topic_break = similarities is not None and similarities[i] < SEMANTIC_THRESHOLD
        if next_end - start > cap or topic_break:
            packed.append((start, end))
            start = next_start
        end = next_end
    return [*packed, (start, end)]


def span_text(source: str, offsets: list[Span], span: Span) -> str:
    return source[offsets[span[0]][0] : offsets[span[1] - 1][1]]


def encode(model: SentenceTransformer, texts: list[str]) -> NDArray[np.float32]:
    tokenizer = cast(PreTrainedTokenizerFast, model.tokenizer)
    special = tokenizer.num_special_tokens_to_add(pair=False)
    limit = model.max_seq_length
    assert isinstance(limit, int)
    assert all(content_length(text, tokenizer) + special <= limit for text in texts)
    vectors = model.encode(
        texts,
        batch_size=32,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )
    result = np.asarray(vectors, dtype=np.float32)
    assert np.isfinite(result).all()
    assert np.allclose(np.linalg.norm(result, axis=1), 1.0, atol=1e-5)
    return result


def split_source(
    source: str, offsets: list[Span], config: Configuration, model: SentenceTransformer
) -> tuple[list[Span], float, list[float]]:
    if config.method == "fixed":
        stride = config.cap - config.overlap
        return (
            [
                (i, min(i + config.cap, len(offsets)))
                for i in range(0, len(offsets), stride)
            ],
            0.0,
            [],
        )
    sentences = spans_at_boundaries(source, offsets, SENTENCE_PATTERN)
    units = [part for span in sentences for part in hard_split(span, config.cap)]
    if config.method == "sentence":
        return pack_units(units, config.cap), 0.0, []
    if config.method == "recursive":
        paragraphs = spans_at_boundaries(source, offsets, r"\n\s*\n")
        units = []
        for start, end in paragraphs:
            if end - start <= config.cap:
                units.append((start, end))
            else:
                for a, b in sentences:
                    if a < end and b > start:
                        units.extend(
                            hard_split((max(a, start), min(b, end)), config.cap)
                        )
        return pack_units(units, config.cap), 0.0, []
    inference_start = time.perf_counter()
    vectors = encode(model, [span_text(source, offsets, span) for span in units])
    inference_seconds = time.perf_counter() - inference_start
    similarities = np.sum(vectors[:-1] * vectors[1:], axis=1).astype(float).tolist()
    return pack_units(units, config.cap, similarities), inference_seconds, similarities


def make_chunks(
    source: str,
    offsets: list[Span],
    spans: list[Span],
    tokenizer: PreTrainedTokenizerFast,
) -> list[Chunk]:
    chunks = []
    for i, (start, end) in enumerate(spans):
        a, b = offsets[start][0], offsets[end - 1][1]
        text = source[a:b]
        chunks.append(Chunk(i, start, end, a, b, content_length(text, tokenizer), text))
    covered_tokens = {
        i for chunk in chunks for i in range(chunk.token_start, chunk.token_end)
    }
    assert covered_tokens == set(range(len(offsets)))
    covered_chars = bytearray(len(source))
    for chunk in chunks:
        covered_chars[chunk.char_start : chunk.char_end] = b"\1" * (
            chunk.char_end - chunk.char_start
        )
    assert all(
        covered_chars[i] or character.isspace() for i, character in enumerate(source)
    )
    return chunks


def score_selection(question: Question, chunks: list[Chunk]) -> Scores:
    positions = {
        i for chunk in chunks for i in range(chunk.token_start, chunk.token_end)
    }
    total = sum(chunk.source_tokens for chunk in chunks)
    content = sum(chunk.content_tokens for chunk in chunks)
    relevant = len(question.gold_tokens & positions)
    gold = len(question.gold_tokens)
    assert 0 < content <= BUDGET
    return {
        "recall": relevant / gold,
        "precision": relevant / total,
        "iou": relevant / (total + gold - relevant),
        "duplicate_fraction": (total - len(positions)) / total,
        "source_tokens": total,
        "content_tokens": content,
        "unique_source_tokens": len(positions),
        "relevant_tokens": relevant,
        "gold_tokens": gold,
        "full_evidence": relevant == gold,
    }


async def retrieve_one(
    client: AsyncQdrantClient,
    collection: str,
    question: Question,
    vector: list[float],
    chunks: list[Chunk],
    semaphore: asyncio.Semaphore,
) -> dict[str, object]:
    async with semaphore:
        response = await client.query_points(
            collection_name=collection,
            query=vector,
            limit=len(chunks),
            search_params=models.SearchParams(exact=True),
            with_payload=False,
            with_vectors=False,
        )
    ranked = sorted(response.points, key=lambda point: (-point.score, int(point.id)))
    assert len(ranked) == len(chunks)
    selected: list[Chunk] = []
    selected_details: list[dict[str, int | float]] = []
    skipped: list[int] = []
    used = 0
    for rank, point in enumerate(ranked, start=1):
        chunk = chunks[int(point.id)]
        if used + chunk.content_tokens > BUDGET:
            skipped.append(chunk.id)
            continue
        selected.append(chunk)
        selected_details.append(
            {
                "chunk_id": chunk.id,
                "rank": rank,
                "cosine_score": point.score,
                "char_start": chunk.char_start,
                "char_end": chunk.char_end,
                "token_start": chunk.token_start,
                "token_end": chunk.token_end,
                "content_tokens": chunk.content_tokens,
            }
        )
        used += chunk.content_tokens
        if used == BUDGET:
            break
    return {
        "question_id": question.id,
        "question": question.question,
        "references": question.references,
        "gold_token_positions": sorted(question.gold_tokens),
        "selected_chunks": selected_details,
        "skipped_chunk_ids": skipped,
        "scores": score_selection(question, selected),
    }


def summarize(results: list[dict[str, object]]) -> dict[str, float]:
    scores = [cast(Scores, result["scores"]) for result in results]
    keys = [
        "recall",
        "precision",
        "iou",
        "duplicate_fraction",
        "source_tokens",
        "content_tokens",
        "full_evidence",
    ]
    summary = {}
    for key in keys:
        values = [float(cast(dict[str, float], score)[key]) for score in scores]
        summary[f"mean_{key}"] = statistics.mean(values)
        summary[f"std_{key}"] = statistics.pstdev(values)
    return summary


async def run_configuration(
    client: AsyncQdrantClient,
    source: str,
    offsets: list[Span],
    questions: list[Question],
    query_vectors: NDArray[np.float32],
    model: SentenceTransformer,
    config: Configuration,
    output: Path,
) -> dict[str, object]:
    split_start = time.perf_counter()
    spans, semantic_seconds, similarities = split_source(source, offsets, config, model)
    chunks = make_chunks(
        source, offsets, spans, cast(PreTrainedTokenizerFast, model.tokenizer)
    )
    split_seconds = time.perf_counter() - split_start
    assert all(chunk.source_tokens <= config.cap for chunk in chunks)
    embedding_start = time.perf_counter()
    vectors = encode(model, [chunk.text for chunk in chunks])
    embedding_seconds = time.perf_counter() - embedding_start
    collection = f"chunk_quality_{config.name}"
    await client.create_collection(
        collection_name=collection,
        vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        hnsw_config=models.HnswConfigDiff(m=0),
    )
    index_start = time.perf_counter()
    await client.upsert(
        collection_name=collection,
        wait=True,
        points=[
            models.PointStruct(
                id=chunk.id,
                vector=vector.tolist(),
                payload={
                    "corpus_id": CORPUS_ID,
                    "char_start": chunk.char_start,
                    "char_end": chunk.char_end,
                    "token_start": chunk.token_start,
                    "token_end": chunk.token_end,
                },
            )
            for chunk, vector in zip(chunks, vectors, strict=True)
        ],
    )
    indexing_seconds = time.perf_counter() - index_start
    assert (await client.count(collection_name=collection, exact=True)).count == len(
        chunks
    )
    search_start = time.perf_counter()
    semaphore = asyncio.Semaphore(8)
    results = await asyncio.gather(
        *(
            retrieve_one(
                client, collection, question, vector.tolist(), chunks, semaphore
            )
            for question, vector in zip(questions, query_vectors, strict=True)
        )
    )
    search_seconds = time.perf_counter() - search_start
    write_json(
        output / f"{config.name}-chunks.json", [asdict(chunk) for chunk in chunks]
    )
    write_json(output / f"{config.name}-queries.json", results)
    if similarities:
        write_json(output / "semantic-adjacent-similarities.json", similarities)
    summary: dict[str, object] = {
        **asdict(config),
        "vectors": len(chunks),
        "mean_chunk_source_tokens": statistics.mean(
            chunk.source_tokens for chunk in chunks
        ),
        "max_chunk_content_tokens": max(chunk.content_tokens for chunk in chunks),
        "split_seconds": split_seconds,
        "semantic_boundary_embedding_seconds": semantic_seconds,
        "chunk_embedding_seconds": embedding_seconds,
        "upsert_seconds": indexing_seconds,
        "search_batch_seconds": search_seconds,
        **summarize(results),
    }
    print(json.dumps(summary), flush=True)
    return summary


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--qdrant-url", default="http://127.0.0.1:16338")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--model-path", type=Path)
    parser.add_argument("--image-digest", default=IMAGE)
    return parser.parse_args()


@asynccontextmanager
async def connection(url: str) -> AsyncGenerator[AsyncQdrantClient, None]:
    client = AsyncQdrantClient(url=url, timeout=60)
    try:
        yield client
    finally:
        await client.close()


async def main() -> None:
    args = arguments()
    started = datetime.now(UTC).isoformat()
    output = cast(Path, args.output)
    output.mkdir(parents=True, exist_ok=True)
    data = output / "data"
    data.mkdir(exist_ok=True)
    async with connection(args.qdrant_url) as client:
        assert not (await client.get_collections()).collections, (
            "Use a fresh isolated Qdrant server."
        )
        async with httpx.AsyncClient() as http:
            info_response = await http.get(args.qdrant_url)
            info_response.raise_for_status()
            server_info = info_response.json()
        manifest = await download_inputs(data)
        source = (data / "state_of_the_union.md").read_text(encoding="utf-8")
        torch.manual_seed(0)
        torch.set_num_threads(4)
        torch.use_deterministic_algorithms(True)
        model_files = {}
        if args.model_path:
            assert args.model_path.name == MODEL_REVISION
            for name in [
                "model.safetensors",
                "tokenizer.json",
                "config.json",
                "sentence_bert_config.json",
            ]:
                model_files[name] = sha256((args.model_path / name).read_bytes())
        model_start = time.perf_counter()
        model = SentenceTransformer(
            str(args.model_path) if args.model_path else MODEL_ID,
            revision=MODEL_REVISION,
            device="cpu",
            local_files_only=bool(args.model_path),
        )
        model_load_seconds = time.perf_counter() - model_start
        assert model.max_seq_length == 256
        tokenizer = cast(PreTrainedTokenizerFast, model.tokenizer)
        assert tokenizer.is_fast
        offsets = token_offsets(source, tokenizer)
        questions = load_questions(data / "questions_df.csv", source, offsets)
        encode(model, ["Warm up the embedding model."])
        query_start = time.perf_counter()
        query_vectors = encode(model, [question.question for question in questions])
        query_seconds = time.perf_counter() - query_start
        summaries = []
        for config in CONFIGURATIONS:
            summaries.append(
                await run_configuration(
                    client,
                    source,
                    offsets,
                    questions,
                    query_vectors,
                    model,
                    config,
                    output,
                )
            )
    write_json(output / "summary.json", summaries)
    with (output / "summary.csv").open("w", newline="") as file:
        writer = csv.DictWriter(
            file, fieldnames=list(summaries[0]), lineterminator="\n"
        )
        writer.writeheader()
        writer.writerows(summaries)
    metadata = {
        "started_utc": started,
        "finished_utc": datetime.now(UTC).isoformat(),
        "source_commit": DATA_REVISION,
        "inputs": manifest,
        "script_sha256": sha256(Path(__file__).read_bytes()),
        "model": MODEL_ID,
        "model_revision": MODEL_REVISION,
        "local_model_file_sha256": model_files,
        "model_max_seq_length": model.max_seq_length,
        "qdrant_image": args.image_digest,
        "qdrant_server": server_info,
        "python": platform.python_version(),
        "platform": platform.platform(),
        "machine": platform.machine(),
        "device": "cpu",
        "torch_threads": 4,
        "seed": 0,
        "normalized_vectors": True,
        "distance": "Cosine",
        "exact_search": True,
        "packages": {
            name: importlib.metadata.version(name)
            for name in [
                "httpx",
                "numpy",
                "qdrant-client",
                "sentence-transformers",
                "torch",
                "transformers",
                "tokenizers",
            ]
        },
        "question_count": len(questions),
        "reference_count": 95,
        "source_characters": len(source),
        "source_wordpieces": len(offsets),
        "budget_content_tokens": BUDGET,
        "packing": "descending score, then ascending chunk ID; skip chunks that do not fit; no deduplication",
        "scoring": "unique canonical source WordPiece relevance credit; repeated retrieved positions count in cost",
        "gold_mapping": "a canonical source token is relevant if its half-open character span intersects a reference",
        "sentence_boundary_regex": SENTENCE_PATTERN,
        "semantic_adjacent_cosine_threshold": SEMANTIC_THRESHOLD,
        "configurations": [asdict(config) for config in CONFIGURATIONS],
        "model_load_seconds": model_load_seconds,
        "query_embedding_seconds": query_seconds,
        "timing_notes": "one warm CPU run per configuration; semantic boundary inference included in split_seconds; query embeddings shared; no network download or model load in per-configuration timings",
        "answer_generation": False,
        "limitations": "one speech, 76 published synthetic questions, incomplete excerpt labels; no reranking or generated-answer evaluation; not a universal chunker ranking",
    }
    write_json(output / "run-metadata.json", metadata)


if __name__ == "__main__":
    asyncio.run(main())
