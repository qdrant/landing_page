---
title: "Module 4: Designing a Vector Search System"
short_description: "Module 4 of the Beginners course: the decisions that turn a small collection into a system holding millions of points."
description: "Design a vector search system in Qdrant: what to decide before ingesting, what changes as data grows, where generation fits, and where to run it."
isLesson: true
weight: 50
---

{{< date >}} Module 4 {{< /date >}}

# Designing a Vector Search System

<div class="video">
<iframe src="https://youtu.be/_PBKs94QGE0?rel=0" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    referrerpolicy="strict-origin-when-cross-origin" 
    allowfullscreen>
</iframe>
</div>

So far, rebuilding a collection has taken only a few seconds. Once generating embeddings takes hours, you need to get the design right before ingesting your data.

**Follow-along code**: [Module 4 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module4.ipynb)

#### Overview

> Module 3 showed you how to combine dense and sparse retrieval. Now you'll use those pieces to design a system that can grow beyond a small collection. You'll decide what to store and embed, see what changes as the collection grows, and choose when to add more machines, when to put a language model on top, and where to run Qdrant. By the end, you'll have designed a news search system and five questions to use on a system of your own.

## Today's Path

1. [Where Design Decisions Live](/course/beginners/module-4/where-design-decisions-live/)
2. [Decide Before You Ingest](/course/beginners/module-4/decide-before-you-ingest/)
3. [What Changes as the Collection Grows](/course/beginners/module-4/what-changes-as-the-collection-grows/)
4. [Growing Past One Machine](/course/beginners/module-4/growing-past-one-machine/)
5. [From Results to an Answer](/course/beginners/module-4/from-results-to-an-answer/)
6. [Where It Runs](/course/beginners/module-4/where-it-runs/)
7. [Design Your Own System](/course/beginners/module-4/design-your-own-system/)
8. [References and Further Reading](/course/beginners/module-4/references-and-further-reading/)
