---
title: "How to Choose a Chunking Strategy"
short_description: "Choose chunk boundaries, size, and overlap from your documents and questions, then test whether the right evidence reaches the answer."
description: "A practical guide to chunking for RAG: inspect your documents, choose boundaries, set size and overlap, preserve context, and evaluate the results."
author: Ewa Szyszka
date: 2026-11-12T00:00:00.000Z
draft: false
weight: 20
---

<link rel="stylesheet" href="/guides_data/chunking/figures.css">

# How to Choose a Chunking Strategy

A search result can contain the right instruction and still leave out the exception that makes it usable. Choosing a chunking strategy means deciding which information your retrieval system must keep together.

Chunking divides documents into smaller, independently retrievable pieces. With a single dense embedding per chunk, the vector represents that piece as a whole. Embedding a long document about several topics can make a small detail harder to find; splitting it gives that detail a more focused representation. But a chunk that loses its subject, conditions, or definitions may be too small to support an answer.

Start with the documents and questions, choose meaningful boundaries, then set size and overlap limits. Add context where a chunk needs it, and test whether the required evidence reaches the answering model. This guide follows that process with one example you can replace with your own documents.

You may not need chunk retrieval at all if you already know which document answers a question and can supply it within your application's text budget. A short, focused document can also be a useful retrieval unit on its own.

## 1. Inspect Your Documents and Questions

Take a small sample that covers your document types and write questions users are likely to ask. Identify the passages needed to answer each question completely. The aim is to discover what belongs together before choosing a splitter.

Consider this fictional project export handbook:

> **What is a complete export?** A complete export includes project settings, documents, and attached files.
>
> **Export a project.** Pause edits, select **Export project**, download the archive, and check its contents before sharing it.
>
> **Linked-file exception.** Linked files appear as references in the archive. Download those files separately and include them when sharing a complete copy.
>
> **Billing FAQ.** Where can I download an invoice? Open **Billing**, then **Invoices**.

The question "What does a complete export include?" needs the definition. "How do I share a complete copy of a project with linked files?" needs the definition, procedure, and exception. The invoice question belongs to a different topic.

For this handbook, try keeping the short export section together and making the billing FAQ a separate chunk. A boundary immediately after the export steps would separate the action from a condition needed to complete it.

<figure class="chunking-figure">
  <picture>
    <source media="(max-width: 540px)" srcset="/guides_data/chunking/complete-task.mobile.svg" width="360" height="766">
    <img src="/guides_data/chunking/complete-task.svg" alt="A project handbook becomes an export chunk containing the definition, steps, and linked-file exception, plus a separate billing FAQ chunk. A split after the export steps would leave out the exception." width="640" height="568" loading="lazy">
  </picture>
  <picture class="chunking-figure__dark">
    <source media="(max-width: 540px)" srcset="/guides_data/chunking/complete-task.mobile.dark.svg" width="360" height="766">
    <img src="/guides_data/chunking/complete-task.dark.svg" alt="A project handbook becomes an export chunk containing the definition, steps, and linked-file exception, plus a separate billing FAQ chunk. A split after the export steps would leave out the exception." width="640" height="568" loading="lazy">
  </picture>
  <figcaption>Keep the export definition, steps, and linked-file exception together so a retrieved procedure contains the conditions needed to complete it. The billing FAQ can be retrieved independently.</figcaption>
</figure>

Use the same reasoning for other document types:

| Document pattern | Information to keep together |
| --- | --- |
| FAQ | The question and its answer; the answer alone may not name its subject. |
| Procedure | The relevant steps, prerequisites, definitions, and exceptions. |
| Prose | A paragraph or group of paragraphs that develops one idea. |
| Reference manual | A heading and the entry it identifies, including applicable notes. |

A parser must preserve the structure you intend to use. Inspect extracted text from PDFs and other formatted sources: columns in the wrong order, missing headings, or a table detached from its headers will create problems no chunk-size setting can repair.

## 2. Choose Meaningful Boundaries

A splitter turns your preferred boundaries into chunks. Choose a method that can recognize the structure you found, and give it a fallback for sections that exceed your size limit.

