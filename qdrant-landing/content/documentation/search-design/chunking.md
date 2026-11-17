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

# How to Choose a Chunking Strategy

We chunk documents because each embedding model has a limited input context window. For example, [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2#intended-uses) truncates inputs beyond 256 word pieces by default, while [BGE-M3](https://huggingface.co/BAAI/bge-m3#specs) supports up to 8,192 tokens. If a document exceeds the configured limit, the pipeline may truncate it or reject it. With truncation, discarded text never reaches the embedding, so the resulting vector cannot represent the full document. Splitting the source into chunks that fit the model gives focused passages their own vectors, which can make specific details easier to retrieve than one vector covering many topics. Each chunk can also have [metadata stored alongside its vector](/documentation/manage-data/payload/), such as its document ID, section title, and page number, to support filtering and citations.

Consider a user asking how to share a complete project copy. Search finds the export procedure but misses a separate paragraph requiring linked files to be downloaded separately. The answer follows the retrieved instructions and still leaves the user with an incomplete copy.

This is the problem a chunking strategy must address: **which information needs to reach the answer together?** This guide takes you from that question to boundaries, size and overlap, context, and a testable configuration.

## What the Chunking Debate Means in Practice

**A bad boundary can lose evidence.** A length cut can break a sentence or separate an instruction from its exception. [Recursive splitters](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter) try larger text separators before smaller ones. Even a complete sentence can be incomplete evidence. To investigate a reported "retrieval collapse," trace which source passage the split or retrieval left out.

**Semantic coherence is a hypothesis to test.** [Qu et al. (2024)](https://arxiv.org/abs/2410.13070) compared fixed and semantic chunkers across retrieval and answer-generation tasks. Semantic methods did not consistently outperform the baseline, which grouped **whole sentences**. [Sayıcı's EUR-Lex experiment](https://mburaksayici.com/blog/2025/11/08/not-all-clever-chunking-methods-always-worth-it.html) also questions whether added complexity pays. These findings motivate a comparison on your workload; they do not establish a universal ranking of splitters.

**Model-based splitters do different work.** Embedding-based methods compare sentence vectors. A trained detector such as [Chonky](https://github.com/mirth/chonky) classifies boundaries. An [LLM-based chunker](https://docs.agno.com/knowledge/concepts/chunking/agentic-chunking) can interpret instructions and passage roles. Compare ingestion time, model usage, and final evidence coverage. Check whether the implementation slices source text or generates new text.

**Larger context windows make whole-document input an option.** If you know the relevant document and it fits your answering budget, test supplying it whole. You still need to find relevant material in a large corpus and respect the embedding model's input limit. [Lost in the Middle](https://arxiv.org/abs/2307.03172) found sensitivity to evidence position; [Chroma's 2025 Context Rot experiments](https://www.trychroma.com/research/context-rot) found sensitivity to input length, varying by model and task. Test your current model on representative document lengths and evidence positions.

**Parsing can fail before chunking begins.** Scrambled PDF columns, missing table headers, and repeated headers or footers change the text any splitter receives. Check extraction quality before changing the boundary rule; tools such as [Docling](https://docling-project.github.io/docling/) address this earlier stage.

## Available Frameworks and Libraries

Choose an entry point that fits your pipeline. Check each implementation's counting units and inspect its output.

| Tool | Useful starting point | What to inspect |
| --- | --- | --- |
| [LangChain text splitters](https://docs.langchain.com/oss/python/integrations/splitters/index) | Length-based, recursive, and document-format splitting. | The length function, separator order, overlap, and retained headings. |
| [LlamaIndex node parsers](https://developers.llamaindex.ai/python/framework/module_guides/loading/node_parsers/modules/) | Sentence, semantic, and hierarchical splitting within an indexing pipeline. | Node relationships, metadata, and whether retrieval actually expands to related nodes. |
| [Agno chunking](https://docs.agno.com/knowledge/concepts/chunking/overview) | Fixed, recursive, semantic, and LLM-selected boundaries in Agno knowledge ingestion. | Counting units, model calls, boundary validation, and fallback behavior. |
| [Chonkie](https://docs.chonkie.ai/oss/chunkers/overview) | A dedicated ingestion library with multiple chunkers, including semantic and neural approaches. | Each chunker's tokenizer, model requirements, and size limits. |
| [Chonky](https://github.com/mirth/chonky) | A trained token-classification model that predicts chunk boundaries. | Boundary quality on your language and document types, plus inference requirements. |
| [Docling](https://docling-project.github.io/docling/) / [Unstructured](https://docs.unstructured.io/open-source/core-functionality/partitioning) | Parse documents into structured elements before forming retrieval chunks. | Reading order, tables, headings, OCR quality, and the subsequent chunking policy. |

Chonky and Chonkie are separate projects; Chonkie also offers a [neural chunker using Chonky models](https://docs.chonkie.ai/oss/chunkers/neural-chunker). [Sentence Transformers](https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html) can supply sentence embeddings for a semantic splitter, but the splitting rule and thresholds still need to be defined.

For splitting throughput, Minhas's [performance walkthrough](https://usefeyn.com/blog/you-want-to-chunk-really-fast/) explains the engine originally called `memchunk`, now [Chunk](https://github.com/feyninc/chunk). Its byte-based splitting is separate from model-token budgeting and retrieval quality. Measure parsing, splitting, inference, and indexing separately to locate your bottleneck.

Now use the handbook to choose a baseline, inspect a failed split, and compare two repairs.

## 1. Inspect Your Documents and Questions

Choose a small sample that includes your common document types and difficult cases: long sections, tables, references to earlier definitions, and exceptions. Write representative questions alongside it. For each question, mark the source passages needed for a complete answer before deciding where to split.

Here is our project handbook:

> **Definition: a complete export.** A complete export includes project settings, documents, and attached files.
>
> **Procedure: export a project.** Pause edits, select **Export project**, download the archive, and check its contents before sharing it.
>
> **Exception: linked files.** Linked files appear as references in the archive. Download those files separately and include them when sharing a complete copy.
>
> **Billing FAQ.** Where can I download an invoice? Open **Billing**, then **Invoices**.

"What does a complete export include?" needs the definition. "What must a complete project copy include, and how do I share one that uses linked files?" needs the definition, procedure, and exception. The invoice question belongs to a different topic.

A plausible first split is one chunk per bold label. Yet a match on the procedure would not necessarily retrieve the definition or exception. Grouping the export passages is one candidate repair; keeping the billing entry separate preserves its focus.

<figure class="chunking-figure">
  <picture>
    <source media="(max-width: 540px)" srcset="/guides_data/chunking/complete-task.mobile.svg" width="360" height="766">
    <img src="/guides_data/chunking/complete-task.svg" alt="A project handbook becomes an export chunk containing the definition, steps, and linked-file exception, plus a separate billing FAQ chunk. A split after the export steps would leave out the exception." width="640" height="568" loading="lazy">
  </picture>
  <picture class="chunking-figure__dark">
    <source media="(max-width: 540px)" srcset="/guides_data/chunking/complete-task.mobile.dark.svg" width="360" height="766">
    <img src="/guides_data/chunking/complete-task.dark.svg" alt="A project handbook becomes an export chunk containing the definition, steps, and linked-file exception, plus a separate billing FAQ chunk. A split after the export steps would leave out the exception." width="640" height="568" loading="lazy">
  </picture>
  <figcaption>Keep the export definition, steps, and linked-file exception together for the complete-copy question. Retrieve the independent billing FAQ on its own.</figcaption>
</figure>

Look for the same dependencies in your own data:

| Document pattern | Starting unit | Dependency to check |
| --- | --- | --- |
| FAQ | One question and answer | Does the answer name its subject without the question? |
| Procedure | A complete task or subtask | Which prerequisites, definitions, and exceptions govern the steps? |
| Prose | A paragraph developing one idea | Does it depend on an earlier paragraph or section title? |
| Reference manual | A section or complete entry | Do notes and table headers apply to the whole entry? |

Inspect the extracted text as well as the original document. A PDF parser that scrambles columns or drops table headers has already lost information. Fix that before tuning the splitter. Keep document identifiers and versions, section paths, and source positions so you can trace every chunk back to its origin.

## 2. Choose Meaningful Boundaries

Chunking strategies differ in what decides a boundary: length, sentences, document structure, embedding similarity, or an LLM. A sliding window also determines how much neighboring chunks repeat. These choices can be combined; a sentence-aware splitter can group sentences to a token cap and carry some into the next chunk. Check whether the resulting units preserve the evidence your questions require.

Use reliable document structure first. A complete FAQ entry or a short procedure may already be a good chunk. For Markdown, the [header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) groups text under configured headings and records their hierarchy as metadata. It strips headings by default, so retain useful titles in the embedding input. Apply another splitter to sections that are too long or contain several topics.

**For the handbook, start with the complete export section and the billing question-answer pair.** There is no reason to pad a short, complete entry to a maximum length. If the export section grows, these methods give you different ways to divide it.

| Method | What chooses the boundary | When to try it |
| --- | --- | --- |
| [Fixed chunking](#fixed-chunking) | A length limit in characters, words, or tokens | A simple baseline, including text with unreliable formatting |
| [Sentence chunking](#sentence-chunking) | Sentence boundaries, optionally grouped to a size cap | Prose where arbitrary cuts break statements |
| [Paragraph chunking](#paragraph-chunking) | Paragraph or section breaks | Documents whose layout groups complete ideas |
| [Sliding-window chunking](#sliding-window-chunking) | A window size and stride, with repeated source spans | Nearby context is often needed across boundaries |
| [Semantic chunking](#semantic-chunking) | Changes in embedding similarity | Topic changes that paragraph breaks or headings do not capture |
| [Agentic chunking](#agentic-chunking) | An LLM's decision about where to split | Boundaries that require interpreting the passage's meaning or role |
| [Recursive chunking](#recursive-chunking) | Ordered separators, with finer splits for oversized pieces | Prose with useful paragraph or line breaks and uneven section lengths |
| [Graph-based chunking](#graph-based-chunking) | A partition of relationships between text units | Nonlocal relationships that adjacent-boundary rules miss |

### Fixed Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Simple to implement and repeat: the same input and settings produce the same boundaries.
- Splitting needs no embedding or LLM calls; only the finished chunks need retrieval embeddings.
- A length cap makes chunk sizes predictable in the unit you choose, even when document formatting is poor.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
<summary>Weaknesses</summary>

- A length boundary can separate a condition from its instruction or put unrelated topics in one chunk.
- Overlap repeats source text, increasing embedding work and potentially duplicating retrieved evidence.
- A character or word limit does not establish that a chunk fits the embedding model's token limit.

</details>

Fixed chunking is a useful baseline when you want to establish how far a simple splitter gets you. It advances through the text in windows of a chosen length, optionally repeating part of the previous window. For example, 400-token windows with 40 tokens of overlap advance by 360 tokens. That arithmetic describes the split; it says nothing about whether 400 tokens contain a complete answer.

Check the implementation's unit and boundary rules. [Agno's fixed-size chunker](https://docs.agno.com/knowledge/concepts/chunking/fixed-size-chunking) uses characters and avoids cutting a word when a boundary is available. The [Essentials course example](/course/essentials/day-1/chunking-strategies/#1-fixed-size-chunking) counts words. Neither setting is interchangeable with tokens. If you need a token cap, use the indexing model's tokenizer and account for titles or context added afterward.

In the handbook, a cut after the export procedure leaves the linked-file exception in the next chunk. Both chunks can contain complete sentences, yet the procedure is incomplete evidence for sharing a full copy. Keep fixed chunking if it passes your questions; change the boundary or supply the missing source context when it does not.

{{< island path="documentation/headless/chunking/fixed" ratio="16/11" title="Fixed windows advance by size minus overlap. Change the word count and overlap, then select a chunk to inspect its source span. Dashed words repeat from the preceding chunk." >}}
![Twelve-word windows over a 31-word source: zero overlap gives three chunks; three-word overlap gives four chunks with repeated source positions.](/guides_data/chunking/fixed.svg)
{{< /island >}}

### Sentence Chunking

Sentence chunking uses sentence boundaries as the starting units. You can index one sentence at a time or group consecutive sentences until the next would exceed a size cap. [Chonkie's sentence chunker](https://docs.chonkie.ai/oss/chunkers/sentence-chunker) is one implementation. This is a useful baseline for prose: it avoids arbitrary cuts inside statements without requiring embedding comparisons or an LLM to choose boundaries.

A complete sentence is not necessarily complete evidence. In the handbook, "Download those files separately" depends on the preceding sentence identifying linked files. Group them, or retain the source relationship for expansion after retrieval. Check segmentation on abbreviations, lists, and your document languages, and define a fallback for a sentence longer than the embedding limit. Sentence count alone does not establish a token budget.

### Paragraph Chunking

Paragraph chunking keeps each paragraph intact, optionally combining short adjacent paragraphs within the same section. It works well when authors use paragraphs to develop complete ideas. Retain the section title, and use a finer splitter when a paragraph exceeds the cap. In extracted PDFs, distinguish real paragraph boundaries from line wrapping before using blank lines as separators.

In the handbook, the definition, procedure, and exception are three paragraphs about one task. Keeping them separate preserves their formatting but can still omit required evidence. Start with paragraphs when they are independently useful; group related paragraphs or supply their shared section when the questions require it.

### Sliding-Window Chunking

A sliding window moves through the source by a chosen **stride**. With a 400-token window and a 360-token stride, adjacent chunks share 40 tokens. A sentence-based version might take four sentences, then advance by three. The fixed-chunking interactive example demonstrates this same size-minus-overlap relationship using words.

Try it when a useful definition or condition often sits just across a boundary. The repeated span gives neighboring chunks some shared context, but cannot guarantee that an entire dependency fits. An exception several paragraphs away may still be absent. Overlap also increases indexed text and can return duplicate evidence, so preserve source offsets and merge repeated spans when assembling the answer.

This is different from [LlamaIndex's sentence-window retrieval](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/sentence_window/): that parser stores individual sentences as nodes and surrounding sentences as metadata. The application must supply that surrounding text after retrieval. Embedding overlapping windows and expanding a retrieved sentence change different stages of the pipeline.

### Semantic Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Uses the text's content to suggest boundaries when headings or paragraph breaks are unhelpful.
- Allows different lengths for different runs of related sentences.
- Can separate a topic change inside a long paragraph without asking a generative model to choose the split.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
<summary>Weaknesses</summary>

- Adds sentence or passage embedding work before the final chunks are indexed.
- Boundaries depend on the embedding model, sentence segmentation, and threshold settings.
- Similarity does not establish that passages are independent, and a coherent topic can still exceed the model's input limit.

</details>

Semantic chunking is worth testing when simpler splitters repeatedly combine unrelated topics. A common approach divides the text into sentences, embeds each sentence with some neighboring context, and compares adjacent groups. A sufficiently large change in their vectors becomes a candidate boundary. [LlamaIndex's semantic splitter](https://developers.llamaindex.ai/python/examples/node_parsers/semantic_chunking/) follows this pattern. The final chunks still need embeddings for retrieval; the intermediate sentence embeddings serve the boundary decision.

The controls differ across implementations. LlamaIndex uses a [percentile of cosine dissimilarities](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/semantic_splitter/); lowering that percentile produces more splits. [Agno's semantic chunker](https://docs.agno.com/knowledge/concepts/chunking/semantic-chunking) exposes a similarity threshold, where increasing the threshold produces more splits. Tune the documented control on a sample of your text, inspect the boundaries, and check final token lengths. A setting copied from another splitter does not necessarily mean the same thing.

In the handbook, a semantic splitter might separate the export material from billing. That is useful, but the definition, procedure, and exception also have different wording and roles. Inspect whether they stay together. A topic boundary is a signal to test, not proof that each side contains everything needed for an answer.

{{< island path="documentation/headless/chunking/semantic" ratio="16/11" title="Semantic boundaries depend on the similarity rule. With these illustrative scores, raising the threshold from 0.35 to 0.65 separates the steps from the linked-file exception. No embedding model runs in this demo." >}}
![Illustrative semantic scores produce two chunks at threshold 0.35 and three at 0.65. The 0.56 similarity between export steps and the linked-file exception becomes a split.](/guides_data/chunking/semantic.svg)
{{< /island >}}

### Agentic Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Lets an LLM consider the meaning and role of a passage when choosing a split.
- Can use instructions tailored to the document, such as keeping a procedure with the conditions that govern it.
- Can select boundaries while retaining the source wording, when the implementation slices the original text.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
<summary>Weaknesses</summary>

- Adds model calls during ingestion, with latency and compute or API cost to measure.
- Decisions depend on the model, prompt, and text it can see; a distant exception outside that input cannot guide the split.
- Model-selected boundaries still need validation. Failed calls or invalid responses require a fallback that can change the resulting chunks.

</details>

Here, agentic chunking means using an LLM to decide where to divide source text. It is a preprocessing choice: an agent that searches your knowledge base can use any of these chunking methods. Try an LLM-assisted splitter when inspecting failed chunks reveals boundaries that require interpreting the text, and simpler structural or recursive rules do not resolve them.

[Agno's implementation](https://docs.agno.com/knowledge/concepts/chunking/agentic-chunking) gives the model a window of text and asks for a character position at which to split. It then takes that span from the source, rather than asking the model to rewrite the passage. Its `max_chunk_size` is measured in characters. The [source code](https://github.com/agno-agi/agno/blob/main/libs/agno/agno/knowledge/chunking/agentic.py) also defines validation and a size-based fallback for failed or unusable responses. Check which boundaries came from the model and which came from a fallback before attributing a result to the method.

For the handbook, the goal is to keep the definition, steps, and linked-file exception together. An LLM may recognize that dependency if all three fit in the text it receives. If the exception falls outside that window, calling the splitter agentic does not recover it. Inspect the source coverage and compare any improvement in final evidence against the extra ingestion work.

{{< island path="documentation/headless/chunking/agentic" ratio="16/11" title="An LLM can only consider the source window it receives. Compare two scripted decisions: one ends after the steps; the wider window also includes the exception. The output copies the selected source span. No model is called." >}}
![A scripted agentic example: a window containing S1–S2 ends after the export steps; a wider window containing S1–S4 can keep the linked-file exception. Both outputs retain source wording.](/guides_data/chunking/agentic.svg)
{{< /island >}}

### Recursive Chunking

<details class="chunking-tradeoffs chunking-tradeoffs--strengths">
<summary>Strengths</summary>

- Keeps larger text units intact when they fit, and subdivides only the oversized pieces.
- Needs no embedding or LLM calls to choose boundaries.
- Lets you adapt separators and length measurement to the document format and language.

</details>

<details class="chunking-tradeoffs chunking-tradeoffs--weaknesses">
<summary>Weaknesses</summary>

- Follows separators, so it cannot tell whether a paragraph depends on a later exception.
- Poor extraction or unsuitable separators can force cuts at word or character boundaries.
- A configured overlap is a target, and the length limit uses the splitter's chosen counting function.

</details>

Recursive chunking is a practical starting point for prose with useful paragraph breaks and uneven lengths. It tries a coarse separator first, then uses finer separators on pieces that remain too large. Small pieces can be combined until the next addition would exceed the cap. A short paragraph can stay intact while a long one is divided further.

[LangChain's recursive text splitter](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter) tries paragraph breaks, line breaks, spaces, and finally individual characters by default. Its default length measurement is characters. Those separators do not guarantee complete sentences or preserve a document's heading hierarchy. Choose separators for your language and format; use the [token-aware configuration](https://docs.langchain.com/oss/python/integrations/splitters/split_by_token) when the cap must follow a particular tokenizer.

For a longer export section, recursive splitting can keep each short subtask intact and subdivide a long explanation. It still cannot know that a separate paragraph's linked-file rule governs every subtask. Keep the relevant conditions with each unit, or retain the section relationship and [supply that context after retrieval](#4-add-context-where-needed).

{{< island path="documentation/headless/chunking/recursive" ratio="8/5" title="Recursive splitting preserves units that fit and subdivides those that do not. Step through a custom paragraph → sentence → word hierarchy, then pack the pieces within the selected word cap. This illustrates the mechanism, not LangChain's default separators." >}}
![With a 24-word cap, the 12-word and 5-word paragraphs remain intact. Only the 30-word paragraph is split into sentences of 8 and 22 words.](/guides_data/chunking/recursive.svg)
{{< /island >}}

### Graph-Based Chunking

Graph-based chunking uses relationships between text units to choose their grouping. For example, [Malioutov and Barzilay's graph-based topic segmentation](https://aclanthology.org/P06-1004/) represents sentences as nodes and lexical similarity as weighted edges, then partitions the graph into contiguous source segments. This allows relationships beyond adjacent sentences to influence a boundary. It is an example from lecture segmentation, not evidence that graph-based chunking improves modern RAG universally.

Consider this approach when inspecting failures suggests that nonlocal relationships would improve the split. You must choose how to construct and partition the graph, measure that extra work, and check final token lengths and source coverage. Distinguish this boundary decision from [Microsoft GraphRAG's default pipeline](https://microsoft.github.io/graphrag/index/default_dataflow/), which first creates text chunks and then extracts a graph for later retrieval.

For this handbook, the existing structure already gives us two useful units. For your own data, compare the simplest suitable baseline with a more involved method only when you can name the failure it should repair. Use the same questions and retrieved-text budget in [step 5](#5-test-the-evidence-that-reaches-the-answer), and record splitting time and model usage alongside evidence coverage.

## Beyond Text: Choose the Evidence Unit

Text remains the focus of this guide, but a text splitter can only preserve information that extraction captures. For visually rich documents, recordings, and audio, first decide which representation can carry the answer. Then choose its boundaries.

### When to Use Text Chunking or Visual Retrieval

Use **text chunking** when the answer survives extraction into prose or structured tables. Test **visual document retrieval** when it depends on information in the rendered page: chart shapes, diagram connections, spatial layout, or labels that extraction loses. The [ColPali paper](https://arxiv.org/abs/2407.01449) describes retrieving document pages directly from their visual representation.

| What the question needs | Starting approach |
| --- | --- |
| A policy, definition, or procedure stated in readable text | Parse the document and apply a text chunker. |
| A chart trend, a connection in a diagram, or a relationship expressed through layout | Retrieve the page image with a visual embedding model, then provide the relevant image to an image-capable answering model. |
| Prose explaining a figure, with essential evidence in both | Keep linked text chunks and page or figure images; retrieve and assemble both when needed. |

ColPali and [ColQwen](https://huggingface.co/vidore/colqwen2-v1.0) represent pages with multiple vectors associated with image patches. Late interaction scores a query against those patch vectors. A page is still a bounded retrieval unit; resolution and patch limits can hide small details. Compare vector storage and image-processing latency with your text pipeline as well as answer quality. See the [Qdrant visual retrieval tutorial](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/) for the indexing approach.

A vision-language model (VLM) can also extract or describe a figure for a text-based pipeline. That is a different step from embedding page images for retrieval. Check generated descriptions against the source, and retain the image when the answer depends on details the description omits. Having diagrams in a document is a reason to inspect the evidence, not an automatic reason to replace all text chunks.

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

There are two different limits to satisfy:

- **Embedding input:** Every final input must fit the embedding model's supported length, including titles, added context, required prefixes, and special tokens. Oversized inputs may be rejected or truncated, depending on the model and serving configuration.
- **Answer context:** All retrieved text must fit the space remaining after instructions, the question, conversation history, and reserved output. This budget applies across results, including any text added after retrieval.

Measure final embedding inputs with that model's tokenizer, with truncation disabled for inspection. Otherwise, a shortened count can hide an oversized input. Measure the assembled answer context with the answering model's tokenizer. Character counts, word counts, and token counts from a different model are not interchangeable. [Hugging Face's tokenizer documentation](https://huggingface.co/docs/transformers/main_classes/tokenizer) explains these controls; hosted models may offer their own counting tools.

### Set a Cap Without Treating It as a Target

Inspect the lengths of your complete units first. Keep short units intact. For oversized ones, choose a finer meaningful boundary and preserve the context the smaller unit needs.

For example, suppose you allocate **2,000 answering-model tokens to retrieved evidence** and expect to need four passages. That allows roughly 500 tokens per passage. If a title and source label use about 50 tokens, around 450 remain for the body. These are illustrative planning assumptions to test, not a recommended universal chunk size. Independently check whether that same input fits the embedding model's tokenizer and limit.

If a complete export subtask is longer than this allowance, you have a decision: use fewer passages, allocate more evidence space if available, or split the subtask at a meaningful boundary and supply its needed context separately. Cutting at token 450 and losing the exception defeats the purpose of the budget. Short billing entries should stay short.

Smaller chunks can isolate facts but require several hits to reconstruct a task. Larger chunks can preserve the task but spend more of the answer budget on unrelated text. More chunks mean more vectors to store and index; repeated text also increases embedding work. Choose the tradeoff using your questions, not the embedding model's maximum length alone.

### Add Overlap Only Where It Repairs a Boundary

Overlap repeats text in neighboring chunks. It can accompany different splitting methods; it is not a separate way to find meaningful boundaries.

Start with zero overlap for complete, independent entries. When splitting a long prose section, test carrying the last sentence or paragraph into the next chunk if it is needed to understand that chunk. Inspect actual output: an overlap setting may be a target rather than an exact amount, and structural splitters can prevent overlap across sections.

For the handbook, a little overlap might preserve a definition immediately before a subtask. It will not reliably attach an exception several paragraphs away. Increasing overlap everywhere also lets nearly identical hits consume multiple result slots and repeat evidence in the answer context. Reduce it, merge duplicate source spans, or retrieve the relevant surrounding passage explicitly.

Preserve table headers with the rows they describe, including when splitting a long table. Keep source positions with repeated text so you can recognize duplicated spans. In Qdrant, document, section, and position fields can live in a point's [payload](/documentation/manage-data/payload/); they do not automatically become part of the embedding or the answer context.

## 4. Add Context Where Needed

Read a chunk without its document. Does "it" have a clear referent? Does "complete" depend on an earlier definition? Can you tell which product, version, or procedure the passage describes?

For the handbook's exception, "Project handbook > Export > Linked files" identifies the subject. But a title cannot replace the instruction to download those files separately. Preserve the source text that carries the condition.

Choose the addition according to where information is missing:

| Problem | First adjustment to test |
| --- | --- |
| The passage's identity is unclear during search. | Include a concise document title and section path before embedding. |
| A definition or exception is missing from a retrieved result. | Keep it with the source chunk, or fetch the relevant source context after a useful hit. |
| Useful context is scattered across a long document. | Consider a short generated explanation, checked against the source, after trying source headings and definitions. |

### Search a Passage, Then Supply Its Surroundings

The text used to find a match need not be all the text supplied to the answer. If the export section becomes too long, you can index focused subtasks and retain their section identifiers. After a subtask matches, fetch the relevant definition and exception from that section. This is the idea behind [parent-document retrieval](https://reference.langchain.com/python/langchain-classic/retrievers/parent_document_retriever/ParentDocumentRetriever), where smaller searchable chunks lead to larger source units.

This approach requires an explicit application step and a reliable link back to the source. Bound the expansion, merge overlapping passages when several hits belong to one section, and count the expanded text against the answer budget. It can recover a condition that did not match independently, but still needs a useful initial hit. It does not change the initial vector matching.

By contrast, adding text **before embedding** changes the searchable representation and consumes the embedding input budget. If that added text is also passed to the answering model, count it there too. Adding it only **after retrieval** cannot improve the initial match, but can make the matched passage usable.

[Anthropic's contextual retrieval experiments](https://www.anthropic.com/research/contextual-retrieval) prepend a short explanation generated from the document before embedding and lexical indexing. They report fewer retrieval failures in the tested configurations. That supports testing generated context for passages that lose meaning in isolation; it does not establish better final answers for every corpus. Generation adds preprocessing cost and can introduce unsupported details. Keep the original passage, distinguish generated context from source evidence, and check both retrieval and answers.

For our short handbook, the initial plan remains simple: index the complete export section and the complete billing entry, retain titles and source references, and use zero overlap. The larger-section alternative is available if the real documents cannot fit those units within their limits. Now test which evidence that plan actually delivers.

## 5. Test the Evidence That Reaches the Answer

Before running retrieval, inspect a few chunks against their source:

- Are the needed facts, conditions, and exceptions preserved?
- Can each chunk be understood outside its document?
- Does the complete embedding input fit without truncation?
- Are tables and reading order intact?
- Can you recover the correct source passage and version?

Build a small question set from the inspection in step 1. Include straightforward facts, complete procedures, and cases likely to cross a boundary. Label the required **source passages**, not chunk IDs that change with the splitter. Accept equivalent evidence elsewhere when it answers the same question.

| Question | Evidence needed for a complete answer |
| --- | --- |
| What does a complete export include? | The definition: settings, documents, and attached files. |
| What must a complete project copy include, and how do I share one that uses linked files? | Definition, export procedure, and linked-file exception. |
| Where can I download an invoice? | The billing question and answer. |

Also include a question the documents cannot answer, such as "How long does an export download link remain valid?" for this handbook. Check that the answer acknowledges the missing information rather than inventing a duration. Keep that result separate from evidence coverage on answerable questions.

### Follow One Failure Through to a Repair

Consider an illustrative run where the procedure is the only retrieved hit for the complete-copy question. The two repairs are candidates to test, not measured results. Inspect the text sent to the model, not just the ranked search results:

| Candidate | Final context to inspect | What to check |
| --- | --- | --- |
| Separate definition, procedure, and exception chunks | Procedure only | The definition and linked-file condition are missing. "Export and share the archive" is insufficient. |
| One complete export chunk | Definition + procedure + exception, if that chunk is retrieved and fits | All required evidence is available. The answer must still include the inventory and separate linked-file download. |
| Focused subtask with source expansion | Matched procedure + its definition and exception | Check the same evidence, including the expanded text in the budget and avoiding duplicate section content. |

The second and third candidates address this particular failure. Rerun the full question set after either change: a grouping that helps the procedure question can reduce focus for another question. Do not infer a retrieval improvement from the chunk layout alone.

### Compare at the Same Text Budget

Keep the documents, embedding model, search configuration, question set, and total retrieved-text budget fixed while changing one chunking choice at a time. Five 200-token chunks and five 800-token chunks offer different amounts of evidence. A fixed result count alone is not an equal-budget comparison.

Use the same rule to select, expand, and deduplicate results until they fit. Record the actual text and token count supplied, including titles and source labels. Do not silently truncate the final chunk halfway through a condition. When comparing generated answers, keep the answering model, prompt, and generation settings fixed too.

Score two outcomes separately:

1. **Evidence available:** Did all passages needed for this question survive into the final context? One relevant passage is not a pass when the question requires three. Record missing passages, duplicate text, and irrelevant material.
2. **Answer correct:** Did the answer use that evidence correctly, include the conditions, avoid unsupported additions, and cite the right source? Available evidence is not a guarantee that the model will use it.

### Locate the Loss Before Changing the Splitter

| Where evidence disappears | Next action |
| --- | --- |
| Missing from extracted text or indexed chunks | Fix parsing, discarded content, or truncation before testing retrieval. |
| Present in chunks, absent from retrieved candidates | Inspect the query, filters, and representation. Test a title/context repair or a different boundary when the missing meaning explains the miss. |
| Retrieved, then dropped during context assembly | Inspect ranking, duplication, expansion, and the text budget. Re-splitting may not be necessary. |
| Present in the final context, absent or wrong in the answer | Inspect the answering stage before changing chunking. |

Use this trace to choose the smallest useful change. Check both the failing question and the questions that previously worked.

Keep a short decision record: boundaries and fallback, size limits and tokenizers, overlap, context added at each stage, source references, and the questions that pass or fail. Reassess when document types, questions, models, or budgets change. That record gives you a starting configuration you can explain and evidence for the next change.
