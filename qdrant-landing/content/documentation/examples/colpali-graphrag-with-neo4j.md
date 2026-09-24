---
title: GraphRAG over PDF Page Images with ColPali and Neo4j
short_description: "Answer questions about scanned and image-heavy PDFs that text extraction can't read, using Qdrant and Neo4j."
description: "Text-based RAG misses what's only in a page image, like a signature on a scanned letter. Learn to find the right pages with Qdrant, connect facts across documents with Neo4j, and answer from both."
weight: 6
---

# GraphRAG over PDF Page Images with ColPali and Neo4j

| Time: 60 min | Level: Intermediate | Output: [GitHub Repository](https://github.com/qdrant-labs/colpali-graphrag-demo) |
| --- | ----------- | ----------- |

Most RAG pipelines for PDFs extract the text, split it into chunks, and embed the chunks. That approach breaks down on pages without much text, like scans, forms, and signed letters.

The example in this tutorial is a real 8-page report from the U.S. Government Accountability Office (GAO). Page 6 is a scanned letter from the Small Business Administration (SBA). If you ask a PDF library for the text on that page, you get about 120 characters. The name of the person who signed it only exists in the image.

Finding that page is only half the problem. Questions about reports like this one are often about how things connect: who signed what, which company works for which contractor, and who later acquired that company. Those facts are spread across pages, and sometimes across documents. A graph stores them as nodes and relationships, so an entity mentioned in two reports becomes one node that links both. Answering a question then becomes a short traversal from the pages you found, instead of hoping the right pages all land in the top results.

In this tutorial, you will build a GraphRAG system that works with the page images directly, instead of extracting text:

- **Qdrant** stores a ColPali embedding of each page image and finds the pages that match a question.
- **Neo4j** stores the people, organizations, and facts that a vision model reads off the same images.
- **One ID connects them.** Each page gets a stable ID, used both as its Qdrant point ID and as its Neo4j `Page.id`, so Qdrant's search results can go straight into a Neo4j query.

By the end, you will have a small CLI:

```shell
uv run pagegraph ingest examples/gao-07-33r.pdf
uv run pagegraph ask "Who signed the SBA's response letter?" --show-context
```

## Architecture Overview

```text
INGEST                                        ASK

  PDF                                         question
   |                                              |
   v                                              | ColPali
  page PNGs                                       v
   |         ColPali                         .----------.
   +---------------------------------------> |  Qdrant  |
   |                                         '----------'
   |                                              | page IDs
   |         vision LLM                           v
   |                                         .----------.
   +---------------------------------------> |  Neo4j   |
                                             '----------'
                                                  | nodes + edges
   point ID = Page.id = page_id                   v
                                               LLM -> answer
```

Each system does the job it's best at. Qdrant runs the ColPali search, which is good at finding the right page but can't tell you who is on it. Neo4j holds those facts. And because entities are shared across pages and documents, a one-hop walk can reach facts on pages the search never returned. The [Run the Pipeline](#run-the-pipeline) section shows this in action.

## Graph Schema

The graph has two node labels and two relationship types:

```text
(:Entity {id, name, type, description})-[:MENTIONED_ON]->(:Page {id, document_id, document_name, page_number})
(:Entity)-[:RELATIONSHIP {type, document_id, page_id}]->(:Entity)
```

Before writing anything, the pipeline creates two uniqueness constraints:

```cypher
CREATE CONSTRAINT entity_id IF NOT EXISTS
FOR (e:Entity) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT page_id IF NOT EXISTS
FOR (p:Page) REQUIRE p.id IS UNIQUE;
```

Each constraint also creates a range index on the property, so the `MERGE` on `Entity.id` and the lookups by `Page.id` at question time don't scan every node. No other indexes are created.

## Prerequisites

- The project manager [uv](https://docs.astral.sh/uv/).
- A Qdrant instance. The [Qdrant Cloud](https://cloud.qdrant.io/) free tier works.
- A Neo4j instance. The [AuraDB](https://neo4j.com/product/auradb/) free tier works.
- A vision-capable model behind an OpenAI-compatible API.
- About 6 GB of disk space for the ColPali model, which runs locally on your CPU

## Set Up the Project

```shell
uv init --package pagegraph --python 3.14
cd pagegraph
uv add fastembed neo4j numpy openai pillow pydantic-settings pymupdf qdrant-client typer
```

Create a `.env` file:

```shell
QDRANT_URL=https://your_cluster_id.region.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=pdf_pages
NEO4J_URI=neo4j+s://your_instance_id.databases.neo4j.io
NEO4J_USER=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=openai/gpt-5.6-luna
COLPALI_MODEL=Qdrant/colpali-v1.3-fp16
```

`config.py` loads these with pydantic-settings. Add `.env` and `data/` to your `.gitignore`.

## Render Pages and Create Page IDs

Everything else depends on the page ID, so start there. The ID has to be stable, so that re-ingesting a file replaces its old data instead of duplicating it. It also has to be a UUID, because Qdrant only accepts UUIDs or unsigned integers as point IDs. UUID5 handles both:

```python
def document_id_for(path: Path) -> str:
    resolved = str(path.resolve())
    return str(uuid5(NAMESPACE_URL, resolved))


def page_id_for(document_id: str, page_number: int) -> str:
    return str(uuid5(NAMESPACE_URL, f"{document_id}:{page_number}"))
```

The document ID comes from the file's absolute path. That keeps things simple, but moving a file makes it a new document. In production, you would likely use a content hash instead.

`render_pdf` uses PyMuPDF to save each page as a PNG at 144 DPI. For a US Letter page, that's 1224 × 1584 pixels, which is enough for the vision model to read small print.

To follow along, use `examples/gao-07-33r.pdf` from the repository. It's a public-domain GAO report about a State Department contract for security work at U.S. embassies. This is page 6:

![Page 6 of the report: a scanned letter from the SBA Administrator, with letterhead and a handwritten signature](https://qdrant.tech/documentation/examples/colpali-graphrag-with-neo4j/page6-scanned.png)

## Embed Pages and Store Them in Qdrant

ColPali doesn't turn a page into a single vector. It splits the page into a 32 × 32 grid of patches and returns a 128-dimensional vector for each one, plus a few extra vectors for its internal prompt: 1,030 vectors per page. A question gets one vector per token. To score a page against a question, it finds the closest page vector for each question vector and adds up those similarities. This is called late interaction, or MaxSim.

[FastEmbed](https://qdrant.tech/documentation/fastembed/) runs ColPali locally through `LateInteractionMultimodalEmbedding`. Its `embed_image` method embeds pages and `embed_text` embeds questions, into the same vector space. Pages are embedded one at a time, because each one is over a thousand vectors.

Qdrant can store a page's whole set of vectors as one point, using a [multivector](https://qdrant.tech/documentation/tutorials-search-engineering/using-multivector-representations/):

```python
VECTOR_NAME: models.VectorParams(
    size=VECTOR_DIM,
    distance=models.Distance.COSINE,
    multivector_config=models.MultiVectorConfig(
        comparator=models.MultiVectorComparator.MAX_SIM
    ),
)
```

`size` is the length of a single vector (128), not the number of vectors. The `MAX_SIM` comparator makes Qdrant do the late-interaction scoring itself.

Each point's ID is the page ID. That's the Qdrant half of the connection:

```python
models.PointStruct(
    id=page.page_id,
    vector={VECTOR_NAME: as_multivector(page_vectors)},
    payload={...},  # document_id, document_name, page_number
)
```

Each page is about 2.5 MB of JSON, and Qdrant rejects requests over 32 MB. Sending a 16-page report in one request fails with:

```text
400 Bad Request: JSON payload (39884730 bytes) is larger than allowed (limit: 33554432 bytes)
```

To avoid this, the code upserts four pages at a time.

Searching is a single call:

```python
response = client.query_points(
    collection_name=collection,
    query=query,
    using=VECTOR_NAME,
    limit=top_k,
    with_payload=True,
    with_vectors=False,
)
```

## Extract Entities from Page Images

ColPali finds pages but doesn't read them. For that, the same PNG goes to a vision model with this prompt:

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

The image is sent as a base64 data URL, with `response_format={"type": "json_object"}`. Some providers still wrap the JSON in Markdown code fences, so the code strips those before parsing.

For page 6, the scanned letter, the model returned `Steven C. Preston` as a PERSON, with relations like this one:

```json
{"source": "Steven C. Preston", "type": "SIGNED", "target": "Appendix: Comments from the U.S. Small Business Administration"}
```

## Write the Graph to Neo4j

The model's output needs some cleanup first. Entities are matched by lowercased name, so "SBA" and "sba" become one node. The model also sometimes uses an entity in a relation without listing it as an entity, so those get added. `normalize_page_graph` handles both. Matching on lowercased names is crude: in our test run, "BP International" and "BP International (BPI)" became two separate nodes.

Each kind of data is written with one `UNWIND` query. This one creates or reuses entities and links them to their pages:

```cypher
UNWIND $mentions AS m
MERGE (e:Entity {id: m.id})
ON CREATE SET e.name = m.name, e.type = m.type
SET e.description = coalesce(nullif(e.description, ''), m.description)
WITH e, m
MATCH (p:Page {id: m.page_id})
MERGE (e)-[:MENTIONED_ON]->(p)
```

Relation names come from the model, so there's no fixed list of them. Rather than a separate Neo4j relationship type for each name, every relation is stored as `RELATIONSHIP` with a `type` property. Each one also records the `document_id` and `page_id` it came from.

Recording `document_id` lets you re-ingest a document safely: in one transaction, the pipeline deletes that document's pages and relationships, removes entities no remaining page mentions, and writes the new version.

At question time, this query takes the page IDs from Qdrant and returns the entities on those pages, plus one hop of relationships:

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

The relationship pattern has no direction, so it finds relationships pointing either way. `startNode(r)` and `endNode(r)` recover the original direction.

## Ask a Question

Qdrant's search results go straight into the Neo4j query:

```python
hits = search_pages(clients.qdrant, settings.qdrant_collection, query, top_k=k)
page_ids = [str(hit.id) for hit in hits]  # simplified
# Qdrant point IDs are Neo4j Page IDs.
subgraph = fetch_related_graph(clients.neo4j, page_ids)
```

The results are formatted as lines of text, like `Steven C. Preston SIGNED Appendix: Comments from the U.S. Small Business Administration`, and sent to the LLM with an instruction to answer using only those facts. The LLM never sees the page images.

You might wonder why we don't just send the retrieved page images to a vision model along with the question. That works when the answer is on a retrieved page, and it gives the model a second chance to read things correctly. But it can't answer from a page that wasn't retrieved, and every question costs a vision call over several images. With the graph, the expensive reading happens once at ingestion, and every answer can be traced back to specific edges. The trade-off is that answers can only be as good as the extraction.

## Run the Pipeline

```shell
uv run pagegraph ingest examples/gao-07-33r.pdf
```

The first run downloads ColPali. Embedding eight pages on a laptop CPU takes a few minutes:

```text
Rendered 8 pages to data/pages
Embedded pages with ColPali
Page 1: 21 entities, 22 relations
...
Page 6: 23 entities, 23 relations
...
Indexed 8 pages from gao-07-33r.pdf
```

Now ask about page 6, the scanned letter:

```shell
uv run pagegraph ask "Who signed the SBA's response letter?" --top-k 3 --show-context
```

```text
Qdrant pages (ColPali MaxSim):
    14.351  gao-07-33r.pdf page 5  id=0431938e-8791-535c-a5d8-4b490562cf77
    14.007  gao-07-33r.pdf page 6  id=3026a442-d810-563f-958b-e12b9123a29f
    13.274  gao-07-33r.pdf page 2  id=5b7fe68f-c51c-5f6e-afe3-af1599ee86e5
Neo4j edges:
  ...
  Steven C. Preston MENTIONED_ON gao-07-33r.pdf page 6
  Steven C. Preston SIGNED Appendix: Comments from the U.S. Small Business Administration
  ...
Answer:
Steven C. Preston signed the SBA's response letter.
```

ColPali ranked the scanned page second, and the name came from the graph. But this answer didn't need the graph walk: the `SIGNED` edge was extracted from page 6, which was already retrieved.

For a question that does need it, ingest the second report. GAO sent it to the State Department about the same contract:

```shell
uv run pagegraph ingest examples/gao-07-34r.pdf
uv run pagegraph ask "Which company acquired EmbSEC's subcontractor?" --top-k 3 --show-context
```

```text
Qdrant pages (ColPali MaxSim):
    16.179  gao-07-33r.pdf page 4  id=22c11d35-768f-5d23-b2d0-c78134d8bdc3
    15.994  gao-07-33r.pdf page 1  id=9d6b8a25-fc6d-5c85-80ff-0e7698e81a78
    15.851  gao-07-33r.pdf page 2  id=5b7fe68f-c51c-5f6e-afe3-af1599ee86e5
Neo4j edges:
  ...
  DynCorp ACQUIRED_BY Computer Sciences Corporation
  ...
  DynCorp MENTIONED_ON gao-07-33r.pdf page 2
  ...
  DynCorp SUBCONTRACTS_TO EmbSEC
  ...
Answer:
Computer Sciences Corporation acquired DynCorp, EmbSEC’s subcontractor.
```

All three retrieved pages are from the first report, and "Computer Sciences" doesn't appear anywhere in it. The first report says DynCorp is EmbSEC's subcontractor. The acquisition is only mentioned on page 2 of the second report, which wasn't retrieved. Both facts are attached to the same `DynCorp` node, so the one-hop query found the second fact from the first.

<aside role="status">Your page IDs, scores, relation names, and wording will differ from the output shown here.</aside>

To see the shared ID for yourself, open Neo4j Browser and run:

```cypher
MATCH (e:Entity)-[m:MENTIONED_ON]->(p:Page)
OPTIONAL MATCH (e)-[r:RELATIONSHIP]-(o:Entity)
RETURN e, m, p, r, o
```

Copy the `id` of any `Page` node and look it up in the `pdf_pages` collection in the Qdrant Cloud dashboard. It's the same page.

## Conclusion

Text extraction can't answer questions about what's only in a page image, like the signature on a scanned letter. In this tutorial, Qdrant searched the page images directly with ColPali, and Neo4j stored the facts a vision model read off those same images. A shared page ID connected the two, so the search results became the starting point for a graph traversal. That traversal answered a question whose answer was in a different report from every page the search returned.

The weakest link is entity matching. Names like "BP International" and "BP International (BPI)" still end up as separate nodes, and merging them would likely improve answers more than any other change. Deeper traversals, such as `-[:RELATIONSHIP*1..2]-`, are a natural next step once the graph is cleaner.

The full code is in the [colpali-graphrag-demo repository](https://github.com/qdrant-labs/colpali-graphrag-demo). For a text-based GraphRAG pipeline with Neo4j and Qdrant, see [Build a GraphRAG Agent with Neo4j and Qdrant](https://qdrant.tech/documentation/examples/graphrag-qdrant-neo4j/).