| Method | When to try it | What to inspect |
| --- | --- | --- |
| Fixed size | A simple baseline, or text with little reliable structure. Split after a chosen number of tokens or characters. | It can cut a sentence, table, or instruction in the middle. Overlap may help at the cut but does not understand dependencies. |
| Recursive splitting | Prose with useful paragraph and sentence boundaries, but inconsistent headings. Try larger separators first, then smaller ones when a piece is too long. | It preserves nearby text where it fits. It does not know that an exception several paragraphs away belongs to an instruction. |
| Document structure | FAQs, manuals, or procedures with reliable headings and complete entries. Split by those units first. | A section may contain several topics or exceed the input limit. Split oversized sections further while retaining their heading and necessary context. |

For a plain-text starting point, LangChain's [recursive text splitter](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter) tries paragraph breaks, line breaks, spaces, and finally individual characters. Its default length measurement is characters, not tokens. Choose separators appropriate to the language and format; spaces are not word boundaries in every language.

For Markdown, the [header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) groups content under configured headings and records those headings as metadata. It removes heading text from the chunk by default. Decide whether to include those headings in the text you embed, and apply a size-limited splitter to oversized sections.

In the handbook, structure is a useful starting point, but splitting on every bold label would be too aggressive. Group the definition, steps, and exception into an export section. Keep the billing question and answer together as a separate entry. If a real export procedure is too long, divide it into complete subtasks and carry the definitions or conditions each subtask needs into its chunk.

Semantic chunking, which uses changes in embedding similarity to suggest topic boundaries, is another option when structure is unreliable. It adds embedding work during splitting, and a topic change is not proof that two passages can be understood independently. Try it when your simpler baseline repeatedly joins unrelated topics, then evaluate it with the same questions. The [Essentials chunking lesson](/course/essentials/day-1/chunking-strategies/) introduces this and other methods in more detail.

## 3. Set Size and Overlap Constraints

Chunk size is a limit on your chosen units, not a reason to discard their structure. There are two separate budgets:

- **Embedding input:** Each chunk must fit the embedding model's supported input length, including any title, context, or model-required prefix. Check the model and serving configuration: an oversized input may be rejected or truncated.
- **Answering-model input:** The retrieved chunks must fit the space left after instructions, the question, conversation history, and reserved output. This is a total budget across results, not a per-chunk limit.

