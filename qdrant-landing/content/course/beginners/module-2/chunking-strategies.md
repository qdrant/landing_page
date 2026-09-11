---
title: "Chunking Strategies"
short_description: "Module 2 of the Beginner Course: fixed-size, semantic, and sliding-window chunking compared."
description: "Every embedding model has a token limit, and text past it is dropped silently. Compare fixed-size, semantic, and sliding-window chunking."
weight: 8
isLesson: true
---

{{< date >}} Module 2 {{< /date >}}

# Chunking Strategies

Embedding models have a maximum token limit. `all-MiniLM-L6-v2` from Module 1 takes 256 tokens, larger models take 8,000 or more, and anything past the limit is dropped without an error. Check your model's card for its limit.

Fitting isn't the only reason to split. A chunk is the unit that gets retrieved, so one vector covering several topics averages them together and matches every query weakly, while a chunk that's too small loses the context that made the result useful.

| Strategy | How it works | Trade-off |
|----------|--------------|-----------|
| Fixed-Size | Split every N tokens regardless of content boundaries | May cut sentences mid-thought |
| Semantic | New chunk when topic or meaning shifts | Slower; needs a model to detect shifts |
| Sliding Window | Chunks overlap to preserve context across the cut | More storage; duplicate content across results |

<aside role="status">

This module introduces the main chunking strategies but doesn't explore how to choose between them in depth. For a detailed comparison and worked examples, see [Chunking Strategies](/course/essentials/day-1/chunking-strategies/#text-chunking-strategy-comparison) in the Qdrant Essentials course.
</aside>

**Fixed-Size**

![Fixed-size chunking cuts text into five ten-word chunks, splitting sentences mid-thought.](/courses/beginners/module-2/fixed-size.png)

**Semantic**

![Semantic chunking cuts text into three chunks, one per topic.](/courses/beginners/module-2/semantic.png)

**Sliding Window**

![Sliding-window chunking cuts text into four chunks, each repeating the end of the one before.](/courses/beginners/module-2/sliding-window.png)
