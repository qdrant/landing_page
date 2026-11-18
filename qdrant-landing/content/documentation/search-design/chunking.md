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

**Question:** Why is the total $87.00 rather than $70.00?

The extracted text must preserve these label-value pairs:

| Label | Value |
| --- | --- |
| Subtotal | $70.00 |
| Tax (25%) | $17.50 |
| Discount | −$0.50 |
| Total | $87.00 |

The answer follows from **$70.00 + $17.50 − $0.50 = $87.00**. Check the amounts, labels, and discount sign against the image before embedding.

Start with **OCR followed by text chunking**. Keep this short receipt as one chunk if it fits the embedding budget, with its receipt ID, date, and source-image reference. Separating the total from the tax and discount would lose the explanation. Visual retrieval adds little for this question when extraction preserves those fields.

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

**Question:** Does the U.S. or the world have the higher projected share of seniors across the chart's 2015–2060 range?

The **U.S. curve stays above the World curve**. OCR that returns only the labels and axis values omits this relationship.

Test **visual retrieval**: ColPali or ColQwen can retrieve the page; an image-capable answering model must then read the chart. Keep the title, axes, curves, series labels, and "projected" qualifier together, whether you supply the page or a chart region. Check that small labels remain readable after resizing.

If verified chart extraction already captures this relationship, text retrieval can also answer it. See [VLMs or text chunking](#when-to-use-vlms-or-text-chunking) for the model and storage choices.

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

**Question:** What does the line beginning "How often" say?

The reference transcription is **"How often did I think of you"**.

Compare handwriting-recognition or generative VLM output with the scan, marking uncertain words for review. A VLM transcription also needs verification. Index verified text with page and line references, and retain the scan so a result can be checked against the original.

A mistranscribed word is a recognition error. Changing chunk size cannot recover the missing wording. Once recognition is reliable, group lines into complete passages rather than treating every handwritten line as an independent chunk.

</div>
</div>

## 2. Choose Meaningful Boundaries

Start with reliable document structure. In a project handbook, group an export procedure with its definition and linked-file exception; keep an unrelated billing FAQ separate. Split sections that exceed your size cap or mix topics.

For Markdown, the [header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) groups text by headings and records their hierarchy as metadata. It strips headings by default; retain useful titles in the embedding input.

Methods can be combined: group whole sentences to a size cap, for example, then overlap neighboring chunks.

<details class="chunking-method-menu">
<summary>Choose a chunking method</summary>

- [Fixed chunking](#fixed-chunking)
- [Sentence chunking](#sentence-chunking)
- [Paragraph chunking](#paragraph-chunking)
- [Sliding-window chunking](#sliding-window-chunking)
- [Semantic chunking](#semantic-chunking)
- [Agentic chunking](#agentic-chunking)
- [Recursive chunking](#recursive-chunking)

</details>

### Fixed Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Predictable sizes and repeatable boundaries, even with poor formatting.
- No embedding or LLM calls needed to choose boundaries.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
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

### Sentence Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Preserves statements without embedding comparisons or LLM calls.
- Grouping adjacent sentences can retain nearby context.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
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

### Paragraph Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Preserves the author's grouping of ideas without model inference.
- Can combine short paragraphs within a section.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
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

### Sliding-Window Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Repeats nearby context across boundaries without model inference.
- Window size and stride determine source coverage.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
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

### Semantic Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Can detect topic changes that formatting misses.
- Allows variable lengths for related passages.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
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

### Agentic Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Lets an LLM interpret passage roles and document-specific instructions.
- Can preserve source wording by selecting boundaries for direct slicing.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
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

### Recursive Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Preserves units that fit and subdivides oversized ones.
- Supports format-specific separators without model inference.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
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

Compare the simplest suitable baseline with a method that addresses a specific failure. Use the same questions and [retrieved-text budget](#5-test-the-evidence-that-reaches-the-answer), recording splitting time and model usage alongside evidence coverage.

## Beyond Text: Choose the Evidence Unit

Text remains the focus of this guide, but a text splitter can only preserve information that extraction captures. For visually rich documents, recordings, and audio, first decide which representation can carry the answer. Then choose its boundaries.

### When to Use VLMs or Text Chunking

Many traditional PDF retrieval pipelines combine text extraction, **optical character recognition (OCR)** for scanned content, and layout analysis with rules tailored to particular document types. Reconstructing tables, associating captions with figures, and interpreting charts require more than recognizing words. Rules tuned to one template may fail on another, even within the same domain: an annual report can move its headers, change its columns, or encode a comparison in a chart. These ingestion failures are part of the motivation for [Qdrant's visual document retrieval approach](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/). Changing the text splitter cannot recover information that extraction discarded.

Use **text chunking** when extracted text or structured tables preserve the evidence your questions need. Use a **vision-language model (VLM) adapted for retrieval** when answers depend on visual relationships that extraction repeatedly loses. ColPali and ColQwen are examples of such retrievers. They embed page images directly, avoiding a separate OCR and layout-reconstruction pipeline for indexing. You still render and preprocess the images, choose a page or region as the retrieval unit, and respect the model's input limits.

| Document and question | Starting approach |
| --- | --- |
| Readable policies or manuals; the answer is stated in prose | Use text chunks with useful headings and source references. Page images add little when the relevant evidence already survives extraction. |
| Scanned, mostly textual pages with reliable OCR | OCR followed by text chunking remains a reasonable baseline. Being a scan alone does not require visual retrieval. |
| Charts, flowcharts, or complex tables; the answer depends on a trend, arrow, legend, or row/column relationship missing from extraction | Test VLM-based page retrieval and give the retrieved image to an image-capable answering model. |
| Reports in one domain but with changing layouts; parsing repeatedly scrambles evidence | Compare visual retrieval with repairing the parser. Page-image indexing can reduce dependence on template-specific rules. |
| Explanatory prose and figures both carry required evidence | Keep linked text and image representations, and assemble both when needed. |

#### ColPali, ColQwen, and Other Qdrant Options

ColPali and ColQwen encode a page into multiple vectors associated with image patches, and a text query into token vectors. **Late interaction** matches each query vector against the page vectors and combines those matches into a page score. Qdrant can store these multivectors and compute that matching with its `MAX_SIM` comparator. Generating the embeddings is a separate model-inference step.

| Visual retriever | Documented Qdrant route and practical distinction |
| --- | --- |
| [ColPali v1.3](https://huggingface.co/Qdrant/colpali-v1.3-fp16) | Qdrant provides a FastEmbed-compatible ONNX model and multivector search example. This variant resizes pages to 448 × 448 pixels; inspect whether small text and dense figures remain usable. |
| [ColQwen2 v1.0](https://huggingface.co/vidore/colqwen2-v1.0) | Uses dynamic image resolution while preserving aspect ratio. Its patch budget trades image detail against memory use. The [Qdrant ColPali/ColQwen tutorial](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) documents the family integration, including pooled candidates followed by full multivector reranking. |
| [ColModernVBERT](https://huggingface.co/Qdrant/colmodernvbert) | A smaller, approximately 250-million-parameter visual retriever. Qdrant's ONNX export supports CPU/GPU inference through FastEmbed, making it another candidate when local inference resources matter. It also produces multivectors. |

Visual retrieval can also use a single dense vector per input. For example, Qdrant's [Voyage AI integration](/documentation/embeddings/voyage/#embed-images) shows how to embed mixed text/image inputs with `voyage-multimodal-3.5` through the provider API and store the resulting vectors. This is a different storage and scoring choice from patch-level multivectors.

Choose a retrieval encoder separately from the model that reads the retrieved evidence and writes an answer. A generative VLM can also describe a figure before text embedding, but its description may omit a value or relationship. Preserve the original image and verify generated descriptions. For page retrieval, inspect small labels after resizing, measure vector storage and inference/search latency, and check the image budget of the answering model. Visual retrieval changes the representation; it does not remove size limits or guarantee correct answers.

For the implementation, follow [Qdrant Multivector Document Retrieval with ColPali/ColQwen](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/). It walks through page embeddings, pooling for candidate retrieval, and reranking with the original multivectors.

#### What Visual Retrieval Benchmarks Show

The original **Visual Document Retrieval benchmark, ViDoRe (v1)**, provides a concrete reason to test this approach. In the [ColPali paper's Table 2](https://arxiv.org/html/2407.01449v6#S5.T2), the paper's ColPali configuration achieved **81.3 average nDCG@5**, compared with **66.1** for Unstructured + OCR + BGE-M3 and **67.0** for Unstructured + captioning + BGE-M3 across ten tasks. These are page-ranking scores on a 0–100 scale: nDCG@5 measures the quality of the top five ranked results, not the percentage of questions answered correctly. The result supports testing visual retrieval on visually rich documents; it does not rank every current model or PDF pipeline.

Newer [ViDoRe v3 evaluations](https://arxiv.org/abs/2601.08620) also examine answer generation and visual grounding. In the authors' [2026 comparison of retrieval pipelines](https://huggingface.co/blog/antoineedy/vidore-v3-pipeline-framework-and-leaderboard), a text-input pipeline using Jina embeddings v4 and ZeRank2 led the leaderboard at its release, despite the advantage of visual models in single-retriever comparisons. That ranking measures retrieval quality. OCR quality, retrieval, reranking, and the evidence supplied to the answer all affect the outcome. Use benchmark results to choose candidates, then judge the complete pipeline against your own documents and questions.

### Diagrams, Charts, and Graphs

Treat a figure and the context needed to interpret it as a unit. For a chart, preserve axes, units, legend, caption, and relevant footnotes. For a flowchart or network graph, preserve connected nodes, arrow direction, and edge labels. Cropping away the legend or an arrow endpoint can lose evidence just as cutting away an exception does in text.

If a page contains unrelated figures, test separate figure regions while retaining their captions and a link to the full page. Store document ID, page number, and bounding-box coordinates alongside each region. [Docling's document representation](https://docling-project.github.io/docling/reference/docling_document/) provides picture elements, captions, and source provenance for this kind of pipeline. Prefer source data or verified extracted tables when exact chart values matter; a generated summary should not be the only record of them.

### Video Chunking

Use time ranges as chunks. Fixed-duration clips are a baseline; scene, topic, or demonstration boundaries may keep an action and its outcome together more reliably. [TwelveLabs' video embedding interface](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/video) illustrates fixed and content-adaptive temporal segmentation. A camera cut alone does not establish a complete explanation.

Link each clip's transcript, sampled frames, and source video with the same video ID and start/end timestamps. Text chunks can retrieve what a speaker said; they cannot recover an unspoken action visible only on screen. For that question, retrieve visual evidence and supply it to a model that can use it. Check frame sampling as well as clip boundaries: a brief but decisive event can fall between sampled frames.

### Voice and Audio Chunking

For meetings, interviews, and podcasts, start with transcript chunks that preserve a complete statement or exchange. Keep speaker labels and timestamps so a match can lead back to the recording; [timestamped utterances](https://assemblyai.github.io/assemblyai-node-sdk/types/TranscriptUtterance.html) provide one useful source unit. A speaker change or pause is a candidate boundary, but a question and its answer may need to remain together. Check transcription errors before blaming the splitter.

Retain the audio when questions concern sounds absent from the transcript, such as an alarm or music. Use suitable audio embeddings and bounded time segments for those questions; [audio-content and transcript representations](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/audio) carry different evidence. Check the chosen model's duration and input limits, and ensure the answering stage receives the relevant audio or verified evidence extracted from it.

Across these modalities, retain a path to the original source and inspect the complete unit the model receives. For the handbook's text pipeline, the next decision is how much text each stage can accept.

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
