# Reproduce the chunk-quality experiment

This experiment compares seven text-splitting configurations against a real,
isolated Qdrant server. It measures retrieved evidence, not generated answers.
The article uses its saved results in
`static/guides_data/chunking/quality-experiment/`.

## Run

Requirements: Python 3.12 through [uv](https://docs.astral.sh/uv/), Docker, and
network access for the pinned public data and model. The executable script has
exact direct dependency versions and a `run.py.lock` for transitive dependencies.
Run these commands from this directory. Select an unused localhost port if
16338 is occupied; do not point the script at a production server.

```sh
docker run --detach --rm --name chunk-quality-demo \
  --publish 127.0.0.1:16338:6333 \
  qdrant/qdrant@sha256:9bfc89f9914fc14876a88c05270685921a55b8877b254a98bcc1cc2f0a424cd2

./run.py --qdrant-url http://127.0.0.1:16338 \
  --output ../../../../../static/guides_data/chunking/quality-experiment

docker stop chunk-quality-demo
```

The script requires an empty server and creates only `chunk_quality_*`
collections. The container uses ephemeral storage. Stop it even if the run
fails. A second run requires a fresh container. An optional `--model-path` can
point to the already cached Hugging Face snapshot directory named
`1110a243fdf4706b3f48f1d95db1a4f5529b4d41`.

## Inputs and provenance

- Corpus: Chroma's complete State of the Union 2024 transcript, pinned at
  [commit e708410](https://github.com/brandonstarxel/chunking_evaluation/tree/e708410d1c61cb76a85cd9d433630ef89b9c6b85).
- Questions: all 76 rows with `corpus_id == "state_of_the_union"`, in original
  CSV order. Their 95 published reference spans are verified by exact source
  slicing. No questions or labels are generated during this run.
- The original corpus, full 472-question CSV, and repository MIT license are
  retained as downloaded. SHA-256 hashes and raw download URLs are recorded in
  `run-metadata.json`. The full CSV is about 236 KB.
- Chroma generated and filtered these annotations with an LLM. They are not
  human-authored or exhaustive relevance judgments. Other valid evidence can be
  absent from the labels. See the [report](https://www.trychroma.com/research/evaluating-chunking).
- The original speech is government-produced material; see the archived
  [White House copyright policy](https://bidenwhitehouse.archives.gov/copyright/).

This is one historical speech and a small synthetic question set. Results do
not establish a universally best chunker or the factual accuracy of statements
made in the speech.

## Controlled retrieval setup

All configurations use normalized, 384-dimensional
`sentence-transformers/all-MiniLM-L6-v2` embeddings at revision
`1110a243fdf4706b3f48f1d95db1a4f5529b4d41`. The run uses CPU inference, four
PyTorch threads, seed 0, and deterministic PyTorch algorithms. Queries are
embedded once and reused. There is no reranker or answer model.

Each configuration has a separate Qdrant collection with cosine distance.
Queries explicitly set `exact=True`; HNSW graph construction is disabled with
`m=0`. The run records the server version, image digest, client version, package
versions, source hashes, model hashes when using a local snapshot, and script
hash. The included run used Qdrant 1.20.0 and Python 3.12.

The complete source is tokenized once without special tokens. Its canonical
WordPiece positions provide stable identities for relevance scoring. A chunk
is a contiguous source interval; no source text is rewritten. Every source
token and every non-whitespace source character must appear in at least one
chunk. All original reference offsets remain valid.

## Boundary rules

The names describe the implementations in `run.py`, not results for every
library offering a method with the same name.

| Configuration | Definition |
| --- | --- |
| Fixed 64/0 | Consecutive windows of at most 64 canonical source WordPieces; no overlap. |
| Fixed 128/0 | Consecutive windows of at most 128 canonical source WordPieces; no overlap. |
| Fixed 128/32 | Windows of at most 128 canonical source WordPieces with a 96-token stride. |
| Fixed 192/0 | Consecutive windows of at most 192 canonical source WordPieces; no overlap. |
| Sentence 128/0 | Find boundaries with `(?<=[.!?])\s+|\n+`; greedily group consecutive units up to the cap. |
| Recursive 128/0 | Preserve blank-line paragraphs where they fit; split oversized paragraphs at sentence boundaries, then token boundaries; greedily group resulting units. |
| Semantic 128/0 | Start with the same sentence units; split when adjacent-unit cosine similarity is below the prespecified 0.5 threshold or adding a unit would exceed the cap. |

Oversized sentence units fall back to token windows. The lightweight sentence
rule is deterministic but does not resolve abbreviations or linguistic edge
cases. Semantic similarity uses the same pinned embedding model; its threshold
was not tuned against evaluation answers. No configuration repeats source
positions except Fixed 128/32.

**Size caps are canonical source WordPiece counts.** Independently encoding a
substring can tokenize its edge differently, particularly when a fixed window
cuts a word. Each chunk is therefore tokenized again before embedding and
packing. The script asserts that every chunk and question, including special
tokens, fits the model's 256-token input limit. No embedding is silently
truncated.

## Pack a bounded context

Qdrant returns all chunks ranked by cosine similarity. Ties are ordered by
chunk ID. Iterate in that order and append a complete chunk if its independently
tokenized content fits the remaining **512-token budget**. Skip a chunk that
does not fit and continue to lower-ranked chunks. Do not deduplicate or trim
chunks. Formatting, separators, and prompt instructions are outside this
content-only budget.

The cap is identical, but the amount packed can differ. In particular, large
full chunks can leave unused budget. `mean_content_tokens` reports the actual
sum of independently tokenized chunk content, not an assumed 512 tokens.
`mean_source_tokens` reports canonical source positions, including duplicates,
for the scoring denominator. These counts need not be identical.

## Score evidence

Map each published reference interval to canonical source tokens whose
half-open character intervals intersect it. Let:

- `G` be the union of relevant source-token positions.
- `U` be the union of selected source-token positions.
- `C` be the sum of selected chunk lengths in canonical positions, counting
  duplicate positions repeatedly.
- `H = |G ∩ U|` be recovered relevant positions, credited once.

Then `recall = H / |G|`, `precision = H / C`, and
`IoU = H / (C + |G| - H)`. This IoU penalizes duplicated retrieved evidence; it
is not ordinary set IoU after deduplication. Duplicate fraction is
`(C - |U|) / C`. Full-evidence coverage requires all annotated positions.
All reported averages are unweighted means over the same 76 questions.
Standard deviations describe variation between questions, not confidence
intervals or repeated timing runs.

This follows Chroma's relevance-span evaluation idea. Its released scorer uses
character-range lengths; this script explicitly uses canonical WordPiece
positions. Published Chroma scores therefore are not directly interchangeable
with these results.

## Outputs and timing

- `summary.json` and `summary.csv`: per-configuration counts, timings, and
  aggregate scores. Scores are fractions from 0 to 1.
- `*-chunks.json`: exact source text, character offsets, canonical token
  offsets, and independently measured content-token counts for each chunk.
- `*-queries.json`: original references, gold token positions, selected chunk
  IDs, source offsets, ranks, cosine scores, skipped chunk IDs, and scores.
- `semantic-adjacent-similarities.json`: boundary similarities in source order.
- `run-metadata.json`: reproducibility settings and provenance.
- `data/`: unmodified downloaded corpus, question CSV, and license.

The model is warmed before the configuration loop. `split_seconds` includes
boundary construction, offset checks, and chunk token counting. For semantic
chunking it also includes sentence embedding inference, separately exposed as
`semantic_boundary_embedding_seconds`. Final chunk embedding, Qdrant upsert,
and query batch times are reported separately. Model loading, downloads, and
shared query embeddings are excluded from per-configuration timings. These are
single local observations, not a throughput benchmark; hardware, concurrency,
and cache effects can change them.

## Checks

```sh
uvx ruff format --check run.py
uvx ruff check run.py
uvx ty check --python /path/to/the/uv-script-environment/bin/python run.py
```

Runtime assertions check source/reference alignment, full source coverage,
configuration caps, embedding input limits, normalized finite vectors,
collection point counts, and per-query context budgets. The saved run can be
audited independently using its source offsets and selected chunk IDs.
