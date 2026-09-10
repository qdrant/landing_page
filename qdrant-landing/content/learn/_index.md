---
title: Qdrant Learn Portal
description: Grow your search engineering skills with practical Qdrant guides, working examples, structured courses, and research on retrieval and engine internals.
hideTOC: true
breadcrumb: false
partition: learn
feedback: false
build:
  render: always
cascade:
- build:
    list: local
    publishResources: false
    render: never
content:
- partial: documentation/banners/banner-a
  title: Grow as a Search Engineer
  description: Make better search decisions, adapt a working example, or understand how Qdrant works beneath the API.
  linkDescription: Choose the resource that answers your question today.
  cloudButton:
    text: Explore Practical Guides
    url: /documentation/guides/
  localButton:
    text: Start with Qdrant Essentials
    url: /course/essentials/
- partial: documentation/sections/cards-section
  title: Choose How to Learn
  description: Each resource serves a different purpose. Start with the one that fits your task.
  cardsPartial: documentation/cards/docs-cards
  cardsPerRow: 2
  cards:
  - title: Guides
    description: Evaluate search quality, choose embedding models, and plan how your Qdrant application grows.
    link:
      url: /documentation/guides/
      text: Find Practical Guidance
    image:
      src: /img/dev-portal-learn/articles.png
      alt: ''
  - title: Tutorials & Examples
    description: Open working code and walkthroughs, then adapt the implementation to your data and application stack.
    link:
      url: /learn/examples/
      text: Browse Tutorials & Examples
    image:
      src: /img/dev-portal-learn/tutorials.png
      alt: ''
  - title: Courses
    description: Build your understanding through structured lessons and exercises, starting with Qdrant Essentials.
    link:
      url: /course/
      text: Explore Courses
    image:
      src: /img/dev-portal-learn/courses.png
      alt: ''
  - title: Articles
    description: Examine retrieval experiments and the mechanisms behind Qdrant indexing, storage, and search.
    link:
      url: /articles/
      text: Explore Articles
    image:
      src: /img/dev-portal-learn/articles.png
      alt: ''
- partial: documentation/sections/cards-section
  title: Start with Your Task
  description: Take a direct path to a common search engineering task.
  cardsPartial: documentation/cards/docs-cards
  cardsPerRow: 2
  cards:
  - title: Build Your First Search
    description: Start with a small semantic search application and adapt it to your own data.
    link:
      url: /documentation/tutorials-basics/search-beginners/
      text: Open the Example
  - title: Evaluate Search Quality
    description: Choose an evaluation baseline before changing embeddings, retrieval, or ranking.
    link:
      url: /documentation/search-quality/
      text: Explore Search Evaluation
  - title: Prepare for Production
    description: Plan tenant growth and large imports around the workload you need to serve.
    link:
      url: /documentation/production-patterns/
      text: Explore Production & Performance
  - title: Design and Tune Search
    description: Choose embeddings and retrieval strategies, then follow the tuning series to test improvements.
    link:
      url: /documentation/search-tuning/
      text: Explore Search Design & Tuning
---

# Learn

Choose Guides for practical decisions, Tutorials & Examples for an implementation, Courses for structured study, or Articles for new evidence and engine mechanisms.

## Read More

- [Guides](/documentation/guides/)
- [Tutorials & Examples](/learn/examples/)
- [Courses](/course/)
- [Articles](/articles/)

Start with the resource that answers your current question.
