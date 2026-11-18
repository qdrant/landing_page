---
title: "How to Choose a Chunking Strategy"
short_description: "Inspect your documents, choose chunk boundaries, speed up ingestion, and compare evidence quality in a Qdrant experiment."
description: "Choose a chunking strategy for RAG, improve splitting throughput, and evaluate retrieval quality with a reproducible Qdrant experiment."
author: Ewa Szyszka
date: 2026-11-12T00:00:00.000Z
draft: false
weight: 20
---

<link rel="stylesheet" href="/guides_data/chunking/figures.css">

# Why Chunking Matters

Feeding entire, unsplit documents directly into an embedding pipeline is one of the fastest ways to degrade retrieval quality. To turn raw text into accurate, searchable knowledge, you first have to break it down into manageable pieces. Chunking is a critical step before generating vector embeddings. They address the following challenges:

- **Embedding model token limits:** Embedding models are bound by context window limits. For example BGE-M3 can process 8,192 tokens, any longer inputs are truncated.
- **Preserving topic clarity:** Representing a long document with a single vector dilutes specific themes and lowers search accuracy.
- **Enabling metadata and citations:** Chunking assigns each focused passage its own vector alongside metadata like page numbers and document IDs, allowing precise filtering and source tracking.

---

{{< island path="documentation/headless/chunking/decision-flow" ratio="16/9" >}}
![Four connected steps: inspect sources, choose boundary, speed up chunking, and evaluate chunk quality.](/guides_data/chunking/decision-flow.svg)
{{< /island >}}

## 1. Inspect Your Documents

Before selecting a chunking strategy, assess whether your source files need layout-aware preprocessing. When working with visually rich documents, you have three main paths: use traditional **OCR** for simple text extraction, use a **VLM** to convert complex layouts, tables, and charts into structured Markdown before splitting, or skip text chunking entirely by indexing page images directly with multimodal retrievers like **ColPali** or **ColQwen**.

### Receipt: Check the OCR Output

<div class="chunking-source-example">
<figure>
  <a href="/guides_data/chunking/receipt.png" aria-label="Open the full-size Bright Mart receipt">
    <img src="/guides_data/chunking/receipt.png" alt="Bright Mart receipt RCP-602371 dated February 12, 2026: headphones cost $60 and a connecting wire $10. Subtotal $70, tax $17.50, discount minus $0.50, total $87." width="840" height="1659" loading="lazy">
  </a>
  <figcaption>Receipt example. Select the image to inspect it at full resolution.</figcaption>
</figure>
<div class="chunking-source-example__text mathjax_ignore">

#### When to Use VLMs or Text Chunking

Use native PDF text when available; use OCR for scans. Choose text chunking when extraction preserves rows, amounts, and signs.

Template-specific layout rules can break when columns or headers move. If that loses evidence, test a better parser, a VLM that produces structured Markdown, or [page-image retrieval](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/). Verify generated Markdown against the source.

Keep a short receipt in one chunk if it fits the embedding limit. Store receipt ID, date, page, source image, and cell coordinates in [payload](/documentation/manage-data/payload/). Embed the extracted text; metadata supports filtering and citations but is not automatically embedded.

</div>
</div>

### Infographic: Keep the Chart Readable

<div class="chunking-source-example">
<figure>
  <a href="/guides_data/chunking/retirement-infographic.png" aria-label="Open the full-size Global Retirement Dilemma infographic">
    <img src="/guides_data/chunking/retirement-infographic.png" alt="The Global Retirement Dilemma infographic. Its chart of seniors as a projected share of total population shows the blue U.S. curve above the white World curve across the displayed 2015–2060 range." width="970" height="1615" loading="lazy">
  </a>
  <figcaption>Historical infographic: Dave Merrill / Bloomberg Visual Data. Select to inspect the full image; its projections are not current statistics.</figcaption>
</figure>
<div class="chunking-source-example__text">

#### Diagrams, Charts, and Graphs

Preserve axes, units, legends, captions, and footnotes; for graphs, preserve nodes, arrow direction, and edge labels. Use verified data for exact values. Otherwise, retrieve the complete figure or page for an image-capable answering model. Check label legibility after resizing.

