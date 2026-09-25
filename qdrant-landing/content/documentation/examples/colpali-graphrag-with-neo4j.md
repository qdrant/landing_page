---
title: GraphRAG over PDF Page Images with ColPali and Neo4j
short_description: "Answer questions about scanned and image-heavy PDFs that text extraction can't read, using Qdrant and Neo4j."
description: "Text-based RAG misses what's only in a page image, like a signature on a scanned letter. Learn to find the right pages with Qdrant, connect facts across documents with Neo4j, and answer from both."
weight: 6
goal: RAG & Agents
stack:
  - Python
  - Neo4j
example_resources:
  - label: View Code
    url: https://github.com/qdrant-labs/colpali-graphrag-demo
keywords:
  - PDF
  - scanned documents
  - ColPali
  - multivectors
---

# GraphRAG over PDF Page Images with ColPali and Neo4j

| Time: 60 min | Level: Intermediate | Output: [GitHub Repository](https://github.com/qdrant-labs/colpali-graphrag-demo) |
| --- | ----------- | ----------- |

Most RAG pipelines for PDFs extract the text, split it into chunks, and embed the chunks. That approach breaks down on pages without much text, like scans, forms, and signed letters.

This tutorial is a walkthrough of the [colpali-graphrag-demo](https://github.com/qdrant-labs/colpali-graphrag-demo) repository. Every code block below is an excerpt from that repository, labeled with its file path.

## The Page Text Extraction Cannot Read

The example document is a real 8-page report from the U.S. Government Accountability Office (GAO), about a State Department contract for security work at U.S. embassies. Page 6 is a scanned letter from the Small Business Administration (SBA):

![Page 6 of the report: a scanned letter from the SBA Administrator, with letterhead and a handwritten signature](/documentation/examples/colpali-graphrag-with-neo4j/page6-scanned.png)

Ask a PDF library for the text on that page:

```shell
uv run --with pymupdf python -c \
  "import pymupdf; print(pymupdf.open('examples/gao-07-33r.pdf')[5].get_text())"
```

You get 241 characters, all of them page furniture:

```text
Appendix: Comments from the U.S. Small
Business Administration



 (120595)
Page 6                                                                                                         GAO-07-33R  State Department 8(a) Contract
```

The body of the letter is not there. Neither is the name of the person who signed it, the date, nor the acronym `WMADO`, the district office that the letter instructs to assess a mentor/protégé relationship. Search the text of every page of both reports and `WMADO` returns nothing, so a text-based pipeline cannot even find this page, let alone answer from it.

Finding the page is only half the problem. Questions about reports like this one are about how things connect: who signed what, which company works for which contractor, and who acquired that company. Those facts are spread across pages, and sometimes across documents. A graph stores them as nodes and relationships, so an entity mentioned on two pages becomes one node that links both, and answering a question becomes a short traversal from the pages the search found.

## Architecture Overview

![Ingest renders each PDF page to a PNG, ColPali embeds it into Qdrant and a vision model writes entities to Neo4j. A question is embedded with ColPali, Qdrant returns page IDs, Neo4j returns nodes and edges, and an LLM answers](/documentation/examples/colpali-graphrag-with-neo4j/architecture.svg)

Each system does the job it's best at. Qdrant runs the ColPali search, which finds the right page but can't tell you who is on it. Neo4j holds those facts. Because entities are shared across pages and documents, a one-hop walk can reach facts on pages the search never returned.

## Graph Schema

The graph has two node labels and two relationship types:

![Graph schema: an Entity node points to a Page node through MENTIONED_ON, and to another Entity through RELATIONSHIP](/documentation/examples/colpali-graphrag-with-neo4j/graph-schema.svg)

Before writing anything, the pipeline creates two uniqueness constraints. Each one also creates a range index on its property, so the `MERGE` on `Entity.id` and the lookups by `Page.id` at question time don't scan every node.

`src/pagegraph/graph.py`:

```python
def ensure_schema(driver: Driver) -> None:
    driver.execute_query(
        "CREATE CONSTRAINT entity_id IF NOT EXISTS "
        "FOR (e:Entity) REQUIRE e.id IS UNIQUE"
    )
    driver.execute_query(
        "CREATE CONSTRAINT page_id IF NOT EXISTS "
        "FOR (p:Page) REQUIRE p.id IS UNIQUE"
    )
```

## Prerequisites

- The project manager [uv](https://docs.astral.sh/uv/).
- A Qdrant instance. The [Qdrant Cloud](https://cloud.qdrant.io/) free tier works.
- A Neo4j instance. The [AuraDB](https://neo4j.com/product/auradb/) free tier works.
- A vision-capable model behind an OpenAI-compatible API.
- About 6 GB of disk space for the ColPali model, which runs locally on your CPU.

## Set Up the Project

```shell
git clone https://github.com/qdrant-labs/colpali-graphrag-demo.git
cd colpali-graphrag-demo
cp .env.example .env
uv sync
```

Fill in `.env` with your Qdrant URL and API key, your Neo4j URI and credentials, and your model API key, model name, and base URL. `src/pagegraph/config.py` loads them with pydantic-settings.

## Embed Pages and Store Them in Qdrant

`src/pagegraph/pdf.py` renders each page to a PNG at 144 DPI and gives it a page ID: a UUID5 of the document ID and the page number, which is what both Qdrant and Neo4j store.

ColPali doesn't turn a page into a single vector. It splits the page into a 32 × 32 grid of patches and returns a 128-dimensional vector for each one, plus a few extra vectors for its internal prompt: 1,030 vectors per page. A question gets one vector per token. To score a page against a question, it finds the closest page vector for each question vector and adds up those similarities. This is called late interaction, or MaxSim.

[FastEmbed](https://qdrant.tech/documentation/fastembed/) runs ColPali locally through `LateInteractionMultimodalEmbedding`, embedding pages and questions into the same vector space. Qdrant stores a page's whole set of vectors as one point, using a [multivector](https://qdrant.tech/documentation/tutorials-search-engineering/using-multivector-representations/).

`src/pagegraph/qdrant_store.py`:

```python
def ensure_collection(client: QdrantClient, name: str) -> None:
    if not client.collection_exists(name):
        client.create_collection(
            collection_name=name,
            vectors_config={
                VECTOR_NAME: models.VectorParams(
                    size=VECTOR_DIM,
                    distance=models.Distance.COSINE,
                    multivector_config=models.MultiVectorConfig(
                        comparator=models.MultiVectorComparator.MAX_SIM
                    ),
                )
            },
        )
    client.create_payload_index(
        collection_name=name,
        field_name="document_id",
        field_schema=models.PayloadSchemaType.KEYWORD,
    )
```

`size` is the length of a single vector (128), not the number of vectors. The `MAX_SIM` comparator makes Qdrant do the late-interaction scoring itself.

`upsert_pages` writes one `PointStruct` per page, with the page ID as the point ID and the document and page numbers as payload. It upserts four pages at a time, because a page is about 2.5 MB of JSON and Qdrant caps a request at 32 MB.

Searching is a single call, and the IDs that come back are page IDs.

`src/pagegraph/qdrant_store.py`:

```python
def search_pages(
    client: QdrantClient,
    collection: str,
    query: list[list[float]],
    *,
    top_k: int = 5,
) -> list[models.ScoredPoint]:
    response = client.query_points(
        collection_name=collection,
        query=query,
        using=VECTOR_NAME,
        limit=top_k,
        with_payload=True,
        with_vectors=False,
    )
    return list(response.points)
```

## Extract Entities from Page Images

ColPali finds pages but doesn't read them. For that, the same PNG goes to a vision model with this prompt.

`src/pagegraph/extract.py`:

```python
EXTRACT_PROMPT = """You are looking at one PDF page as an image. There is no OCR text.
Extract entities and relations that are visible on the page.

Return JSON only:
{
  "entities": [{"name": str, "type": str, "description": str}],
  "relations": [{"source": str, "type": str, "target": str}]
}

Rules:
- type is an uppercase label like PERSON, ORGANIZATION, DOCUMENT, CONCEPT, DATE, LOCATION.
- relation type is an uppercase verb phrase like WORKS_AT, MENTIONS, RELATED_TO.
- source and target must match an entity name exactly.
- skip decorative chrome. keep only facts you can see.
"""
```

The image is sent as a base64 data URL, with `response_format={"type": "json_object"}`. Some providers still wrap the JSON in Markdown code fences, so `parse_payload` strips those before parsing.

For page 6, the scanned letter, the model returned nine entities that the text layer does not contain, including `Washington Metropolitan Area District Office (WMADO)`, `Steven C. Preston`, and `October 30, 2006`, with relations like this one:

```json
{"source": "Steven C. Preston", "type": "WORKS_AT", "target": "U.S. Small Business Administration"}
```

## Write the Graph to Neo4j

`normalize_page_graph` cleans the model's output first: it matches entities by lowercased name, so "SBA" and "sba" become one node, and it adds any entity the model used in a relation but forgot to list.

Each kind of data is written with one `UNWIND` query. This one creates or reuses entities and links them to their pages.

`src/pagegraph/graph.py`:

```cypher
UNWIND $mentions AS m
MERGE (e:Entity {id: m.id})
ON CREATE SET e.name = m.name, e.type = m.type
SET e.description = coalesce(nullif(e.description, ''), m.description)
WITH e, m
MATCH (p:Page {id: m.page_id})
MERGE (e)-[:MENTIONED_ON]->(p)
```

Relation names come from the model, so there's no fixed list of them. Rather than a separate Neo4j relationship type for each name, every relation is stored as `RELATIONSHIP` with a `type` property, plus the `document_id` and `page_id` it came from. Recording `document_id` lets you re-ingest a document safely: in one transaction, the pipeline deletes that document's pages and relationships, removes entities no remaining page mentions, and writes the new version.

At question time, this query takes the page IDs from Qdrant and returns the entities on those pages, plus one hop of relationships in either direction. `startNode(r)` and `endNode(r)` recover the original direction.

`src/pagegraph/graph.py`:

```cypher
MATCH (e:Entity)-[:MENTIONED_ON]->(p:Page)
WHERE p.id IN $page_ids
OPTIONAL MATCH (e)-[r:RELATIONSHIP]-(:Entity)
RETURN p.document_name AS document_name,
       p.page_number AS page_number,
       e.name AS entity,
       e.description AS description,
       startNode(r).name AS source,
       r.type AS type,
       endNode(r).name AS target
```

## Ask a Question

The search results from Qdrant go straight into the Neo4j query, with no lookup table in between.

`src/pagegraph/pipeline.py`:

```python
    k = top_k or settings.top_k
    query = as_multivector(clients.embedder.embed_query(question))
    hits = search_pages(clients.qdrant, settings.qdrant_collection, query, top_k=k)
    pages = [
        RetrievedPage(
            page_id=str(hit.id),
            document_name=(hit.payload or {}).get("document_name", ""),
            page_number=(hit.payload or {}).get("page_number", 0),
            score=hit.score,
        )
        for hit in hits
    ]
    # Qdrant point ids are Neo4j Page ids.
    subgraph = fetch_related_graph(clients.neo4j, [page.page_id for page in pages])
```

`format_graph_context` turns the rows into lines of text, like `DynCorp SUBCONTRACTS_TO EmbSEC`, and `build_prompt` sends them to the LLM with an instruction to answer using only that graph. The LLM never sees the page images: the expensive reading happens once, at ingestion, and every answer can be traced back to specific edges.

## Run the Pipeline

```shell
uv run pagegraph ingest examples/gao-07-33r.pdf
```

The first run downloads ColPali. Embedding eight pages on a laptop CPU takes a few minutes:

```text
Rendered 8 pages to data/pages
Embedded pages with ColPali
Page 1: 8 entities, 4 relations
Page 2: 11 entities, 5 relations
Page 3: 46 entities, 49 relations
Page 4: 7 entities, 3 relations
Page 5: 38 entities, 36 relations
Page 6: 9 entities, 3 relations
Page 7: 7 entities, 7 relations
Page 8: 11 entities, 4 relations
Upserted 8 points into Qdrant 'pdf_pages'
Wrote Page and Entity nodes to Neo4j
Indexed 8 pages from gao-07-33r.pdf
```

Page 6, the scan, produced nine entities where text extraction produced none. Now ask a question that needs both halves of the system. `WMADO` appears only in that scanned letter, and the letter never says who does the security installation work. That fact is on page 4:

```shell
uv run pagegraph ask "WMADO was directed to assess a mentor/protégé relationship. Which subcontractor does the security installation work under that contract?" --top-k 2 --show-context
```

```text
Qdrant pages (ColPali MaxSim):
    24.733  gao-07-33r.pdf page 6  id=edd5959b-7fa1-5046-b8ec-854681f231f3
    24.309  gao-07-33r.pdf page 1  id=25622417-8555-514c-9e88-d976b6fdd27b
Neo4j edges:
  ...
  DynCorp SUBCONTRACTOR_TO EmbSEC
  EmbSEC MENTIONED_ON gao-07-33r.pdf page 1
  RDR, Inc. MENTIONED_ON gao-07-33r.pdf page 6
  Steven C. Preston MENTIONED_ON gao-07-33r.pdf page 6
  Washington Metropolitan Area District Office (WMADO) MENTIONED_ON gao-07-33r.pdf page 6
  ...
Answer:
Based on the knowledge graph, **DynCorp** is the subcontractor to EmbSEC, which is the joint venture involving the mentor (RDR, Inc.) and protégé (BP International) for the security installation contract.
```

Both halves were necessary. ColPali ranked the scanned page first, and `WMADO MENTIONED_ON page 6` only exists because the vision model read the acronym off the image. Neither retrieved page names DynCorp: that edge was extracted from page 4, which the search never returned, and the query reached it in one hop from the `EmbSEC` node that page 1 mentions.

<aside role="status">Your page IDs, scores, relation names, and wording will differ from the output shown here.</aside>

## See the Shared ID

Open Neo4j Browser and run:

```cypher
MATCH (e:Entity)-[m:MENTIONED_ON]->(p:Page)
OPTIONAL MATCH (e)-[r:RELATIONSHIP]-(o:Entity)
RETURN e, m, p, r, o
```

The `id` of the `Page` node for the scanned letter is `edd5959b-7fa1-5046-b8ec-854681f231f3`, and that is the point ID to look up in the `pdf_pages` collection in the Qdrant dashboard. One value, two systems.

## Conclusion

Qdrant searched the page images directly with ColPali, and Neo4j stored the facts a vision model read off those same images. A shared page ID connected the two, so a question whose answer sat on a page the search never returned still got answered.

The weakest link is entity matching. In our run, "BP International" and "BP International (BPI)" became separate nodes, and merging names like these would improve answers more than any other change.

The full code is in the [colpali-graphrag-demo repository](https://github.com/qdrant-labs/colpali-graphrag-demo). For a text-based GraphRAG pipeline with Neo4j and Qdrant, see [Build a GraphRAG Agent with Neo4j and Qdrant](https://qdrant.tech/documentation/examples/graphrag-qdrant-neo4j/).