Count the final embedding input with that model's tokenizer, including required special tokens, with truncation disabled for the check. Otherwise, a shortened token count can hide an oversized input. A character count or another model's tokenizer is only an approximation. [Hugging Face's tokenizer documentation](https://huggingface.co/docs/transformers/main_classes/tokenizer) describes these controls; hosted models may provide their own token-counting tools. Count the final answer context with the answering model's tokenizer as well.

### A Starting Size for Your Documents

Start with one complete FAQ entry, focused section, or short procedure where it fits both budgets. Inspect the token lengths of those units before imposing a numeric cap. In the handbook, the export section is short enough that splitting it further gains little and risks losing the exception.

For an illustrative application with a 2,000-token retrieved-text budget that needs evidence from roughly four passages, test a cap near 500 answering-model tokens per passage. Leave room for titles, source labels, and any added context, and independently enforce the embedding model's limit. This is a budgeting starting point, not a universally best chunk size: variable passage lengths and the evidence needed for each question will change how many results fit.

Smaller chunks can isolate facts but may require several results to reconstruct a procedure. Larger chunks can keep that procedure complete but consume more of the answer budget with unrelated text. More chunks also mean more vectors to store and index; overlap and repeated context add text to embed. Compare these costs alongside retrieval quality.

### When to Add Chunk Overlap

Overlap repeats text from one chunk in a neighboring chunk. It is a setting you can use with several splitting methods, rather than a separate boundary strategy.

Start without overlap when your units are complete, independent entries. When a long prose section must be divided, try retaining the last sentence or paragraph across a boundary if inspection shows that the next chunk depends on it. Verify the actual output: some splitters treat the configured overlap as a target, and structural boundaries can prevent that amount from being repeated.

Overlap helps with local continuity. It cannot reliably reconnect the handbook's steps to an exception elsewhere in a document. Keep those passages together or explicitly supply the missing condition. Increasing overlap everywhere would duplicate unrelated text and spend the answer budget on repeated evidence.

Keep source metadata with each chunk: a document identifier and version, section path, and position or page reference. In Qdrant, these fields can live in the point's [payload](/documentation/manage-data/payload/). Metadata supports source citations and lets your application recover neighboring text; storing it does not automatically add it to the embedding or the answering-model input. Preserve table headers with the rows they describe, including when a table must be divided.

## 4. Add Context Where Meaning Is Missing

Read a chunk without its document. Does "it" have a clear referent? Does "complete" refer to a definition you removed? Does the paragraph identify the product or procedure it describes?

For the handbook, a chunk beginning "Download those files separately" needs the linked-file condition. A title alone cannot restore that instruction. Preserve the source passage that explains which files and why. A heading such as "Project export: linked files" can still help distinguish this passage from a billing download.

Use the smallest addition that repairs the observed problem:

| Missing information | First adjustment to test |
| --- | --- |
| Document or section identity | Include a concise title and section path. |
| A definition, prerequisite, or exception | Retain the relevant source text with the passage, or retrieve it through an explicit document relationship. |
| Context spread across a long document | Consider a short generated explanation, checked against the source. |

Decide separately what you send to each model. Text added **before embedding** changes the chunk's searchable representation and must fit the embedding limit. Text assembled **after retrieval** can help the answering model interpret a result, but cannot fix a result that was never retrieved. Both additions consume tokens in their respective stages.

[Anthropic's contextual retrieval experiments](https://www.anthropic.com/research/contextual-retrieval) prepend a short, document-specific explanation before indexing chunks and report fewer retrieval failures in their tested setups. This supports testing generated context when isolated passages lose meaning. It does not establish that every corpus needs it or that better retrieval guarantees correct answers. Generated context also adds preprocessing cost and can introduce unsupported details; compare it with simply retaining the source heading or definition first.

## 5. Test the Evidence That Reaches the Answer

Before running retrieval, inspect the chunks: are related facts together, are subjects understandable in isolation, do complete inputs fit the model limits, and are tables and reading order intact? Check that each source reference leads back to the right passage.

Then turn your sample questions into a small evaluation set. Pair each question with the required source passages, rather than chunk IDs that will change when you alter the splitter.

| Example question | Required evidence | Failure to look for |
| --- | --- | --- |
| What does a complete export include? | The definition listing settings, documents, and attached files. | A retrieved passage uses "complete" without defining it. |
| How do I share a complete project with linked files? | Definition, export steps, and linked-file exception. | The steps reach the model but the exception is missing. |
| Where can I download an invoice? | The billing question and answer. | Export chunks crowd out the billing entry. |

Keep the embedding model, search configuration, question set, and total retrieved-text budget fixed while comparing boundary strategies. If you compare five short chunks with five long chunks, the longer-chunk setup gets more text; that is not a comparison at equal answer-context cost. Assemble results using the same budget rule and record which evidence survives selection, deduplication, and any truncation. When comparing generated answers, keep the answering model, prompt, and generation settings fixed too.

For each question, check two outcomes separately:

1. **Evidence available:** Did all required passages reach the answering model within the budget? Record missing evidence, duplicate text, and irrelevant material.
2. **Answer correct:** Did the generated answer use that evidence correctly, include necessary conditions, and cite the right source? A retrieved exception is no help if the answer ignores it.

Change the smallest setting that addresses the observed failure:

| Observed failure | Next change to test |
| --- | --- |
| An instruction arrives without its exception. | Repair the boundary or explicitly include the missing source passage. |
| A chunk has an unclear subject. | Retain its title, section name, or defining sentence. |
| Relevant facts arrive with too much unrelated text. | Split at a more focused boundary and check that the needed context survives. |
| Several results repeat the same passage. | Reduce overlap or deduplicate during context assembly. |
| The right passages arrive, but the answer is wrong. | Inspect the answering stage before changing chunking again. |

Keep a short record of the strategy, model versions, budgets, and questions it handles or misses. Revisit it when document types, user questions, models, or available context change. Your first useful result is a chunking strategy you can explain from your documents, plus a repeatable test that shows where it needs adjustment.
