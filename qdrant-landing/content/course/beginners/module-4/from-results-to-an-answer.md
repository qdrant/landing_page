---
title: "From Results to an Answer"
short_description: "Module 4 of the Beginner Course: where Retrieval-Augmented Generation sits next to search."
description: "Retrieval-Augmented Generation sends a ranked list to a language model that writes an answer. See where generation sits relative to the search system."
weight: 6
isLesson: true
---

{{< date >}} Module 4 {{< /date >}}

# From Results to an Answer

Everything so far returns a ranked list. **Retrieval-Augmented Generation (RAG)** sends that list to a language model, which writes an answer from the retrieved results. Generation sits outside the search system.

![Three steps left to right, each with what it does and an example of its output. Understand extracts intent and rewrites the query, producing "port congestion delays in Vietnam this month". Retrieve, inside a box marked Qdrant, runs a hybrid query with a filter and returns the top 10 results, the first two being articles on Ho Chi Minh City port congestion and Singapore berth waiting times. Generate, outside that box, puts those results in a prompt and the model answers, beginning "Waiting times at the city's two main berths have".](/courses/beginners/module-4/rag.png)

The simplest version embeds the question and searches with it, which makes the second step the query you already built in [Decide Before You Ingest](/course/beginners/module-4/decide-before-you-ingest/). When the question needs work first, a language model can rewrite it into better search terms, or lift a constraint such as a date range out of it and into a filter.

With RAG, you may retrieve chunks instead of whole articles. Split each article into chunks and store each chunk as its own point. That is the chunking decision from [Decide Before You Ingest](/course/beginners/module-4/decide-before-you-ingest/), so make it before you ingest.

If the answer is weak, look at retrieval before reaching for a bigger model. A bigger model cannot use a result that retrieval never returned.

Frameworks such as LangChain and LlamaIndex connect retrieval to generation. [Frameworks](/documentation/frameworks/) lists the ones with a Qdrant integration.
