---
title: Concepts
weight: 8
# If the index.md file is empty, the link to the section will be hidden from the sidebar
partition: qdrant
---

# Concepts

Think of these concepts as a glossary. Each of these concepts include a link to
detailed information, usually with examples. If you're new to AI, these concepts
can help you learn more about AI and the Qdrant approach.

## Collections

[Collections](/documentation/concepts/collections/) define a named set of points that you can use for your search.

## Payload

A [Payload](/documentation/concepts/payload/) describes information that you can store with vectors.

## Points

[Points](/documentation/concepts/points/) are a record which consists of a vector and an optional payload. 

## Search

[Search](/documentation/concepts/search/) describes _similarity search_, which set up related objects close to each other in vector space.

## Explore

[Explore](/documentation/concepts/explore/) includes several APIs for exploring data in your collections.

## Hybrid Queries

[Hybrid Queries](/documentation/concepts/hybrid-queries/) combines multiple queries or performs them in more than one stage.

## Filtering

[Filtering](/documentation/concepts/filtering/) defines various database-style clauses, conditions, and more.

## Optimizer

[Optimizer](/documentation/concepts/optimizer/) describes options to rebuild
database structures for faster search. They include a vacuum, a merge, and an
indexing optimizer.

## Storage

[Storage](/documentation/concepts/storage/) describes the configuration of storage in segments, which include indexes and an ID mapper.

## Indexing

[Indexing](/documentation/concepts/indexing/) lists and describes available indexes. They include payload, vector, sparse vector, and a filterable index.

## Snapshots

[Snapshots](/documentation/concepts/snapshots/) describe the backup/restore process (and more) for each node at specific times.
