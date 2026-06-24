---
title: Proposed methodology for the evaluation of agentic / search systems
weight: 7
partition: ecosystem
---


# Proposed methodology for the evaluation of agentic / search systems

Once a patch ships, software engineering — and search engineering in particular — always returns to the same question: how good is it, and how do we make it better?

The traditional answer is bottom-up. Define a handful of bottom-line metrics, each measuring a narrow slice of system quality, and let those numbers point the way.

Take the classical confusion matrix and apply it to search. The four cells are not weighted equally — some dimensions matter far more than others:

![Search Confusion Matrix](/documentation/evaluations/search_confusion_matrix.png)

Search problems carry a **detection focus** at their core — returning something is almost always better than returning nothing. Other domains invert that priority. In criminal justice, a false positive (convicting an innocent person) costs far more than a false negative; that is a **gatekeeping focus**. 

So even at the atomic level of true/false, the data alone cannot tell us which mistake matters more — we need system specification and **requirements** to decide. That is the idea behind treating evaluation itself as a task with its own methodology: one that surfaces every precondition and works as a decision tree, mapping the overall business objective to the right combination of metrics.

## Goal oriented requirements definition

### How this document is organized

Every technical decision should trace back to the business goal it supports, and evaluation is no exception. The framework for translating business goals into metrics is [old](https://www.cs.umd.edu/~basili/publications/technical/T89.pdf) — and still very much usable today.

The structure of this document is straightforward: introduce a concept, explain it (with or without leaning on the demo use case), and let it open onto the next concept.


![Tutorial structure](/documentation/evaluations/document_structure_chain.png)

The use case stays the same throughout. Methodology is broader than any single example — one path through it can never cover the whole space — but anchoring the discussion to one concrete scenario should still leave you with a comprehensive understanding of the matter.

### Business goal

For this tutorial we select a sphere of medicine with the application for professional doctors who need AI for grounded search. **Since doctors expect some conversation style of search, the system is rather generative, however with grounded answers and great performance**. This, right above is what business wants to see - and these are the basic blocks for our requirements decomposition. 

_Requirements decomposition - the first step in our evaluation framework that splits global business goals into the system requirements (system and component level)_

_We will use for our indents and purposes: [PubMedQA](https://huggingface.co/datasets/qiaojin/PubMedQA), it has domain QA that gives us good data baseline_



