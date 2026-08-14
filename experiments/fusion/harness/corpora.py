"""Load the five corpora, subsample the two large ones, measure BM25 avg_len.

Every corpus arrives as the same three frames: docs (point_id, doc_id, text),
queries (query_id, text), qrels (query_id, doc_id, relevance). Point ids are
row positions, so they are stable for any given manifest.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import sys
import zipfile
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from . import DATA, SEED

RAW = DATA / "raw"

BEIR_BASE = "https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets"
WANDS_COMMIT = "3b74dcf4ba29ab8ff3e6a50b5b09fc627cb882b5"
CSN_REVISION = "bd0cf261e357a3eb5c8fba490d23ec1a1cd59555"

csv.field_size_limit(sys.maxsize)


@dataclass
class Corpus:
    name: str
    docs: pd.DataFrame
    queries: pd.DataFrame
    qrels: pd.DataFrame
    field_recipe: str
    license: str
    sources: list[dict] = field(default_factory=list)
    # ArguAna queries are themselves corpus documents, so each query has to
    # exclude its own source argument from both legs.
    excludes_self: bool = False

    def self_doc_ids(self) -> dict[str, str]:
        if not self.excludes_self:
            return {}
        known = set(self.docs["doc_id"])
        return {q: q for q in self.queries["query_id"] if q in known}


def sha256(path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def _source(path, url) -> dict:
    return {"file": path.name, "url": url, "sha256": sha256(path), "bytes": path.stat().st_size}


# ------------------------------------------------------------------ BEIR zips


def _beir_members(archive: zipfile.ZipFile, name: str):
    root = f"{name}/"
    return (
        f"{root}corpus.jsonl",
        f"{root}queries.jsonl",
        f"{root}qrels/test.tsv",
    )


def _read_qrels(archive: zipfile.ZipFile, member: str) -> pd.DataFrame:
    with archive.open(member) as handle:
        frame = pd.read_csv(io.TextIOWrapper(handle, "utf-8"), sep="\t")
    frame.columns = ["query_id", "doc_id", "relevance"]
    frame["query_id"] = frame["query_id"].astype(str)
    frame["doc_id"] = frame["doc_id"].astype(str)
    frame["relevance"] = frame["relevance"].astype(int)
    return frame


def load_beir(name: str, license_: str, keep_docs: int | None = None) -> Corpus:
    """SciFact and ArguAna load whole; DBPedia keeps every judged document and
    fills the rest with random distractors at the shared seed."""
    path = RAW / f"{name}.zip"
    with zipfile.ZipFile(path) as archive:
        corpus_member, queries_member, qrels_member = _beir_members(archive, name)
        qrels = _read_qrels(archive, qrels_member)
        judged = set(qrels["doc_id"])
        docs = _stream_corpus(archive, corpus_member, judged, keep_docs)

        with archive.open(queries_member) as handle:
            queries = pd.DataFrame(
                [
                    {"query_id": str(row["_id"]), "text": row["text"]}
                    for row in map(json.loads, io.TextIOWrapper(handle, "utf-8"))
                ]
            )

    qrels = qrels[qrels["doc_id"].isin(set(docs["doc_id"]))].reset_index(drop=True)
    # ArguAna's own qrels point at five documents its corpus.jsonl does not
    # contain. A query with no reachable relevant document scores zero under
    # every arm, so it is dropped rather than left to pad the averages.
    answerable = set(qrels.loc[qrels["relevance"] > 0, "query_id"])
    queries = queries[queries["query_id"].isin(answerable)].reset_index(drop=True)
    qrels = qrels[qrels["query_id"].isin(answerable)].reset_index(drop=True)
    docs.insert(0, "point_id", np.arange(len(docs), dtype=np.int64))
    return Corpus(
        name=name,
        docs=docs,
        queries=queries,
        qrels=qrels,
        field_recipe='title + " " + text',
        license=license_,
        sources=[_source(path, f"{BEIR_BASE}/{name}.zip")],
        excludes_self=(name == "arguana"),
    )


def _stream_corpus(archive, member, judged, keep_docs) -> pd.DataFrame:
    """One pass over corpus.jsonl: keep every judged document, reservoir-sample
    distractors up to the target. Deterministic for a fixed archive and seed."""
    kept, reservoir, seen = [], [], 0
    rng = np.random.default_rng(SEED)
    with archive.open(member) as handle:
        for line in io.TextIOWrapper(handle, "utf-8"):
            row = json.loads(line)
            record = {
                "doc_id": str(row["_id"]),
                "text": f"{row.get('title', '')} {row.get('text', '')}".strip(),
            }
            if keep_docs is None or record["doc_id"] in judged:
                kept.append(record)
                continue
            budget = keep_docs - len(judged)
            if len(reservoir) < budget:
                reservoir.append(record)
            else:
                slot = int(rng.integers(0, seen + 1))
                if slot < budget:
                    reservoir[slot] = record
            seen += 1
    return pd.DataFrame(kept + reservoir)


def load_scifact() -> Corpus:
    return load_beir("scifact", "CC BY 4.0")


def load_arguana() -> Corpus:
    return load_beir("arguana", "CC BY 4.0")


def load_dbpedia() -> Corpus:
    return load_beir("dbpedia-entity", "CC BY-SA 3.0", keep_docs=100_000)


# ----------------------------------------------------------------------- WANDS

WANDS_LABELS = {"Exact": 2, "Partial": 1, "Irrelevant": 0}


def load_wands() -> Corpus:
    products = pd.read_csv(RAW / "wands_product.csv", sep="\t", dtype=str).fillna("")
    queries = pd.read_csv(RAW / "wands_query.csv", sep="\t", dtype=str).fillna("")
    labels = pd.read_csv(RAW / "wands_label.csv", sep="\t", dtype=str).fillna("")

    docs = pd.DataFrame(
        {
            "point_id": np.arange(len(products), dtype=np.int64),
            "doc_id": products["product_id"].astype(str),
            "text": (products["product_name"] + " " + products["product_description"]).str.strip(),
        }
    )
    qrels = pd.DataFrame(
        {
            "query_id": labels["query_id"].astype(str),
            "doc_id": labels["product_id"].astype(str),
            "relevance": labels["label"].map(WANDS_LABELS).astype(int),
        }
    )
    return Corpus(
        name="wands",
        docs=docs,
        queries=pd.DataFrame(
            {"query_id": queries["query_id"].astype(str), "text": queries["query"]}
        ),
        qrels=qrels,
        field_recipe='product_name + " " + product_description',
        license="MIT",
        sources=[
            _source(RAW / f"wands_{part}.csv", f"wayfair/WANDS@{WANDS_COMMIT}:dataset/{part}.csv")
            for part in ("product", "query", "label")
        ],
    )


# ------------------------------------------------------------- CodeSearchNet


def load_codesearchnet(n_docs: int = 50_000, n_queries: int = 1_000) -> Corpus:
    """Docstring retrieves its own function. The docstring is stripped from the
    indexed body, or string overlap solves the task instead of retrieval."""
    path = RAW / "csn_python_train.parquet"
    frame = pd.read_parquet(
        path, columns=["func_code_url", "func_code_string", "func_documentation_string"]
    )
    keep_row = [
        5 <= len(doc.split()) <= 200
        and 10 <= len(code.split()) <= 400
        # Only rows whose docstring appears verbatim in the body, so the strip
        # below is guaranteed to remove it.
        and doc in code
        for doc, code in zip(frame["func_documentation_string"], frame["func_code_string"])
    ]
    frame = frame[keep_row].reset_index(drop=True)

    rng = np.random.default_rng(SEED)
    picks = rng.choice(len(frame), size=n_docs, replace=False)
    sample = frame.iloc[np.sort(picks)].reset_index(drop=True)
    query_rows = np.sort(rng.choice(n_docs, size=n_queries, replace=False))

    bodies = [
        _strip_docstring(code, doc)
        for code, doc in zip(sample["func_code_string"], sample["func_documentation_string"])
    ]
    docs = pd.DataFrame(
        {
            "point_id": np.arange(len(sample), dtype=np.int64),
            "doc_id": sample["func_code_url"].astype(str),
            "text": bodies,
        }
    )
    queries = pd.DataFrame(
        {
            "query_id": docs["doc_id"].iloc[query_rows].values,
            "text": sample["func_documentation_string"].iloc[query_rows].values,
        }
    )
    qrels = pd.DataFrame(
        {"query_id": queries["query_id"], "doc_id": queries["query_id"], "relevance": 1}
    )
    return Corpus(
        name="codesearchnet",
        docs=docs,
        queries=queries,
        qrels=qrels,
        field_recipe="func_code_string with func_documentation_string removed",
        license="MIT",
        sources=[
            _source(
                path,
                f"hf://code-search-net/code_search_net@{CSN_REVISION}"
                "/python/train-00000-of-00001.parquet",
            )
        ],
    )


def _strip_docstring(code: str, docstring: str) -> str:
    """Remove the docstring text from the function body, quote markers and all."""
    body = " ".join(code.replace(docstring, "").split())
    for quotes in ('"""', "'''"):
        body = body.replace(quotes, " ")
    return " ".join(body.split())


# ----------------------------------------------------------------- avg_len


def measure_avg_len(texts, bm25) -> dict:
    """Mean length of the token list BM25 actually scores, which is what the
    formula's |d| means: after punctuation, stopwords, and stemming."""
    from fastembed.common.utils import remove_non_alphanumeric

    stemmed_total = raw_total = 0
    for text in texts:
        tokens = bm25.tokenizer.tokenize(remove_non_alphanumeric(text))
        raw_total += len(tokens)
        stemmed_total += len(bm25._stem(tokens))
    count = max(len(texts), 1)
    return {
        "avg_len": round(stemmed_total / count, 4),
        "avg_raw_tokens": round(raw_total / count, 4),
    }


LOADERS = {
    "scifact": load_scifact,
    "arguana": load_arguana,
    "wands": load_wands,
    "codesearchnet": load_codesearchnet,
    "dbpedia-entity": load_dbpedia,
}
