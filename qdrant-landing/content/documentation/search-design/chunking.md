---
title: "How to Choose a Chunking Strategy"
short_description: "Inspect your documents, choose chunk boundaries, evaluate retrieved evidence, and then improve ingestion speed."
description: "Choose a chunking strategy for RAG, compare chunk size and overlap, and evaluate retrieval quality with a reproducible Qdrant experiment."
author: Ewa Szyszka
date: 2026-11-12T00:00:00.000Z
draft: false
weight: 20
---

<link rel="stylesheet" href="/guides_data/chunking/figures.css">

# How to Choose a Chunking Strategy

Chunking for RAG divides documents into passages that can be embedded and retrieved independently. Useful chunks fit the embedding model's token limit, keep related evidence together, and retain source identifiers for citations. A short document may already fit these requirements; a long document covering several topics usually needs smaller retrieval units.

The difficult part is deciding what belongs together. An export procedure might say how to download an archive, then explain that linked files must be downloaded separately. A split that separates those passages can leave retrieval with an incomplete procedure.

Start with document structure and a simple splitter. Check whether retrieval preserves the evidence needed to answer your questions, then optimize ingestion speed.

{{< island path="documentation/headless/chunking/decision-flow" ratio="16/9" >}}
![Four connected steps: inspect sources, choose boundaries, evaluate chunk quality, and speed up chunking.](/guides_data/chunking/decision-flow.svg)
{{< /island >}}

## 1. Inspect Your Documents

Check a sample of extracted text against its source before choosing a splitter. Preserve headings, paragraphs, lists, tables, and code blocks where they carry meaning. Remove repeated headers and footers, and look for broken reading order or line wrapping that creates false paragraph boundaries.

For text-heavy PDFs, extract the existing text. Use OCR for scans, or a layout-aware parser or vision-language model when extraction must preserve tables and labels. Verify uncertain text and numbers against the original. Chunking cannot repair a missing condition or an amount attached to the wrong label.