Store document ID, page, bounding box, and full-page reference; [Docling](https://docling-project.github.io/docling/reference/docling_document/) supports this provenance. Here, the U.S. curve stays above World; extracted labels alone lose that relationship.

#### ColPali, ColQwen, and Other Qdrant Options

ColPali/ColQwen encode page patches and query tokens as multivectors. Qdrant's `MAX_SIM` sums each query vector's best page-vector similarity; answering requires separate inference.

- [ColPali v1.3](https://huggingface.co/Qdrant/colpali-v1.3-fp16): FastEmbed ONNX; **448 × 448** pixels.
- [ColQwen2 v1.0](https://huggingface.co/vidore/colqwen2-v1.0): dynamic resolution, preserved aspect ratio; tune the patch budget.
- [ColModernVBERT](https://huggingface.co/Qdrant/colmodernvbert): approximately **250M parameters**; FastEmbed CPU/GPU multivectors.
- [Voyage multimodal 3.5](/documentation/embeddings/voyage/#embed-images): dense vectors for text/image inputs.

[Qdrant's PDF tutorial](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) combines pooled candidate retrieval with full multivector reranking. Measure storage and latency; check image budgets.

</div>
</div>

### Handwriting: Verify Recognition Before Splitting

<div class="chunking-source-example">
<figure>
  <a href="/guides_data/chunking/handwritten-page.png" aria-label="Open the full-size handwritten page">
    <img src="/guides_data/chunking/handwritten-page.png" alt="A page of cursive handwriting on aged paper, including the line How often did I think of you." width="600" height="948" loading="lazy">
  </a>
  <figcaption>Handwritten source. Select the image to compare individual words.</figcaption>
</figure>
<div class="chunking-source-example__text">

Use handwriting recognition or a VLM, then verify uncertain words against the scan. Preserve reading order, original wording, page/line references, and available region coordinates. Keep normalized search text separate from quoted transcriptions.

Group verified lines into complete passages within the embedding limit. A line break alone does not define a meaningful chunk; repair recognition errors before comparing splitters.

When visual marks matter, test page-image retrieval. Preserve the scan, check legibility after resizing, and verify the answering model's quotations against it.

</div>
</div>

### Video Chunking

<div class="chunking-source-example">
<div class="chunking-inline-media" data-media-kind="video">

{{< island path="documentation/headless/chunking/inline-media" ratio="4/5" >}}
<div class="chunking-media-fallback">
  <p class="chunking-media-title">Apollo 11 first steps on the moon</p>
  <video controls playsinline preload="none" poster="/guides_data/chunking/media-demo/frames/video-01.jpg" aria-label="Apollo 11 first steps on the moon">
    <source src="/guides_data/chunking/media-demo/source.mp4" type="video/mp4">
    <a href="/guides_data/chunking/media-demo/source.mp4">Play the Apollo 11 recording</a>
  </video>
  <p>Source: <a href="https://commons.wikimedia.org/wiki/File:Apollo_11_Landing_-_first_steps_on_the_moon.ogv">NASA</a></p>
</div>
{{< /island >}}

</div>
<div class="chunking-source-example__text">

- **Boundary:** Start with fixed-duration windows; use scene or topic boundaries when they preserve a complete action. [TwelveLabs supports fixed and dynamic segmentation](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/video).
- **Evidence:** Link frames, transcript, and clip through a source ID and start/end timestamps. Transcript embeddings alone cannot recover actions the speaker does not describe. Check frame sampling and model duration limits.
- **Actual run:** The script divides a 61.5-second NASA recording into six ranges capped at 12 seconds; FFmpeg extracts each midpoint frame. One frame can miss an action: replay the complete interval before judging its evidence.

[Reproduce the example](https://github.com/qdrant/landing_page/blob/codex/chunking-guide/qdrant-landing/content/documentation/headless/chunking/media-demo/README.md).

</div>
</div>

### Voice and Audio Chunking

<div class="chunking-source-example">
<div class="chunking-inline-media" data-media-kind="audio">

{{< island path="documentation/headless/chunking/inline-media" ratio="4/5" >}}
<div class="chunking-media-fallback">
  <p class="chunking-media-title">Apollo 11 first steps on the moon</p>
  <p><a href="/guides_data/chunking/media-demo/audio.m4a">Play the Apollo 11 audio</a></p>
  <p>Source: <a href="https://commons.wikimedia.org/wiki/File:Apollo_11_Landing_-_first_steps_on_the_moon.ogv">NASA</a></p>
</div>
{{< /island >}}

</div>
<div class="chunking-source-example__text">

- **Boundary:** Use ASR timestamps; add diarization when speaker identity matters. Keep dependent turns together. Pauses can occur inside a sentence.
- **Evidence:** Retain recording IDs and source offsets. Non-speech events require the original audio and a suitable [audio embedding model](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/audio).
- **Actual run:** A Whisper base.en transcript is split into eight chunks using punctuation, ASR word gaps of at least 0.8 seconds, and a 12-second cap. It misrecognizes "fine-grained" as "fine green"; the gap rule also splits an unfinished phrase. Repair recognition and boundary errors before embedding.

[Inspect the raw transcript](/guides_data/chunking/media-demo/transcript.raw.json). This single-speaker example does not run diarization or retrieval.

</div>
</div>


## 2. Choose Meaningful Boundaries

Choose boundaries that keep an answer with its conditions. Start with document structure, then split oversized sections; combine methods when needed, such as grouping sentences with overlap.

<details class="chunking-method" id="fixed-chunking">
<summary>Fixed chunking</summary>

Fixed chunking cuts windows of a chosen length; use it as a simple baseline when document structure is unreliable.

<div class="chunking-tradeoff-grid">

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Predictable sizes and repeatable boundaries.
- No model calls to choose splits.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Can separate a statement from its conditions.
- Character or word caps do not enforce token limits.

</details>

</div>

A 400-token window with 40-token overlap advances by 360 tokens. Count with the embedding model's tokenizer, including added titles or context.

**Tools:** [Agno](https://docs.agno.com/knowledge/concepts/chunking/fixed-size-chunking) counts characters and avoids cutting words where possible. [Kiru](https://github.com/bitswired/kiru) supports byte or character chunking; [Chunk (formerly memchunk)](https://github.com/feyninc/chunk) uses delimiter-based byte splitting. Their size units are not interchangeable with model tokens.

{{< island path="documentation/headless/chunking/fixed" ratio="16/11" title="Change the word count and overlap to see which source words repeat." >}}
![Twelve-word windows over a 31-word source: zero overlap gives three chunks; three-word overlap gives four chunks with repeated source positions.](/guides_data/chunking/fixed.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="sentence-chunking">
<summary>Sentence chunking</summary>

Sentence chunking indexes individual sentences or packs consecutive sentences up to a size cap, preserving statements in ordinary prose.

<div class="chunking-tradeoff-grid">

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Keeps statements intact without model inference.
- Grouping sentences retains nearby context.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Pronouns and exceptions may depend on other sentences.
- Abbreviations complicate segmentation; oversized sentences still need splitting.

</details>

</div>

"Download those files separately" needs the sentence identifying the files. Group them when they fit the token cap.

**Tools:** [Chonkie's sentence chunker](https://docs.chonkie.ai/oss/chunkers/sentence-chunker) groups sentences; [LlamaIndex node parsers](https://developers.llamaindex.ai/python/framework/module_guides/loading/node_parsers/modules/) integrate sentence splitting into an indexing pipeline. Sentence counts alone do not enforce the embedding model's token limit.

{{< island path="documentation/headless/chunking/sentence" ratio="16/11" title="Adjust the word cap to group sentences or reveal one that needs a finer split." >}}
![Three sentences contain 8, 9, and 6 words. A 12-word cap keeps them separate; a 20-word cap groups the first two into a 17-word chunk. An 8-word cap cannot contain the 9-word sentence intact.](/guides_data/chunking/sentence.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="paragraph-chunking">
<summary>Paragraph chunking</summary>

Paragraph chunking preserves paragraphs and optionally combines adjacent ones within a section; use it when the author's grouping survives extraction.

<div class="chunking-tradeoff-grid">

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Preserves the author's grouping without model inference.
- Combines short paragraphs within the same section.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- PDF line wrapping can create false paragraphs.
- Conditions may lie elsewhere; oversized paragraphs need splitting.

</details>

</div>

**Tools:** [Docling](https://docling-project.github.io/docling/) and [Unstructured](https://docs.unstructured.io/open-source/core-functionality/partitioning) extract structured elements before chunking. For Markdown, [LangChain's header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) groups sections and stores heading metadata; it strips headings by default, so retain useful titles in the embedding input. Then pack paragraphs within those sections under a token cap.

{{< island path="documentation/headless/chunking/paragraph" ratio="16/11" title="Pack paragraphs under a word cap while keeping the section boundary intact." >}}
![Export paragraphs P1, P2, and P3 contain 10, 12, and 15 words; Billing paragraph P4 contains 8. Packing at 24 words groups P1 and P2. Packing at 48 groups P1 through P3. The section boundary keeps P4 separate.](/guides_data/chunking/paragraph.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="sliding-window-chunking">
<summary>Sliding-window chunking</summary>

Sliding windows repeat context by advancing less than their full length: a 400-token window with a 360-token stride overlaps by 40 tokens.

<div class="chunking-tradeoff-grid">

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Keeps nearby context across boundaries.
- Size and stride give predictable coverage.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Duplicate text increases embedding work and storage.
- Overlapping hits consume result slots; distant dependencies remain separated.

</details>

</div>

Preserve source offsets to merge repeated spans during answer assembly.

**Tools:** [LangChain text splitters](https://docs.langchain.com/oss/python/integrations/splitters/index) support overlapping chunks. [LlamaIndex's sentence-window parser](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/sentence_window/) instead embeds individual sentences and stores neighbors as metadata for expansion after retrieval; those neighbors are not part of the embedded window.

{{< island path="documentation/headless/chunking/sliding-window" ratio="16/11" title="Change the stride of a three-sentence window to see repeated evidence and repaired boundaries." >}}
![Six sentences form two non-overlapping three-sentence chunks at stride 3. At stride 2, the windows are S1–S3, S3–S5, and S5–S6; S3 and S5 repeat. The linked-file statement S3 and download instruction S4 share the middle window.](/guides_data/chunking/sliding-window.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="semantic-chunking">
<summary>Semantic chunking</summary>

Semantic chunking compares sentence or passage embeddings to detect topic changes; try it when structural rules repeatedly combine unrelated topics.

<div class="chunking-tradeoff-grid">

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Can detect shifts that formatting misses.
- Allows variable lengths for related passages.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Adds embedding cost before indexing.
- Similarity guarantees neither complete evidence nor valid token lengths.

</details>

</div>

[Qu et al.](https://arxiv.org/abs/2410.13070) found inconsistent gains over fixed sentence groups; [Sayıcı's EUR-Lex experiment](https://mburaksayici.com/blog/2025/11/08/not-all-clever-chunking-methods-always-worth-it.html) also questions added complexity.

**Tools:** [LlamaIndex](https://developers.llamaindex.ai/python/examples/node_parsers/semantic_chunking/) and [Chonkie](https://docs.chonkie.ai/oss/chunkers/overview) offer semantic splitters; [Sentence Transformers](https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html) supplies embeddings, leaving the splitting rule to you. [Chonky](https://github.com/mirth/chonky), also available through [Chonkie's neural chunker](https://docs.chonkie.ai/oss/chunkers/neural-chunker), predicts boundaries with token classification rather than similarity thresholds.

A lower [LlamaIndex dissimilarity percentile](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/semantic_splitter/) produces more splits; this demo uses a higher similarity threshold for that effect.

{{< island path="documentation/headless/chunking/semantic" ratio="16/11" title="Raise the threshold to split illustrative similarity scores; no embedding model runs here." >}}
![Illustrative semantic scores produce two chunks at threshold 0.35 and three at 0.65. The 0.56 similarity between export steps and the linked-file exception becomes a split.](/guides_data/chunking/semantic.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="agentic-chunking">
<summary>Agentic chunking</summary>

Agentic chunking uses an LLM to choose source boundaries during ingestion; try it when failed splits require interpretation beyond structural or similarity rules.

<div class="chunking-tradeoff-grid">

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Interprets passage roles and document-specific instructions.
- Boundary selection can preserve the original wording.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Adds model cost and ingestion latency.
- Limited source windows and invalid responses require safeguards.

</details>

</div>

An exception can guide a split only if the model sees it. An agent searching a knowledge base can use any chunking method.

**Tools:** [Agno](https://docs.agno.com/knowledge/concepts/chunking/agentic-chunking) asks for a character position and slices the original text; `max_chunk_size` counts characters. Its [validation and fallback logic](https://github.com/agno-agi/agno/blob/main/libs/agno/agno/knowledge/chunking/agentic.py) can also determine boundaries, so record which path ran.

{{< island path="documentation/headless/chunking/agentic" ratio="16/11" title="Compare two scripted source windows to see which includes the exception; no model runs here." >}}
![A scripted agentic example: a window containing S1–S2 ends after the export steps; a wider window containing S1–S4 can keep the linked-file exception. Both outputs retain source wording.](/guides_data/chunking/agentic.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="recursive-chunking">
<summary>Recursive chunking</summary>

Recursive chunking tries coarse separators first, subdivides oversized pieces, then packs them within a cap; it suits structured prose with uneven lengths.

<div class="chunking-tradeoff-grid">

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Preserves units that fit without model inference.
- Supports separators for specific formats and languages.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Separators cannot detect dependencies between passages.
- Poor extraction can force word or character cuts.

</details>

</div>

**Tools:** [LangChain](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter) defaults to paragraph breaks, line breaks, spaces, then characters. Its default counter measures characters; use [token-aware configuration](https://docs.langchain.com/oss/python/integrations/splitters/split_by_token) for a token cap. Overlap is a target, and sentences may still split. [semchunk](https://github.com/isaacus-dev/semchunk)'s default mode and [text-splitter](https://github.com/benbrandt/text-splitter) (`semantic-text-splitter` in Python) use structural boundaries, despite the semantic naming; they do not require embedding similarity comparisons.

{{< island path="documentation/headless/chunking/recursive" ratio="8/5" title="Step through a custom paragraph, sentence, and word hierarchy, rather than LangChain's default separators." >}}
![With a 24-word cap, the 12-word and 5-word paragraphs remain intact. Only the 30-word paragraph is split into sentences of 8 and 22 words.](/guides_data/chunking/recursive.svg)
{{< /island >}}

</details>

Compare methods on the same questions and [retrieved-text budget](#4-evaluate-chunk-quality), measuring splitting time alongside evidence coverage.

## 3. Speed up chunking

Time parsing/OCR, token counting, splitting, embedding, and indexing separately. Optimize the stage that dominates ingestion.

- **Avoid repeated work.** Reuse tokenizers and bound the token-count cache. [semchunk](https://github.com/isaacus-dev/semchunk) supports memoization and document multiprocessing; batch enough work to outweigh worker overhead.
- **Reduce searching and copying.** Minhas's [You want to chunk really fast?](https://usefeyn.com/blog/you-want-to-chunk-really-fast/#benchmarks) describes backward delimiter searches, specialized byte searches, and borrowed slices in memchunk, now Chunk. Materializing Python strings still costs time.
- **Control memory and inference.** Consume [Kiru](https://github.com/bitswired/kiru) streams incrementally. Batch sentence embeddings for semantic chunking and reuse them across threshold experiments.

Compare throughput with the same input, counting units, overlap, tokenizer work, and output consumption. Chunk's [benchmark harness](https://github.com/feyninc/chunk/tree/main/benches) excludes input loading. Record elapsed time, peak memory, source coverage, and token lengths; a faster splitter can still produce worse retrieval results.

## 4. Evaluate chunk quality

The choice of chunk size, chunk boundary, and chunk overlap can affect retrieval performance. Hold documents, questions, models, search settings, and the retrieved-text budget fixed while changing one choice at a time. Equal result counts do not provide equal evidence budgets.

### Measure the Evidence Retrieved

Label relevant **source spans**, independently of chunk IDs, and measure:

- **Recall:** How much labeled evidence was retrieved?
- **Precision:** How much retrieved text was labeled relevant?
- **Overlap-aware IoU:** How much do retrieved and relevant source positions overlap, while charging repeated text against the score?

Count source-token positions, not matching words. Repeated passages consume budget but earn relevance credit once. Inspect low-scoring queries for missing conditions, unrelated text, and duplicated evidence. [LlamaIndex](https://developers.llamaindex.ai/python/examples/evaluation/retrieval/retriever_eval/) also supports rank-based metrics such as MRR and nDCG; map relevance back to stable source evidence when changing splits.

### A Small Qdrant Experiment

We ran **Qdrant 1.20.0** on the State of the Union 2024 dataset: one speech, **76 published synthetic questions**, and 95 labeled excerpts. Every configuration used the same pinned all-MiniLM-L6-v2 model, exact cosine search, and a **512-token retrieved-text budget**. Ranked chunks were kept whole; chunks that did not fit were skipped. No deduplication or answer generation was applied.

Caps and overlap are source WordPiece counts; chunks can be shorter than the cap. Scores and actual returned token counts are means across the 76 questions.

| Method: cap/overlap | Vectors | Recall | Precision | IoU | Returned tokens |
| --- | --- | --- | --- | --- | --- |
| Fixed 64/0 | 167 | 87.48% | 6.78% | 6.71% | 511.9 |
| Fixed 128/0 | 84 | 83.85% | 6.70% | 6.67% | 512.0 |
| Fixed 128/32 | 111 | 88.55% | 6.80% | 6.75% | 512.0 |
| Fixed 192/0 | 56 | 79.79% | 6.84% | 6.82% | 455.0 |
| Sentence 128/0 | 93 | 81.52% | 6.40% | 6.33% | 484.0 |
| Recursive 128/0 | 99 | 87.05% | 6.85% | 6.82% | 498.6 |
| Semantic 128/0 | 570 | 87.31% | 6.41% | 6.34% | 511.7 |

For fixed 128-token chunks, 32-token overlap raised recall from **83.85% to 88.55%**, but **9.21%** of retrieved source-token positions were duplicates. Semantic splitting produced **570 vectors**, versus recursive splitting's **99**, with similar recall. Its adjacent-sentence similarity threshold was fixed at 0.5 before evaluation. These results describe one speech and these configurations; they do not establish a general winner. Published excerpt labels can also omit valid alternative evidence.

[Reproduce the experiment](https://github.com/qdrant/landing_page/blob/codex/chunking-guide/qdrant-landing/content/documentation/headless/chunking/quality-experiment/README.md), download the [result table](/guides_data/chunking/quality-experiment/summary.csv), or inspect the [run metadata](/guides_data/chunking/quality-experiment/run-metadata.json).

<details>
<summary>Scoring and boundary rules</summary>

Let G be the unique labeled source-token positions, U the unique retrieved positions, C the total retrieved positions including repeats, and H the size of their intersection. Recall is H/|G|, precision is H/C, and duplicate-penalized IoU is H/(C + |G| − H).

Sentence splitting uses punctuation and line breaks; recursive splitting tries paragraphs, then sentences, then fixed cuts. Semantic splitting groups adjacent sentence units while their cosine similarity is at least 0.5 and the cap permits. Oversized units are split. These are explicit implementations in the linked script, not library defaults.

The budget counts each chunk's independently tokenized content; relevance uses stable positions from tokenizing the complete source once. All embedding inputs, including special tokens, fit the model's 256-token limit. Source offsets, individual query results, dependency pins, and separate stage timings accompany the script. Timings are from one warm CPU run, not a throughput benchmark.

</details>

### Check Answers Separately

The [Agno/Qdrant walkthrough](https://towardsdev.com/visualizing-chunking-impacts-in-agentic-rag-with-agno-qdrant-ragas-and-llamaindex-part-1-7fe1ee31f5a5) shows an end-to-end evaluation workflow. Freeze the answering model, prompt, and evaluator when comparing chunkers. [Ragas faithfulness](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/) checks support in retrieved context; [factual correctness](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/factual_correctness/) compares the answer with a reference. Test unanswerable questions separately. Neither a supported answer nor a retrieval hit alone proves that every required condition survived.

### Evaluate Images, Video, and Audio

Choose datasets whose labels match the failure you want to measure. These benchmarks support different tests; QA accuracy alone does not measure layout or temporal boundaries.

| Benchmark | What to measure |
| --- | --- |
| [DocVQA](https://www.docvqa.org/datasets/docvqa) | Answer quality on a supplied document image, using average normalized Levenshtein similarity (ANLS). It does not directly label table or chart segmentation. |
| [MP-DocVQA](https://github.com/rubenpt91/MP-DocVQA-Framework) | ANLS across multipage documents, plus answer-page prediction accuracy. Compare OCR chunks with page-image retrieval on the same questions. |
| [DocLayNet](https://github.com/DS4SD/DocLayNet) | Region detection using labeled text, table, and picture boxes. Bounding-box mAP tests whether preprocessing isolates the intended regions. |
| [ViDoSeek](https://github.com/Alibaba-NLP/ViDoRAG) | Reference-page recall and answer quality in visually rich document collections. Despite its name, this is a document benchmark. |
| [AVHaystacks](https://schowdhury671.github.io/magnet_project/) | Video retrieval recall, temporal grounding against annotated evidence intervals, and grounded answer quality. Report retrieval and grounding separately so missing videos remain visible. |
| [ActivityNet-QA](https://github.com/MILVLG/activitynet-qa) | Answer accuracy for video questions. Its QA labels alone do not establish correct clip boundaries. |
| [CASTELLA](https://dcase.community/challenge2026/task-audio-moment-retrieval-from-long-audio) | Audio moment retrieval against caption/time-interval annotations, using temporal recall and mAP at specified IoU thresholds. |

Use the same image and returned-duration budgets, and report actual usage. Hold page resolution, frame sampling, and transcription settings fixed. Score the retrieved page, region, or time interval before scoring the answer.

<details>
<summary>Worked check: video window boundaries</summary>

We tested six window configurations against **50 distinct AVHaystacks evidence intervals** from the 3D-printing annotations. Median evidence duration was **93.5 seconds**. Windows start on a regular grid from time zero; the scorer selects the best matching window using the known annotation.

| Window | Overlap | Best-window IoU, mean | Whole interval in one window |
| --- | --- | --- | --- |
| 10 s | 0% | 0.158 | 1/50 |
| 10 s | 50% | 0.160 | 1/50 |
| 20 s | 0% | 0.274 | 2/50 |
| 20 s | 50% | 0.286 | 3/50 |
| 40 s | 0% | 0.406 | 3/50 |
| 40 s | 50% | 0.434 | 6/50 |

At 40 seconds, overlap increased single-window coverage from 3 to 6 intervals. Most evidence still required multiple windows. This checks boundary geometry using annotations; it does not run video retrieval, transcription, or answer generation. Unknown recording ends are not used to trim windows.

[Reproduce the check](https://github.com/qdrant/landing_page/blob/codex/chunking-guide/qdrant-landing/content/documentation/headless/chunking/quality-experiment/README-temporal.md) or inspect the [per-interval results](/guides_data/chunking/quality-experiment/temporal-results.json).

</details>

## Further Reading

- [Is Semantic Chunking Worth the Computational Cost?](https://arxiv.org/abs/2410.13070)
- [Clever Chunking Methods Aren't (Always) Worth the Effort](https://mburaksayici.com/blog/2025/11/08/not-all-clever-chunking-methods-always-worth-it.html)
- [Visualizing Chunking Impacts in Agentic RAG, Part 1](https://towardsdev.com/visualizing-chunking-impacts-in-agentic-rag-with-agno-qdrant-ragas-and-llamaindex-part-1-7fe1ee31f5a5)
- [Greg Kamradt's five-level text-splitting walkthrough](https://www.youtube.com/watch?v=8OJC21T2SL4)
- [You want to chunk really fast?](https://usefeyn.com/blog/you-want-to-chunk-really-fast/)
- [Chonkie: Chunkers Overview](https://docs.chonkie.ai/oss/chunkers/overview)
- [Qdrant Multivector Document Retrieval with ColPali/ColQwen](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/)
