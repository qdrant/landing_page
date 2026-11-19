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

While setting up and fine-tuning a chunking method, there are a few key decisions to make:

{{< island path="documentation/headless/chunking/decision-flow" ratio="16/9" >}}
![Four connected steps: inspect sources, choose boundary, speed up chunking, and evaluate chunk quality.](/guides_data/chunking/decision-flow.svg)
{{< /island >}}

## 1. Inspect Your Documents

Before selecting a chunking strategy, assess whether your source files need layout-aware preprocessing. When working with visually rich documents, you have three main paths: use traditional **OCR** for simple text extraction, use a **VLM** to convert complex layouts, tables, and charts into structured Markdown before splitting, or skip text chunking entirely by indexing page images directly with multimodal retrievers like **ColPali** or **ColQwen**.

<div class="chunking-source-example">
<figure>
  <a href="/guides_data/chunking/receipt.png" aria-label="Open the full-size Bright Mart receipt">
    <img src="/guides_data/chunking/receipt.png" alt="Bright Mart receipt RCP-602371 dated February 12, 2026: headphones cost $60 and a connecting wire $10. Subtotal $70, tax $17.50, discount minus $0.50, total $87." width="840" height="1659" loading="lazy">
  </a>
</figure>
<div class="chunking-source-example__text mathjax_ignore">

### When to Use VLMs or Text Chunking

For text-heavy PDFs, extract the existing text or use **OCR** for scans, then split it into passages. Keep a short receipt together when it fits the embedding model's token limit.

