---
title: "Design Your Own System"
short_description: "Module 4 of the Beginner Course: five questions that turn requirements into a design."
description: "Apply five questions to a system of your own, and turn what you know about layers, ingestion, and scale into a concrete design."
weight: 8
isLesson: true
---

{{< date >}} Module 4 {{< /date >}}

# Design Your Own System

Use these five questions to design a system of your own:

1. **What do the queries look like?** Plain language, exact strings such as codes and IDs, or both. If you need both, use hybrid search, from Module 3.
2. **Which fields must every search filter on?** That list is your payload schema, and each field on it needs an index.
3. **What is the unit you retrieve?** A whole document, one chunk of it, or an image. That answer tells you what to embed.
4. **How much data will arrive, and at what rate?** This decides how you run the first bulk load, and whether indexing keeps up afterward.
5. **Where is the data allowed to live?** This decides the deployment mode.

Four common system types and their main design decision.

| System | What its design turns on | Where it is built |
|--------|--------------------------|-------------------|
| News or document search | The payload schema, because every query is scoped | This module |
| Code or catalog search | Sparse retrieval, because queries are exact strings | Module 3 |
| Image, audio, or video search | Named vectors carrying one modality each | Module 5 |
| Long-document retrieval | Chunking, ahead of every other decision | [Chunking Strategies](/course/essentials/day-1/chunking-strategies/) |

### Try It Yourself: Design Your Own

Use a new brief. Answer the five questions before opening the answers.

> A law firm wants to search 60,000 scanned contracts, each 20 to 80 pages long. Lawyers ask in plain language, such as "does this lease allow subletting", and every search must be scoped to the client the contract belongs to. A few dozen contracts arrive after each deal closes.

<details>
<summary>What do the queries look like?</summary>

The example queries are in plain language, so start with dense retrieval. Add sparse retrieval if lawyers also search for clause numbers, citations, or exact phrases.

</details>

<details>
<summary>Which fields must every search filter on?</summary>

The client. Filter every query on a client field, and create a keyword payload index on it before you ingest so that filter stays fast.

</details>

<details>
<summary>What is the unit you retrieve?</summary>

A section of a contract. One vector over 80 pages blurs every clause together, so split each contract into chunks and store each chunk as its own point, carrying the contract ID in its payload.

</details>

<details>
<summary>How much data will arrive, and at what rate?</summary>

One backfill of 60,000 contracts, then small ongoing batches. How many points that becomes depends on your chunk size, so batch the load and watch the indexing gap.

</details>

<details>
<summary>Where is the data allowed to live?</summary>

The brief does not say, so ask. Contract data often carries residency or confidentiality requirements, and those decide the deployment mode.

</details>
