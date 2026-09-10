---
title: "Design a Collection Schema From a Dataset Description"
short_description: "Describe your data and the searches you need, and get a collection definition: vector configuration, distance metric, payload schema, and the payload indexes to create before you load."
description: "A Qdrant prompt template for greenfield collection design. Turns a dataset description and a set of search requirements into a concrete collection definition, with the vector configuration, distance metric, payload schema, and payload indexes chosen and justified."
weight: 10
category: authoring
output_contract: config
tags:
  - collection-design
  - payload-index
  - vectors
template_version: 1
variables:
  - name: DATASET_DESCRIPTION
    required: true
    description: "What the data is, the fields each record has, and roughly how many records."
    placeholder: "1.2M support articles: title, body, product, language, updated_at, author_id"
  - name: SEARCH_REQUIREMENTS
    required: true
    description: "The searches you need to serve, including anything you must filter or sort by."
    placeholder: "semantic search over body, filtered by product and language, newest first on ties"
  - name: EMBEDDING_MODEL
    required: false
    description: "The model you plan to use, if you've chosen one. Leave blank to have one recommended."
    placeholder: "sentence-transformers/all-MiniLM-L6-v2"
  - name: SCALE_AND_CONSTRAINTS
    required: false
    description: "Expected growth, peak QPS, latency target, and memory budget."
    placeholder: "growing to 5M in a year, ~200 QPS, p95 under 100 ms, 16 GB RAM"
draws_on:
  skills:
    - qdrant-search-quality/search-strategies
    - qdrant-multitenancy
    - qdrant-sizing
  docs:
    - /documentation/manage-data/collections/
    - /documentation/manage-data/vectors/
    - /documentation/manage-data/indexing/
---

# Design a Collection Schema From a Dataset Description

Almost every decision in a Qdrant collection is easier to make before you load data than after. Some of them, like shard count, can't be changed later at all without a full reindex. Others, like a distance metric that doesn't match how your model was trained, never raise an error: the collection accepts your vectors and returns results that look reasonable and rank badly.

This template takes a plain description of your data and the searches you need, and asks your agent to produce a concrete collection definition with every choice justified. It's the day-zero counterpart to [Review a Collection Configuration Before Launch](/documentation/agentic-tools/prompt-templates/review-collection-configuration/), which checks a configuration you already have.

## The Template

Fill in the variables, then copy the prompt into your coding assistant.

{{< prompt-template >}}
You are designing a Qdrant collection from scratch. Produce a concrete definition, not a survey of options.

Dataset:
{{DATASET_DESCRIPTION}}

Search requirements:
{{SEARCH_REQUIREMENTS}}

Embedding model:
{{EMBEDDING_MODEL}}

Scale and constraints:
{{SCALE_AND_CONSTRAINTS}}

Decide each of the following. Where the input above doesn't tell you enough, state the assumption you're making and move on rather than stopping.

1. What gets embedded. Name the field or combination of fields that becomes the vector, and say what stays in the payload only. If records are long enough to need chunking, say so, give a chunk size, and say what identifier links chunks back to the source record.
2. Vector configuration. Choose a single vector or named vectors. Use named vectors if the requirements call for searching more than one representation, for example a title vector and a body vector, or dense plus sparse. Derive the size from the model rather than hardcoding it, using client.get_embedding_size(model_name) where the client supports it. If no model was given, recommend one and say why it fits the data.
3. Distance metric. Qdrant supports Dot, Cosine, Euclid, and Manhattan. Pick the one the model was trained for, and say which. This choice does not fail loudly when it's wrong, so justify it explicitly rather than defaulting to Cosine.
4. Whether sparse vectors are warranted. If the requirements involve exact terms, product codes, identifiers, or rare vocabulary that a dense model will blur, add a sparse named vector and say which searches it serves. If not, say plainly that dense alone is enough.
5. Payload schema. List every dataset field you'd keep, with its type. Flag any field large enough that it should live outside Qdrant with only a reference stored, and say what the reference is.
6. Payload indexes. For every field the requirements filter or sort on, choose the index type: keyword, integer, float, bool, datetime, geo, uuid, or text. Match the type to the operation, not to the field's storage type. A date filtered by range needs a datetime index, not keyword. A field needing substring or phrase matching needs a text index, and you should say which tokenizer.
7. Tenancy. If the data has a per-customer, per-user, or per-workspace dimension, treat it as multitenant: set is_tenant on that field's index, and set m to 0 with payload_m configured so the global vector index isn't built. If it isn't multitenant, say so.
8. Point IDs. Choose unsigned integers or UUIDs, and say how you derive them from the source data so that a re-ingest updates records rather than duplicating them. If the natural key isn't usable as an ID, keep it in the payload with its own index.

Output four sections.

Field decisions: a table with columns Field, Role, Payload type, Index, Reason. Role is one of embedded, filter, sort, display, or reference.
Collection definition: the create_collection call followed by every create_payload_index call, in the order to run them.
Choices that can't be changed later: which of your decisions would require recreating the collection or a full reindex to undo.
Assumptions and open questions: what you assumed, and what answer from me would change the design.
{{< /prompt-template >}}

## What Good Output Looks Like

The field table should account for every field in your description, and the immutability section should be short and specific.

```text
## Field decisions
| Field      | Role      | Payload type | Index             | Reason                    |
|------------|-----------|--------------|-------------------|---------------------------|
| body       | embedded  | not stored   | none              | vector source, 1.4 KB avg |
| title      | embedded  | text         | text (word)       | second named vector       |
| product    | filter    | keyword      | keyword           | filtered on every query   |
| language   | filter    | keyword      | keyword           | 7 values, still selective |
| updated_at | sort      | datetime     | datetime          | range and tiebreak        |
| author_id  | display   | keyword      | none              | never filtered            |

## Collection definition
  client.create_collection(
      collection_name="articles",
      vectors_config={
          "body": models.VectorParams(
              size=client.get_embedding_size(MODEL), distance=models.Distance.COSINE),
          "title": models.VectorParams(
              size=client.get_embedding_size(MODEL), distance=models.Distance.COSINE),
      },
  )
  # Cosine: all-MiniLM-L6-v2 is trained with a cosine objective.
  client.create_payload_index("articles", "product", field_schema="keyword")
  client.create_payload_index("articles", "updated_at", field_schema="datetime")

## Choices that can't be changed later
  1. Vector size and distance metric. Both require recreating the collection.
  2. Named vector set. Adding a third vector later needs a full re-upload.

## Assumptions and open questions
  1. Assumed articles are single-language, so no per-language vectors.
  2. Is author_id ever filtered? If yes it needs a keyword index, which is
     cheap now and a full reindex of that field later.
```

## Related

- [Collections](/documentation/manage-data/collections/) documents the parameters the output uses, including the four distance metrics.
- [Indexing](/documentation/manage-data/indexing/) covers the payload index types and their tokenizers.
- [Review a Collection Configuration Before Launch](/documentation/agentic-tools/prompt-templates/review-collection-configuration/) checks the result once you've built it.
