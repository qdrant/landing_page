---
title: "What Is Search?"
short_description: "Module 1 of the Beginner Course: what every search system does, and the two steps behind every query."
description: "Understand what search really does: match a question against a collection, then rank what comes back. The foundation for every retrieval system in this course."
weight: 1
isLesson: true
---

{{< date >}} Module 1 {{< /date >}}

# What Is Search?

<div class="video">
<iframe
  src="https://www.youtube.com/embed/5FOzvyCG-8s?rel=0"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

**Follow-along code**: [Module 1 notebook](https://github.com/qdrant/examples/blob/master/course/beginners/Module1.ipynb)

Search is the act of finding the right information out of everything you have, given a question. You type "car repair" into a box, and something has to decide which of your thousands of documents, products, or messages actually answers that.

Every search system, no matter how it's built internally, does the same two things:

1. **Retrieve**: narrow a huge collection down to a shortlist of documents that might be relevant.
2. **Rank**: order that shortlist so the best answer ends up near the top.

At the heart of search is one question: what makes a result relevant? We'll start with the simplest possible answer, watch it fail, and build up from there. No prior knowledge of vector search engines or indexing algorithms is assumed.