For forms and tables, use a layout-aware parser such as [Docling](https://docling-project.github.io/docling/) or a **VLM** to produce structured text. Check that amounts remain attached to their labels before chunking.

When converting the layout to text loses meaning, use [**ColPali or ColQwen**](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) to index page images directly. Retain document and page IDs with either approach so results link to the source.

</div>
</div>

<div class="chunking-source-example">
<figure>
  <a href="/guides_data/chunking/retirement-infographic.png" aria-label="Open the full-size Global Retirement Dilemma infographic">
    <img src="/guides_data/chunking/retirement-infographic.png" alt="The Global Retirement Dilemma infographic. Its chart of seniors as a projected share of total population shows the blue U.S. curve above the white World curve across the displayed 2015–2060 range." width="970" height="1615" loading="lazy">
  </a>
</figure>
<div class="chunking-source-example__text">

### Diagrams, Charts, and Graphs

To use **text embeddings**, convert each figure into a description or table with a VLM, then chunk that text with its caption. Verify numbers and relationships against the original; use the underlying chart data when available.

To search the **visual content directly**, index page images with **ColPali** or **ColQwen**. This is useful when questions depend on curves, spatial arrangement, or connections between nodes. If you crop a figure into its own retrieval unit, include its axes, legend, and caption, and retain a link to the full page.

#### ColPali, ColQwen, and Other Qdrant Options

ColPali/ColQwen encode page patches and query tokens as multivectors. Qdrant's `MAX_SIM` sums each query vector's best page-vector similarity; answering requires separate inference.

- [ColPali v1.3](https://huggingface.co/Qdrant/colpali-v1.3-fp16): FastEmbed ONNX; **448 × 448** pixels.
- [ColQwen2 v1.0](https://huggingface.co/vidore/colqwen2-v1.0): dynamic resolution, preserved aspect ratio; tune the patch budget.
- [ColModernVBERT](https://huggingface.co/Qdrant/colmodernvbert): approximately **250M parameters**; FastEmbed CPU/GPU multivectors.
- [Voyage multimodal 3.5](/documentation/embeddings/voyage/#embed-images): dense vectors for text/image inputs.

[Qdrant's PDF tutorial](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) combines pooled candidate retrieval with full multivector reranking. Measure storage and latency; check image budgets.

<p class="chunking-source-credit">Historical infographic: Dave Merrill / Bloomberg Visual Data. Its projections are not current statistics.</p>

</div>
</div>

<div class="chunking-source-example">
<figure>
  <a href="/guides_data/chunking/handwritten-page.png" aria-label="Open the full-size handwritten page">
    <img src="/guides_data/chunking/handwritten-page.png" alt="A page of cursive handwriting on aged paper, including the line How often did I think of you." width="600" height="948" loading="lazy">
  </a>
</figure>
<div class="chunking-source-example__text">

### Handwriting: Verify Recognition Before Splitting

For searches over the words, use **handwriting recognition or a VLM** to transcribe the page. Correct uncertain words against the scan, then group sentences into passages within the embedding limit. Handwritten line breaks rarely make useful chunk boundaries on their own.

When annotations, placement, or drawings matter, test **page-image retrieval** with ColPali or ColQwen. Keep the scan available with any transcription so readers can inspect the original.

</div>
</div>

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

### Video Chunking

For lectures and interviews, **transcribe the speech** and chunk the transcript by topic, retaining timestamps for each passage. For demonstrations or visual actions, **embed the video segments** themselves; still frames can miss motion. [TwelveLabs](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/video) supports visual and audio embeddings with fixed or dynamic segmentation.

Start with short time windows, then adjust boundaries to keep each explanation or action together. Keep transcripts, frames, and clips linked by recording ID and start/end timestamps. Fit each segment within the embedding model's duration limit.

[Reproduce the example](https://github.com/qdrant/landing_page/blob/codex/chunking-guide/qdrant-landing/content/documentation/headless/chunking/media-demo/README.md).

</div>
</div>

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

### Voice and Audio Chunking

For podcasts, interviews, and meetings, use **speech-to-text** and split the transcript into complete thoughts or topics. Add speaker diarization when you need to distinguish speakers, and keep related turns together. Retain timestamps so each text chunk links to its audio.

For music or environmental sounds, **embed audio segments directly** with an [audio embedding model](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/audio). Use silence or sound changes as candidate boundaries, then check that clips preserve the event and fit the model's duration limit. A pause alone does not necessarily end a thought.

[Inspect the example transcript](/guides_data/chunking/media-demo/transcript.raw.json).

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

{{< island path="documentation/headless/chunking/fixed" ratio="16/11" >}}
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

{{< island path="documentation/headless/chunking/sentence" ratio="16/11" >}}
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

{{< island path="documentation/headless/chunking/paragraph" ratio="16/11" >}}
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

{{< island path="documentation/headless/chunking/sliding-window" ratio="16/11" >}}
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

{{< island path="documentation/headless/chunking/semantic" ratio="16/11" >}}
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

{{< island path="documentation/headless/chunking/agentic" ratio="16/11" >}}
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

{{< island path="documentation/headless/chunking/recursive" ratio="8/5" >}}
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

## Conclusion

- **Start with the source.** Check extracted text against the original. Use page images when layout carries evidence, and retain timestamped audio and video segments.
- **Keep chunks usable.** Keep statements with their conditions, stay within the embedding model's token limit, and attach source identifiers for citations.
- **Establish a simple baseline.** Try fixed, sentence, paragraph, or recursive splitting before adding semantic or LLM-based boundary decisions.
- **Measure the tradeoffs.** Overlap repeats evidence; model-based boundaries add ingestion work. Profile the pipeline before optimizing it.
- **Choose with evidence.** Compare methods with fixed questions, models, search settings, and evidence budgets. Measure coverage, duplication, and ingestion cost; check answer correctness separately.

## Further Reading

- [Is Semantic Chunking Worth the Computational Cost?](https://arxiv.org/abs/2410.13070)
- [Clever Chunking Methods Aren't (Always) Worth the Effort](https://mburaksayici.com/blog/2025/11/08/not-all-clever-chunking-methods-always-worth-it.html)
- [Visualizing Chunking Impacts in Agentic RAG, Part 1](https://towardsdev.com/visualizing-chunking-impacts-in-agentic-rag-with-agno-qdrant-ragas-and-llamaindex-part-1-7fe1ee31f5a5)
- [Greg Kamradt's five-level text-splitting walkthrough](https://www.youtube.com/watch?v=8OJC21T2SL4)
- [You want to chunk really fast?](https://usefeyn.com/blog/you-want-to-chunk-really-fast/)
- [Chonkie: Chunkers Overview](https://docs.chonkie.ai/oss/chunkers/overview)
- [Qdrant Multivector Document Retrieval with ColPali/ColQwen](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/)
