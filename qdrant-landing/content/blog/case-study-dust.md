---
title: "Dust and Qdrant: Using AI to Unlock Company Knowledge and Drive Employee Productivity"
draft: false
slug: dust-and-qdrant 
#short_description: 
description: Using AI to Unlock Company Knowledge and Drive Employee Productivity
preview_image: /case-studies/dust/preview.png
date: 2024-02-06T07:03:26-08:00
author: Manuel Meyer
featured: false
tags: 
  - Dust
  - case_study
weight: 0 
---

One of the major promises of artificial intelligence is its potential to
accelerate efficiency and productivity within businesses, empowering employees
and teams in their daily tasks. The French company [Dust](https://dust.tt/), co-founded by former
Open AI Research Engineer [Stanislas Polu](https://www.linkedin.com/in/spolu/), set out to deliver on this promise by
providing businesses and teams with an expansive platform for building
customizable and secure AI assistants.

## Challenge

"The past year has shown that large language models (LLMs) are very useful but
complicated to deploy," Polu says, especially in the context of their
application across business functions. This is why he believes that the goal of
augmenting human productivity at scale is especially a product unlock and not
only a research unlock, with the goal to identify the best way for companies to
leverage these models. Therefore, Dust is creating a product that sits between
humans and the large language models, with the focus on supporting the work of
a team within the company to ultimately enhance employee productivity.

A major challenge in leveraging leading LLMs like OpenAI, Anthropic, or Mistral
to their fullest for employees and teams lies in effectively addressing a
company's wide range of internal use cases. These use cases are typically very
general and fluid in nature, requiring the use of very large language models.
Due to the general nature of these use cases, it is very difficult to finetune
the models - even if financial resources and access to the model weights are
available. The main reason is that “the data that’s available in a company is
a drop in the bucket compared to the data that is needed to finetune such big
models accordingly,” Polu says, “which is why we believe that retrieval
augmented generation is the way to go until we get much better at fine tuning”.

For successful retrieval augmented generation (RAG) in the context of employee
productivity, it is important to get access to the company data and to be able
to ingest the data that is considered ‘shared knowledge’ of the company. This
data usually sits in various SaaS applications across the organization.

## Solution

Dust provides companies with the core platform to execute on their GenAI bet
for their teams by deploying LLMs across the organization and providing context
aware AI assistants through [RAG](https://qdrant.tech/rag/rag-evaluation-guide/)
. Users can manage so-called data sources within
Dust and upload files or directly connect to it via APIs to ingest data from
tools like Notion, Google Drive, or Slack. Dust then handles the chunking
strategy with the embeddings models and performs retrieval augmented generation.

![solution-laptop-screen](/case-studies/dust/laptop-solutions.jpg)

For this, Dust required a vector database and evaluated different options
including Pinecone and Weaviate, but ultimately decided on Qdrant as the
solution of choice. “We particularly liked Qdrant because it is open-source,
written in Rust, and it has a well-designed API,” Polu says. For example, Dust
was looking for high control and visibility in the context of their rapidly
scaling demand, which made the fact that Qdrant is open-source a key driver for
selecting Qdrant. Also, Dust's existing system which is interfacing with Qdrant,
is written in Rust, which allowed Dust to create synergies with regards to
library support.

When building their solution with Qdrant, Dust took a two step approach:

1. **Get started quickly:** Initially, Dust wanted to get started quickly and opted for
[Qdrant Cloud](https://qdrant.to/cloud), Qdrant’s managed solution, to reduce the administrative load on
Dust’s end. In addition, they created clusters and deployed them on Google
Cloud since Dust wanted to have those run directly in their existing Google
Cloud environment. This added a lot of value as it allowed Dust to centralize
billing and increase security by having the instance live within the same VPC.
“The early setup worked out of the box nicely,” Polu says.

2. **Scale and optimize:** As the load grew, Dust started to take advantage of Qdrant’s
features to tune the setup for optimization and scale. They started to look into
how they map and cache data, as well as applying some of Qdrant’s [built-in
compression features](/documentation/guides/quantization/). In particular, Dust leveraged the control of the [MMAP
payload threshold](/documentation/concepts/storage/#configuring-memmap-storage) as well as [Scalar Quantization](/articles/scalar-quantization/), which enabled Dust to manage
the balance between storing vectors on disk and keeping quantized vectors in RAM,
more effectively. “This allowed us to scale smoothly from there,” Polu says.

## Results

Dust has seen success in using Qdrant as their vector database of choice, as Polu
acknowledges: “Qdrant’s ability to handle large-scale models and the flexibility
it offers in terms of data management has been crucial for us. The observability
features, such as historical graphs of RAM, Disk, and CPU, provided by Qdrant are
also particularly useful, allowing us to plan our scaling strategy effectively.”

![“We were able to reduce the footprint of vectors in memory, which led to a significant cost reduction as
we don’t have to run lots of nodes in parallel. While being memory-bound, we were
able to push the same instances further with the help of quantization. While you
get pressure on MMAP in this case you maintain very good performance even if the
RAM is fully used. With this we were able to reduce our cost by 2x.” - Stanislas Polu, Co-Founder of Dust](/case-studies/dust/Dust-Quote.jpg)

Dust was able to scale its application with Qdrant while maintaining low latency
across hundreds of thousands of collections with retrieval only taking
milliseconds, as well as maintaining high accuracy. Additionally, Polu highlights
the efficiency gains Dust was able to unlock with Qdrant: "We were able to reduce the footprint of vectors in memory, which led to a significant cost reduction as
we don’t have to run lots of nodes in parallel. While being memory-bound, we were
able to push the same instances further with the help of quantization. While you
get pressure on MMAP in this case you maintain very good performance even if the
RAM is fully used. With this we were able to reduce our cost by 2x."



## Outlook

Dust will continue to build out their platform, aiming to be the platform of
choice for companies to execute on their internal GenAI strategy, unlocking
company knowledge and driving team productivity. Over the coming months, Dust
will add more connections, such as Intercom, Jira, or Salesforce. Additionally,
Dust will expand on its structured data capabilities.

To learn more about how Dust uses Qdrant to help employees in their day to day
tasks, check out our [Vector Space Talk](https://www.youtube.com/watch?v=toIgkJuysQ4) featuring Stanislas Polu, Co-Founder of Dust.
