---
title: Common Questions
questions:
  - id: 0
    question: How do I get started with Qdrant Cloud?
    answer: Sign up and create a free cluster in the Console, with no credit card. Then load your document chunks and run your first filtered search.
  - id: 1
    question: Where does Qdrant fit in retrieval augmented generation?
    answer: 'Qdrant runs the retrieval step: it finds the chunks most relevant to a question, by meaning, by keywords, or both, and hands them to the LLM as context. Qdrant also filters those chunks by their metadata during the search.'
  - id: 2
    question: Do I need a separate collection for each customer?
    answer: One collection can serve every customer. Partition it by payload so each tenant's documents stay separate. Bayer serves more than 10,000 knowledge bases from one shared collection.
sitemapExclude: true
---
