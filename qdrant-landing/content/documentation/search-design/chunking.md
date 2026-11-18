---
title: "How to Choose a Chunking Strategy"
short_description: "Choose boundaries, size, and overlap from your documents and questions. Follow a worked example from missing evidence to a repair you can test."
description: "Choose a chunking strategy for RAG: preserve meaningful boundaries, budget size and overlap, add context where needed, and diagnose retrieval failures."
author: Ewa Szyszka
date: 2026-11-12T00:00:00.000Z
draft: false
weight: 20
---

<link rel="stylesheet" href="/guides_data/chunking/figures.css">

# Why Chunking Matters

Every embedding model has an input context limit: [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2#intended-uses) truncates beyond 256 word pieces by default; [BGE-M3](https://huggingface.co/BAAI/bge-m3#specs) supports up to 8,192 tokens. Oversized inputs may be rejected; truncation discards information. A single document vector can also blur topic distinctions. Chunking gives focused passages individual vectors and [metadata](/documentation/manage-data/payload/), such as document IDs and page numbers, for filtering and citations.

Boundaries must preserve related evidence. [Qu et al.](https://arxiv.org/abs/2410.13070) found inconsistent semantic-chunking gains over fixed groups of whole sentences; [Sayıcı's EUR-Lex experiment](https://mburaksayici.com/blog/2025/11/08/not-all-clever-chunking-methods-always-worth-it.html) also challenges added complexity. Compare evidence coverage and ingestion cost. Larger answer windows don't remove embedding limits, and parsing errors can lose evidence before splitting.

{{< island path="documentation/headless/chunking/decision-flow" ratio="16/9" >}}
![Five connected steps: inspect sources, choose boundary, set size and overlap, add missing context, and test final evidence.](/guides_data/chunking/decision-flow.svg)
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

#### What Visual Retrieval Benchmarks Show

[ColPali Table 2](https://arxiv.org/html/2407.01449v6#S5.T2) reports average **nDCG@5 (0–100)** across **ten ViDoRe v1 tasks**, using the paper's configuration:

| Pipeline | Average nDCG@5 |
| --- | --- |
| ColPali | 81.3 |
| Unstructured + OCR + BGE-M3 | 66.1 |
| Unstructured + captioning + BGE-M3 | 67.0 |

These scores measure ranking, not answer correctness.

[ViDoRe v3](https://arxiv.org/abs/2601.08620) adds answer generation and visual grounding. Its [2026 pipeline comparison](https://huggingface.co/blog/antoineedy/vidore-v3-pipeline-framework-and-leaderboard) placed text-input Jina embeddings v4 + ZeRank2 first for retrieval at release. Compare complete pipelines on your data.

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
<figure class="chunking-run-example">
  <a href="/guides_data/chunking/media-demo/?view=video&amp;chunk=v04" aria-label="Open the actual video chunking results and play the recording">
    <img src="/guides_data/chunking/video-run.png" alt="Actual FFmpeg output from NASA's Apollo 11 recording: window 4 of 6 spans 00:36–00:48, with a source frame extracted at 00:42." width="640" height="1089" loading="lazy">
  </a>
  <figcaption>Actual run on NASA footage. Open the recording and all six video windows.</figcaption>
</figure>
<div class="chunking-source-example__text">

- **Boundary:** Start with fixed-duration windows; use scene or topic boundaries when they preserve a complete action. [TwelveLabs supports fixed and dynamic segmentation](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/video).
- **Evidence:** Link frames, transcript, and clip through a source ID and start/end timestamps. Transcript embeddings alone cannot recover actions the speaker does not describe. Check frame sampling and model duration limits.
- **Actual run:** The script divides a 61.5-second NASA recording into six ranges capped at 12 seconds; FFmpeg extracts each midpoint frame. One frame can miss an action: replay the complete interval before judging its evidence.

[Explore the results](/guides_data/chunking/media-demo/?view=video) or [reproduce the run](https://github.com/qdrant/landing_page/blob/codex/chunking-guide/qdrant-landing/content/documentation/headless/chunking/media-demo/README.md).

</div>
</div>

### Voice and Audio Chunking

<div class="chunking-source-example">
<figure class="chunking-run-example">
  <a href="/guides_data/chunking/media-demo/?view=audio&amp;chunk=a04" aria-label="Open the actual audio chunking results and replay the source">
    <img src="/guides_data/chunking/audio-run.png" alt="Actual Whisper base.en output: eight timestamped text chunks and a waveform computed from NASA audio. Selected chunk 4 spans 00:12.30–00:21.16; its raw transcript contains a recognition error, fine green." width="640" height="1039" loading="lazy">
  </a>
  <figcaption>Measured audio and uncorrected ASR output. Open the results to replay each chunk.</figcaption>
</figure>
<div class="chunking-source-example__text">

- **Boundary:** Use ASR timestamps; add diarization when speaker identity matters. Keep dependent turns together. Pauses can occur inside a sentence.
- **Evidence:** Retain recording IDs and source offsets. Non-speech events require the original audio and a suitable [audio embedding model](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/audio).
- **Actual run:** A Whisper base.en transcript is split into eight chunks using punctuation, ASR word gaps of at least 0.8 seconds, and a 12-second cap. It misrecognizes "fine-grained" as "fine green"; the gap rule also splits an unfinished phrase. Repair recognition and boundary errors before embedding.

[Replay the chunks and inspect the raw output](/guides_data/chunking/media-demo/?view=audio). This single-speaker example does not run diarization or retrieval.

</div>
</div>


## 2. Choose Meaningful Boundaries

Start with reliable document structure. In a project handbook, group an export procedure with its definition and linked-file exception; keep an unrelated billing FAQ separate. Split sections that exceed your size cap or mix topics.

For Markdown, the [header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) groups text by headings and records their hierarchy as metadata. It strips headings by default; retain useful titles in the embedding input.

Methods can be combined: group whole sentences to a size cap, for example, then overlap neighboring chunks.

<details class="chunking-method" id="fixed-chunking">
<summary>Fixed chunking</summary>

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Predictable sizes and repeatable boundaries, even with poor formatting.
- No embedding or LLM calls needed to choose boundaries.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Can separate instructions from conditions or mix unrelated topics.
- Overlap adds embedding work and duplicate evidence.
- Word or character limits do not enforce model token limits.

</details>

Fixed chunking advances through text in windows of a chosen length. A 400-token window with 40-token overlap advances by 360 tokens. Use it as a simple baseline; the length alone does not establish complete evidence.

Check the counting unit. [Agno's fixed-size chunker](https://docs.agno.com/knowledge/concepts/chunking/fixed-size-chunking) counts characters and avoids cutting words where possible; the [Essentials example](/course/essentials/day-1/chunking-strategies/#1-fixed-size-chunking) counts words. For a token cap, use the embedding model's tokenizer, including any added titles or context.

In the handbook, a cut after the export procedure separates its linked-file exception. Repair that boundary or supply the missing source context.

{{< island path="documentation/headless/chunking/fixed" ratio="16/11" title="Fixed windows advance by size minus overlap. Change the word count and overlap, then select a chunk to inspect its source span. Dashed words repeat from the preceding chunk." >}}
![Twelve-word windows over a 31-word source: zero overlap gives three chunks; three-word overlap gives four chunks with repeated source positions.](/guides_data/chunking/fixed.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="sentence-chunking">
<summary>Sentence chunking</summary>

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Preserves statements without embedding comparisons or LLM calls.
- Grouping adjacent sentences can retain nearby context.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Definitions, pronouns, and exceptions can depend on another sentence.
- Abbreviations, lists, and language-specific punctuation complicate segmentation.
- Long sentences may require finer splitting; sentence counts are not token limits.

</details>

Sentence chunking indexes individual sentences or groups consecutive ones until the next would exceed a cap. [Chonkie's sentence chunker](https://docs.chonkie.ai/oss/chunkers/sentence-chunker) implements this approach.

In the handbook, "Download those files separately" needs the preceding sentence identifying linked files. Group them, or preserve their source relationship for expansion after retrieval.

{{< island path="documentation/headless/chunking/sentence" ratio="16/11" title="Sentence boundaries stay intact as adjacent sentences are grouped. Compare one sentence per chunk with grouping under a word cap. At 20 words, the linked-file statement and its download instruction fit together; at 8, the 9-word sentence needs a finer split. Counts are words, not model tokens." >}}
![Three sentences contain 8, 9, and 6 words. A 12-word cap keeps them separate; a 20-word cap groups the first two into a 17-word chunk. An 8-word cap cannot contain the 9-word sentence intact.](/guides_data/chunking/sentence.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="paragraph-chunking">
<summary>Paragraph chunking</summary>

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Preserves the author's grouping of ideas without model inference.
- Can combine short paragraphs within a section.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- PDF line wrapping can create false paragraph breaks.
- Definitions or conditions may sit elsewhere.
- Oversized paragraphs need a finer splitter.

</details>

Paragraph chunking keeps paragraphs intact, optionally packing adjacent ones within the same section. Retain section titles and check extracted paragraph boundaries before splitting PDFs.

The handbook's definition, procedure, and exception occupy three paragraphs but govern one task. Group them or supply their shared section when a question needs all three.

{{< island path="documentation/headless/chunking/paragraph" ratio="16/11" title="Paragraphs can be packed together without crossing a section heading. At a 24-word cap, the first two export paragraphs form one chunk; at 48, all three fit. Billing remains separate in both cases. A paragraph that exceeds the cap is flagged for a finer split." >}}
![Export paragraphs P1, P2, and P3 contain 10, 12, and 15 words; Billing paragraph P4 contains 8. Packing at 24 words groups P1 and P2. Packing at 48 groups P1 through P3. The section boundary keeps P4 separate.](/guides_data/chunking/paragraph.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="sliding-window-chunking">
<summary>Sliding-window chunking</summary>

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Repeats nearby context across boundaries without model inference.
- Window size and stride determine source coverage.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Repeated text increases embedding work and storage.
- Overlapping hits can waste result slots and answer-context space.
- Dependencies extending beyond the window remain separated.

</details>

A sliding window advances by a **stride**. A 400-token window with a 360-token stride repeats 40 tokens; three-sentence windows with a two-sentence stride repeat one sentence. Try overlap for conditions just across a boundary. Preserve source offsets to merge repeated spans during answer assembly.

[LlamaIndex's sentence-window retrieval](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/sentence_window/) instead indexes individual sentences and stores neighbors as metadata. The application supplies that surrounding text after retrieval; it is not part of the embedded window.

{{< island path="documentation/headless/chunking/sliding-window" ratio="16/11" title="Keep the window at three sentences and change how far it advances. A stride of three separates the linked-file statement from its instruction. A stride of two puts them together in a window, with two repeated sentence appearances across the output. Select a chunk to trace its source span." >}}
![Six sentences form two non-overlapping three-sentence chunks at stride 3. At stride 2, the windows are S1–S3, S3–S5, and S5–S6; S3 and S5 repeat. The linked-file statement S3 and download instruction S4 share the middle window.](/guides_data/chunking/sliding-window.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="semantic-chunking">
<summary>Semantic chunking</summary>

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Can detect topic changes that formatting misses.
- Allows variable lengths for related passages.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Adds embedding work before indexing the finished chunks.
- Boundaries depend on segmentation, the model, and thresholds.
- Similarity guarantees neither independent evidence nor valid token lengths.

</details>

A common semantic splitter embeds sentences with neighboring context and splits where adjacent groups' vectors differ sufficiently. Try it when simpler rules repeatedly combine unrelated topics. [LlamaIndex's implementation](https://developers.llamaindex.ai/python/examples/node_parsers/semantic_chunking/) follows this pattern.

Controls differ: lowering LlamaIndex's [dissimilarity percentile](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/semantic_splitter/) produces more splits; raising [Agno's similarity threshold](https://docs.agno.com/knowledge/concepts/chunking/semantic-chunking) does likewise. Inspect boundaries and final token lengths. In the handbook, separating export from billing helps, but separating export steps from their exception loses necessary context.

{{< island path="documentation/headless/chunking/semantic" ratio="16/11" title="Semantic boundaries depend on the similarity rule. With these illustrative scores, raising the threshold from 0.35 to 0.65 separates the steps from the linked-file exception. No embedding model runs in this demo." >}}
![Illustrative semantic scores produce two chunks at threshold 0.35 and three at 0.65. The 0.56 similarity between export steps and the linked-file exception becomes a split.](/guides_data/chunking/semantic.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="agentic-chunking">
<summary>Agentic chunking</summary>

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Lets an LLM interpret passage roles and document-specific instructions.
- Can preserve source wording by selecting boundaries for direct slicing.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Adds ingestion latency and model costs.
- Decisions depend on the prompt, model, and visible source window.
- Invalid responses need validation and fallback splitting.

</details>

Here, agentic chunking means an LLM chooses source boundaries during ingestion. An agent searching a knowledge base can use any chunking method. Try this approach when failed splits require interpretation that simpler rules cannot provide.

[Agno](https://docs.agno.com/knowledge/concepts/chunking/agentic-chunking) asks for a character position, then slices the original text; `max_chunk_size` counts characters. Its [validation and fallback logic](https://github.com/agno-agi/agno/blob/main/libs/agno/agno/knowledge/chunking/agentic.py) can also determine boundaries. Record which path ran.

The handbook's linked-file exception can guide the split only if it fits in the model's source window. Compare evidence gains against ingestion cost.

{{< island path="documentation/headless/chunking/agentic" ratio="16/11" title="An LLM can only consider the source window it receives. Compare two scripted decisions: one ends after the steps; the wider window also includes the exception. The output copies the selected source span. No model is called." >}}
![A scripted agentic example: a window containing S1–S2 ends after the export steps; a wider window containing S1–S4 can keep the linked-file exception. Both outputs retain source wording.](/guides_data/chunking/agentic.svg)
{{< /island >}}

</details>

<details class="chunking-method" id="recursive-chunking">
<summary>Recursive chunking</summary>

<details class="chunking-tradeoffs chunking-tradeoffs--strengths" open>
<summary>Strengths</summary>

- Preserves units that fit and subdivides oversized ones.
- Supports format-specific separators without model inference.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses" open>
<summary>Weaknesses</summary>

- Separators cannot identify dependencies between passages.
- Poor extraction can force word or character cuts.
- Overlap is a target; the configured counting function determines length.

</details>

Recursive chunking tries coarse separators first, finer ones for oversized pieces, then packs pieces within the cap. It suits prose with useful paragraph breaks and uneven lengths.

[LangChain](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter) defaults to paragraph breaks, line breaks, spaces, then characters, measuring length in characters. This does not guarantee complete sentences or preserve heading hierarchy. Adapt separators to your language and format; use [token-aware configuration](https://docs.langchain.com/oss/python/integrations/splitters/split_by_token) for a tokenizer-specific cap.

Keep governing conditions with each subtask, or retain their section relationship and [supply context after retrieval](#4-add-context-where-needed).

{{< island path="documentation/headless/chunking/recursive" ratio="8/5" title="Recursive splitting preserves units that fit and subdivides those that do not. Step through a custom paragraph → sentence → word hierarchy, then pack the pieces within the selected word cap. This illustrates the mechanism, not LangChain's default separators." >}}
![With a 24-word cap, the 12-word and 5-word paragraphs remain intact. Only the 30-word paragraph is split into sentences of 8 and 22 words.](/guides_data/chunking/recursive.svg)
{{< /island >}}

</details>

Compare the simplest suitable baseline with a method that addresses a specific failure. Use the same questions and [retrieved-text budget](#5-test-the-evidence-that-reaches-the-answer), recording splitting time and model usage alongside evidence coverage.

## Available Frameworks and Libraries

| Tool | Useful starting point |
| --- | --- |
| [LangChain text splitters](https://docs.langchain.com/oss/python/integrations/splitters/index) | Length-based, recursive, and document-format splitting. |
| [LlamaIndex node parsers](https://developers.llamaindex.ai/python/framework/module_guides/loading/node_parsers/modules/) | Sentence, semantic, and hierarchical splitting within an indexing pipeline. |
| [Agno chunking](https://docs.agno.com/knowledge/concepts/chunking/overview) | Fixed, recursive, semantic, and LLM-selected boundaries in Agno knowledge ingestion. |
| [Chonkie](https://docs.chonkie.ai/oss/chunkers/overview) | A dedicated ingestion library with multiple chunkers, including semantic and neural approaches. |
| [Kiru](https://github.com/bitswired/kiru) | Rust core with Python bindings for byte or character chunking, streaming files, and parallel document processing. |
| [semchunk](https://github.com/isaacus-dev/semchunk) | Python splitting with a hierarchy of structural boundaries and a configurable tokenizer or token counter. |
| [text-splitter](https://github.com/benbrandt/text-splitter) / `semantic-text-splitter` | Rust splitting for plain text, Markdown, and code, with Python bindings under the second name. |
| [memchunk, now Chunk](https://github.com/feyninc/chunk) | Rust delimiter-based byte splitting with Python bindings, designed to minimize boundary-search and copying work. |
| [Chonky](https://github.com/mirth/chonky) | A trained token-classification model that predicts chunk boundaries. |
| [Docling](https://docling-project.github.io/docling/) / [Unstructured](https://docs.unstructured.io/open-source/core-functionality/partitioning) | Parse documents into structured elements before forming retrieval chunks. |

Chonky and Chonkie are separate projects; Chonkie also offers a [neural chunker using Chonky models](https://docs.chonkie.ai/oss/chunkers/neural-chunker). [Sentence Transformers](https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html) can supply sentence embeddings for a semantic splitter, but the splitting rule and thresholds still need to be defined.

The word "semantic" in a package description does not always mean embedding-based boundary detection. `text-splitter` uses structural and Unicode boundaries; semchunk's default mode also follows structural rules, while its optional AI mode calls an enrichment model. Inspect the implementation you actually configure. For throughput, see [Speed Up Chunking After Finding the Bottleneck](#speed-up-chunking-after-finding-the-bottleneck).

## 3. Fit Size and Overlap to Your Constraints

Check two budgets with the respective model's tokenizer:

- **Embedding input:** Each chunk must fit, including titles, context, prefixes, and special tokens. Inspect lengths with truncation disabled so an oversized input cannot hide behind a shortened count.
- **Answer context:** Retrieved evidence must share the remaining space after instructions, the question, history, and reserved output. Include any context added after retrieval.

Words, characters, and another model's tokens are not interchangeable. See [Hugging Face's tokenizer controls](https://huggingface.co/docs/transformers/main_classes/tokenizer) or your provider's counting tools.

### Set a Cap Without Treating It as a Target

Keep short, complete units intact. Split oversized units at finer meaningful boundaries, preserving needed definitions and exceptions. If retrieved passages exceed the answer budget, use fewer passages or allocate more evidence space where possible.

Smaller chunks isolate facts but may require several hits to reconstruct a task. Larger chunks preserve context but can crowd out other evidence. More chunks and repeated text also increase indexing and embedding work.

### Add Overlap Only Where It Repairs a Boundary

Start with zero overlap for independent entries. For dependent prose, test carrying a needed sentence or paragraph into the next chunk. Inspect the output: structural boundaries can prevent the requested overlap.

Overlap can preserve a nearby definition, but cannot reliably recover a distant exception. Deduplicate repeated source spans so similar hits do not consume the answer budget. Keep table headers with their rows and retain source positions in [payload](/documentation/manage-data/payload/). Payload fields do not automatically enter embeddings or answer context.

### Speed Up Chunking After Finding the Bottleneck

Time parsing/OCR, token counting, splitting, model calls, and indexing separately. Faster splitting helps little when OCR or inference dominates.

Minhas's [You want to chunk really fast?](https://usefeyn.com/blog/you-want-to-chunk-really-fast/#benchmarks) describes three optimizations in `memchunk`, now Chunk:

- Search backward from the size cap for an acceptable delimiter.
- Use specialized byte searches: `memchr` can use SIMD for one to three delimiter bytes; larger sets use a 256-entry lookup table.
- Use borrowed slices or offsets during splitting; materializing Python strings still costs time.

Reuse tokenizer instances. [semchunk](https://github.com/isaacus-dev/semchunk) offers token-count memoization and document multiprocessing; batch only when processing outweighs worker overhead. Consume [Kiru](https://github.com/bitswired/kiru) streams incrementally to limit memory. Batch sentence embeddings where supported.

Chunk's [benchmark harness](https://github.com/feyninc/chunk/tree/main/benches) excludes input loading. Compare libraries using matching size units, overlap, tokenizer work, data, and output copying or consumption. Record elapsed time, peak memory, source coverage, and final token lengths. Splitting throughput alone does not establish retrieval quality.

## 4. Add Context Where Needed

Read each chunk alone. Add a concise title and section path **before embedding** if its product, version, or subject is unclear. Preserve any needed definition or exception in source text; a title cannot replace an instruction.

For long sections, [parent-document retrieval](https://reference.langchain.com/python/langchain-classic/retrievers/parent_document_retriever/ParentDocumentRetriever) indexes focused passages, then fetches their surroundings after a match. Your application must retain source links and perform this expansion explicitly. Bound it, merge overlapping passages, and count the expanded text against the answer budget. It still requires a useful initial hit: context added **after retrieval** cannot improve the initial match. Context added **before embedding** changes the representation and consumes the embedding budget.

[Anthropic's contextual retrieval experiments](https://www.anthropic.com/research/contextual-retrieval) prepend generated document context before embedding and lexical indexing, reducing retrieval failures in the tested configurations. Try this when source headings and definitions are insufficient. Check generated text against the source, distinguish it from original evidence, and measure answers as well as retrieval; generation adds cost and can introduce errors.

For the short handbook, start with the complete export section and billing entry, source references, and zero overlap. Use expansion if real sections exceed your limits.

## 5. Test the Evidence That Reaches the Answer

Inspect sample chunks for missing conditions, broken tables or reading order, unclear references, truncation, and correct source/version links.

Build questions covering facts, procedures, and boundary cases. Label required **source passages**, not changing chunk IDs; accept equivalent evidence. A question about sharing a complete project copy needs the export definition, procedure, and linked-file exception. A procedure-only hit is insufficient. Test grouping those passages or expanding the retrieved subtask, then rerun all questions to catch regressions.

Include unanswerable questions and check that answers acknowledge missing information. Score these separately from evidence coverage on answerable questions.

### Compare at the Same Text Budget

Hold documents, models, search configuration, questions, and the final retrieved-text budget fixed. Change one chunking choice at a time. Equal result counts do not provide equal evidence budgets.

Apply the same selection, expansion, and deduplication rules. Record the text and token count actually supplied, including titles and source labels; avoid truncating a condition. Keep the answer prompt and generation settings fixed.

Score separately:

- **Evidence available:** Did every required passage reach the final context? Record omissions, duplicates, and irrelevant text.
- **Answer correct:** Did the answer use that evidence accurately, include conditions, avoid unsupported claims, and cite the correct source?

### Locate the Loss Before Changing the Splitter

| Evidence lost at | Inspect |
| --- | --- |
| Extraction or indexing | Parsing, discarded content, truncation |
| Retrieval | Query, filters, representation, boundaries |
| Context assembly | Ranking, duplication, expansion, budget |
| Answer generation | Prompt and answering model |

Fix the stage responsible, then retest failed and previously passing questions. Record boundaries, tokenizers and limits, overlap, added context, source references, and results. Reassess when documents, questions, models, or budgets change.

## Further Reading

- [Is Semantic Chunking Worth the Computational Cost?](https://arxiv.org/abs/2410.13070)
- [Clever Chunking Methods Aren't (Always) Worth the Effort](https://mburaksayici.com/blog/2025/11/08/not-all-clever-chunking-methods-always-worth-it.html)
- [Visualizing Chunking Impacts in Agentic RAG, Part 1](https://towardsdev.com/visualizing-chunking-impacts-in-agentic-rag-with-agno-qdrant-ragas-and-llamaindex-part-1-7fe1ee31f5a5)
- [Greg Kamradt's five-level text-splitting walkthrough](https://www.youtube.com/watch?v=8OJC21T2SL4)
- [You want to chunk really fast?](https://usefeyn.com/blog/you-want-to-chunk-really-fast/)
- [Chonkie: Chunkers Overview](https://docs.chonkie.ai/oss/chunkers/overview)
- [Qdrant Multivector Document Retrieval with ColPali/ColQwen](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/)