Retain document IDs, section titles, and page or source offsets so a retrieved passage can be traced back to its context. The [images, audio, and video section](#images-audio-and-video) covers sources where text extraction alone loses evidence.

## 2. Choose Meaningful Boundaries

Choose boundaries that keep an answer with its conditions. Start with document structure, then split oversized sections; combine methods when needed, such as grouping sentences with overlap.

### Chunk Size and Overlap

Set a size cap using the embedding model's tokenizer, including any titles or context added to each chunk. Characters, words, and sentences are useful splitting units, but they do not enforce a token limit.

Overlap repeats source text between adjacent chunks. A 400-token window with 40-token overlap advances by 360 tokens. This can preserve context across a boundary, but it increases embedding work and storage. Repeated passages can also occupy several retrieval slots, so retain source offsets to merge duplicate evidence when assembling an answer.

Chunk size and the **retrieved-text budget** are separate settings. The first limits an individual chunk; the second limits all text passed to the answering model. Compare strategies under the same retrieved-text budget so larger chunks do not receive an automatic advantage.

### One Passage, Different Splits

Consider this short handbook excerpt:

> **Export**
>
> A complete export includes settings, documents, and attached files. Pause edits, export the project, and check the archive.
>
> Linked files appear as references in the archive. Download linked files separately before sharing a full copy.
>
> **Billing**
>
> Open Billing to find your invoices.

The question "How do I share a complete export?" needs both the archive procedure and the linked-file exception. Retrieving only the first paragraph leaves out a required step; the billing paragraph adds no evidence for that question.

### Compare the Strategies

Each colored bar represents one chunk of that same passage. All three comparisons use the same **41-word scale**, excluding headings: the procedure occupies words **1–18**, the linked-file exception **19–35**, and Billing **36–41**. These word counts make boundaries visible; they are not model-token limits or retrieval scores.

#### Windows: What Does Overlap Recover?

A fixed window cuts wherever its length runs out. Adding overlap shifts the next window back, giving it some of the previous chunk's context. Follow the dashed spans to see exactly which words are repeated.

<picture class="chunking-strategy-comparison">
  <source media="(max-width: 600px)" srcset="/guides_data/chunking/strategy-comparison-windows.mobile.svg" width="360" height="435">
  <img src="/guides_data/chunking/strategy-comparison-windows.svg" alt="Fixed 12-word chunks cover words 1–12, 13–24, 25–36, and 37–41. Sliding windows cover 1–12, 9–20, 17–28, 25–36, and 33–41; dashed spans mark the four repeated words in each later window." width="640" height="446" loading="lazy">
</picture>

- <span id="fixed-chunking">**Fixed chunking:**</span> A cheap, predictable baseline when structure is unreliable. Here, the first cut falls inside "Pause edits, export the project..." at word 12. A character or word cap still needs a tokenizer check before embedding.
- <span id="sliding-window-chunking">**Sliding-window chunking:**</span> These 12-word windows advance by 8 words. The overlap carries nearby context across cuts, but repeats embedding work and retrieved text. No window contains the complete 35-word Export section. A sentence-window retriever works differently: it can embed sentences and expand to stored neighbors after retrieval.

#### Structure: Which Boundaries Already Exist?

Sentences and paragraphs offer natural stopping points. In this passage, paragraph boundaries keep each pair of related sentences together, but still separate the export procedure from its exception. Recursive splitting adds a size cap to this structural approach.

<picture class="chunking-strategy-comparison">
  <source media="(max-width: 600px)" srcset="/guides_data/chunking/strategy-comparison-structure.mobile.svg" width="360" height="468">
  <img src="/guides_data/chunking/strategy-comparison-structure.svg" alt="Sentence chunks cover words 1–9, 10–18, 19–26, 27–35, and 36–41. Paragraph and recursive chunks both cover 1–18, 19–35, and 36–41: each paragraph fits the recursive 24-word cap, but the two Export paragraphs cannot be combined." width="640" height="480" loading="lazy">
</picture>

- <span id="sentence-chunking">**Sentence chunking:**</span> Preserve complete statements, individually or packed under a cap. The example uses five separate sentences; grouping the two linked-file sentences would keep the reference and download instruction together. Check abbreviations, dependencies between sentences, and sentences too long for the cap.
- <span id="paragraph-chunking">**Paragraph chunking:**</span> Use the author's grouping when it survives extraction. The three chunks contain 18, 17, and 6 words. Split oversized paragraphs, and check for false boundaries caused by PDF line wrapping.
- <span id="recursive-chunking">**Recursive chunking:**</span> A useful starting point for structured prose with uneven lengths. Try coarse separators first, then subdivide oversized pieces and pack within the cap. This example processes each heading's section separately, so Billing stays separate. At 24 words, the Export paragraphs cannot be combined either. Larger paragraphs need finer separators; recursive splitting can still cut sentences or separate related evidence.

#### Models: Can a Boundary Follow the Topic?

Both illustrated model-based choices keep Export together and separate Billing. The bars match, but the decision rules differ. These are **scripted examples**, not outputs from a model run; an actual model or threshold could split the linked-file exception from the procedure.

<picture class="chunking-strategy-comparison">
  <source media="(max-width: 600px)" srcset="/guides_data/chunking/strategy-comparison-models.mobile.svg" width="360" height="360">
  <img src="/guides_data/chunking/strategy-comparison-models.svg" alt="Illustrative semantic and scripted agentic choices both keep Export words 1–35 together and Billing words 36–41 separate. Matching spans do not mean matching decision rules or prove better retrieval." width="640" height="368" loading="lazy">
</picture>

- <span id="semantic-chunking">**Semantic chunking:**</span> Compare sentence or passage embeddings for topic changes when structural rules repeatedly combine unrelated material. This adds embedding work; similarity guarantees neither complete evidence nor a valid chunk length. Inspect the boundaries and enforce a size cap independently.
- <span id="agentic-chunking">**Agentic chunking:**</span> Ask an LLM to choose boundaries when failed splits need interpretation beyond structure or similarity. The model must receive the exception to account for it. Preserve source wording, validate boundaries, and provide fallbacks for invalid responses. Budget for model cost and latency; an agent searching a knowledge base can use any chunking method.

### Semantic Chunking vs. Fixed-Size Chunking

[Qu et al.](https://arxiv.org/abs/2410.13070) found inconsistent gains from semantic chunking over fixed sentence groups. Test whether its extra embedding work improves retrieval on your questions, under the same [retrieved-text budget](#3-evaluate-chunk-quality).

For the export question, **check the combined evidence returned**: it needs both the procedure and the exception, whether they arrive in one chunk or several. A larger bar alone does not establish better retrieval.

## 3. Evaluate Chunk Quality

The choice of chunk size, chunk boundary, and chunk overlap can affect retrieval performance. Hold documents, questions, models, search settings, and the retrieved-text budget fixed while changing one choice at a time. Equal result counts do not provide equal evidence budgets.

### Measure the Evidence Retrieved

Label relevant **source spans**, independently of chunk IDs, and measure:

- **Recall:** How much labeled evidence was retrieved?
- **Precision:** How much retrieved text was labeled relevant?
- **Overlap-aware IoU:** How much do retrieved and relevant source positions overlap, while charging repeated text against the score?

Count source-token positions, not matching words. Repeated passages consume budget but earn relevance credit once. Inspect low-scoring queries for missing conditions, unrelated text, and duplicated evidence. Rank-based metrics such as MRR and nDCG are also useful, but map relevance back to stable source evidence when changing splits.

For the export question, label both the procedure and the separate-download instruction as required evidence. A hit on the procedure alone is incomplete. Check the combined retrieved text, because the evidence can arrive in more than one chunk.

### A Small Qdrant Experiment

To demonstrate this evaluation on a separate dataset, we ran **Qdrant 1.20.0** on State of the Union 2024: one speech, **76 published synthetic questions**, and 95 labeled excerpts. Every configuration used the same pinned all-MiniLM-L6-v2 model, exact cosine search, and a **512-token retrieved-text budget**. Ranked chunks were kept whole; chunks that did not fit were skipped. No deduplication or answer generation was applied.

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

[Reproduce the experiment](https://github.com/qdrant/landing_page/blob/4a852ce1d509ed9ad3c19b2b30bffc0bed742ed2/qdrant-landing/content/documentation/headless/chunking/quality-experiment/README.md), download the [result table](/guides_data/chunking/quality-experiment/summary.csv), or inspect the [run metadata](/guides_data/chunking/quality-experiment/run-metadata.json).

### Check Answers Separately

Freeze the answering model, prompt, and evaluator when comparing chunkers. [Ragas faithfulness](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/) checks support in retrieved context; [factual correctness](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/factual_correctness/) compares the answer with a reference. Test unanswerable questions separately. Neither a supported answer nor a retrieval hit alone proves that every required condition survived.

## 4. Speed Up Chunking

Once retrieval quality is acceptable, time parsing/OCR, token counting, splitting, embedding, and indexing separately. Optimize the stage that dominates ingestion.

- **Avoid repeated work.** Reuse tokenizers and bound the token-count cache. Batch enough work to outweigh multiprocessing overhead.
- **Reduce searching and copying.** Specialized delimiter searches and borrowed slices can reduce splitting work; materializing Python strings still costs time.
- **Control memory and inference.** Consume streams incrementally. Batch sentence embeddings for semantic chunking and reuse them across threshold experiments.

Compare throughput with the same input, counting units, overlap, tokenizer work, and output consumption. Chunk's [benchmark harness](https://github.com/feyninc/chunk/tree/main/benches), for example, excludes input loading. Record elapsed time, peak memory, source coverage, and token lengths. Recheck retrieval quality after an optimization that changes boundaries.

## Images, Audio, and Video

The same evidence-preservation question applies to other media, but the retrieval unit and its limits change:

- **Images and visually rich PDFs:** Use structured text when it preserves meaning. If layout carries evidence, test page-image retrieval with [ColPali or ColQwen](/documentation/tutorials-search-engineering/pdf-retrieval-at-scale/). Keep page IDs, and retain axes, legends, and captions when cropping figures.
- **Speech:** Transcribe recordings into complete thoughts or related speaker turns, retaining timestamps. Check recognition errors against the recording. The [audio demo](/guides_data/chunking/media-demo/?view=audio) includes raw transcript and boundary errors to inspect.
- **Video and non-speech audio:** Keep each action or sound event within a segment that fits the model's duration limit. Still frames can miss motion. The [video demo](/guides_data/chunking/media-demo/?view=video) shows fixed time windows; [reproduce both demos](https://github.com/qdrant/landing_page/blob/cde19a22187d8258ce9dd1b06d9c1f4f354262c2/qdrant-landing/content/documentation/headless/chunking/media-demo/README.md).

Choose benchmarks for the failure you need to measure: [DocVQA](https://www.docvqa.org/datasets/docvqa) and [MP-DocVQA](https://github.com/rubenpt91/MP-DocVQA-Framework) for document QA, [DocLayNet](https://github.com/DS4SD/DocLayNet) for layout regions, and [ViDoSeek](https://github.com/Alibaba-NLP/ViDoRAG) for document-page retrieval. For temporal evidence, use [AVHaystacks](https://schowdhury671.github.io/magnet_project/) or [CASTELLA](https://dcase.community/challenge2026/task-audio-moment-retrieval-from-long-audio); [ActivityNet-QA](https://github.com/MILVLG/activitynet-qa) evaluates video answers. QA accuracy alone does not establish correct chunk boundaries. Hold image or duration budgets fixed, and score retrieved evidence separately from answers.

## Conclusion

Start with a simple splitter suited to your document structure, enforce the embedding model's token limit, and retain source IDs. Inspect failed questions before adding overlap, semantic boundaries, or an LLM: choose the change that addresses the missing evidence, then compare its quality and ingestion cost under the same settings.

Return to the export question. Did the new split retrieve both the archive procedure and the linked-file exception within the same text budget? Did it avoid wasting that budget on Billing or repeated passages? Apply the [same evaluation](#3-evaluate-chunk-quality) to representative questions from your own collection, check the resulting answers, and optimize speed once the evidence is complete enough for your needs.

## Frameworks and Further Reading

### Frameworks by Task

| Task | Tools and implementation notes |
| --- | --- |
| Extract structured documents | [Docling](https://docling-project.github.io/docling/) and [Unstructured](https://docs.unstructured.io/open-source/core-functionality/partitioning). [LangChain's Markdown header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) retains heading metadata but strips headings by default; keep useful titles in embedding inputs. |
| Split fixed or overlapping windows | [Agno](https://docs.agno.com/knowledge/concepts/chunking/fixed-size-chunking) counts characters and avoids cutting words where possible. [Kiru](https://github.com/bitswired/kiru) supports byte or character chunking and streaming; [Chunk](https://github.com/feyninc/chunk), formerly memchunk, uses delimiter-based byte splitting. Check counting units. |
| Group sentences or expand context | [Chonkie's sentence chunker](https://docs.chonkie.ai/oss/chunkers/sentence-chunker), [LlamaIndex node parsers](https://developers.llamaindex.ai/python/framework/module_guides/loading/node_parsers/modules/), and its [sentence-window parser](https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/sentence_window/). The latter stores neighboring sentences as metadata for expansion after retrieval. |
| Split recursively | [LangChain](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter), with [token-aware counting](https://docs.langchain.com/oss/python/integrations/splitters/split_by_token); [semchunk](https://github.com/isaacus-dev/semchunk), which supports memoization and multiprocessing; and [text-splitter](https://github.com/benbrandt/text-splitter). The latter two use structural boundaries by default despite their semantic naming. |
| Find model-based boundaries | [LlamaIndex semantic splitting](https://developers.llamaindex.ai/python/examples/node_parsers/semantic_chunking/) and [Chonkie](https://docs.chonkie.ai/oss/chunkers/overview). [Chonky](https://github.com/mirth/chonky) uses token classification rather than similarity thresholds. [Agno agentic chunking](https://docs.agno.com/knowledge/concepts/chunking/agentic-chunking) selects character positions and includes validation and fallback logic. |
| Evaluate retrieval | [LlamaIndex retriever evaluation](https://developers.llamaindex.ai/python/examples/evaluation/retrieval/retriever_eval/) supports rank-based metrics. Map relevance to stable source evidence when comparing different splits. |
| Embed video or audio | TwelveLabs documents [video](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/video) and [audio](https://docs.twelvelabs.io/docs/guides/create-embeddings/at-scale/audio) inputs and segmentation options. |

### Further Reading

- [Is Semantic Chunking Worth the Computational Cost?](https://arxiv.org/abs/2410.13070)
- [Clever Chunking Methods Aren't (Always) Worth the Effort](https://mburaksayici.com/blog/2025/11/08/not-all-clever-chunking-methods-always-worth-it.html)
- [Visualizing Chunking Impacts in Agentic RAG, Part 1](https://towardsdev.com/visualizing-chunking-impacts-in-agentic-rag-with-agno-qdrant-ragas-and-llamaindex-part-1-7fe1ee31f5a5)
- [Greg Kamradt's five-level text-splitting walkthrough](https://www.youtube.com/watch?v=8OJC21T2SL4)
- [You want to chunk really fast?](https://usefeyn.com/blog/you-want-to-chunk-really-fast/)
