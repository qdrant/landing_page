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

A user asks how to share a complete project copy. Your search finds the export procedure, and the answer tells them to download and share the archive. But a separate paragraph says linked files must be downloaded separately. The answer follows the retrieved instructions and still leaves the user with an incomplete copy.

This is the problem a chunking strategy must address: **which information needs to reach the answer together?**

Chunking divides documents into separately retrievable pieces. In a dense retrieval system, each chunk gets its own embedding and source reference. Search can then return a passage instead of an entire document. Because one embedding represents its input as a whole, a focused passage can make a detail easier to find than embedding a long document about many topics. Splitting too aggressively can remove the context needed to use that detail.

Start with your documents and questions. Choose meaningful boundaries, fit them to your model budgets, and test the evidence that reaches the answer. The fictional handbook in this guide follows that process, including a failed split and two ways to repair it.

If you already know the relevant document and it fits the available input budget, supplying the whole document may be sufficient. A short, focused document can also be a useful retrieval unit without further splitting.

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

Use the structure you found to choose a starting method. These methods can work together: split a manual into sections first, then apply a size-limited splitter only to sections that are too long.

| Method | When to try it | What it preserves or breaks |
| --- | --- | --- |
| Fixed size | A simple baseline, especially when structure is unreliable. | Predictable lengths in the chosen unit, but cuts can separate sentences, table rows, or conditions. The [course's fixed-size example](/course/essentials/day-1/chunking-strategies/#1-fixed-size-chunking) counts words, not model tokens. |
| Recursive splitting | Prose with useful paragraph or line breaks and inconsistent section structure. | Tries larger separators first, then smaller ones when a piece is too long. It preserves nearby text where it fits, but cannot recognize a distant exception. |
| Document structure | FAQs, manuals, and procedures with reliable headings or complete entries. | Preserves the units the author supplied. A heading can still contain multiple topics, and an oversized section needs a fallback. |

[LangChain's recursive text splitter](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter) tries paragraph breaks, line breaks, spaces, and finally individual characters by default. That does not guarantee complete sentences. Use appropriate separators for your language and format, and check the resulting chunks. Its default length measurement is characters, not tokens.

For Markdown, the [header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) groups content under configured headings and records their hierarchy as metadata. It strips heading text by default. Retain useful headings in the embedding input, and use a second splitter when a section exceeds your limit.

**For the handbook, start with two units: the complete export section and the billing question-answer pair.** A single sentence can be enough for a self-contained fact. Keep its paragraph or section when that is where its subject, definition, or conditions live. There is no reason to pad a short, complete FAQ to the maximum chunk length.

If an export section grows into several pages, divide it into focused subtasks. Keep the conditions relevant to each subtask with it. When that still requires too much repeated text, preserve the relationship to the section so you can supply that context after retrieval, as described in [Add Context Where Needed](#4-add-context-where-needed).

Semantic chunking uses changes in embedding similarity to suggest boundaries. Consider it when simpler methods repeatedly join unrelated topics in poorly structured text. It adds embedding work during splitting, and a change in topic does not prove that adjacent passages are independent. Compare it with your structural or recursive baseline using the same questions and text budget. The [Essentials lesson](/course/essentials/day-1/chunking-strategies/) provides further explanations and implementations.

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
