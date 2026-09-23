---
title: Firecrawl
short_description: "Crawl websites with Firecrawl, turn each page into clean Markdown, and load the chunks into Qdrant for RAG over web content."
description: "Use Firecrawl to crawl a site into LLM-ready Markdown, embed the pages, and upsert them into a Qdrant collection to build RAG and semantic search on web data."
---

# Firecrawl

[Firecrawl](https://www.firecrawl.dev/) is a context API to search, scrape, and interact with the web at scale. Given a URL, it renders the page, strips navigation, ads, and boilerplate, and returns clean Markdown, HTML, or structured JSON. Its [Crawl](https://www.firecrawl.dev/crawl) endpoint does the same for a set of pages: starting from a URL, it follows links and the sitemap, renders JavaScript where needed, and returns one document per crawled page.

Because the output is already Markdown, it drops straight into a chunking and embedding step with no HTML cleanup of your own. This makes Firecrawl a good fit for loading documentation sites, knowledge bases, blogs, or any other web content into a Qdrant collection.

## Usage

This example crawls part of a documentation site, splits each page into chunks, embeds them locally with [FastEmbed](/documentation/fastembed/), and upserts the result into Qdrant.

1. Install the Firecrawl Python SDK and the Qdrant client with FastEmbed support:

    ```sh
    pip install firecrawl-py "qdrant-client[fastembed]"
    ```

2. Set up the clients. You need a [Firecrawl API key](https://www.firecrawl.dev/app/api-keys). The example uses an in-memory Qdrant instance so you can run it as-is. To keep the data, point the client at a Qdrant Cloud cluster or a local instance instead.

    ```python
    import uuid

    from firecrawl import Firecrawl
    from qdrant_client import QdrantClient, models

    FIRECRAWL_API_KEY = "YOUR-FIRECRAWL-API-KEY"

    COLLECTION = "firecrawl-docs"
    MODEL = "BAAI/bge-small-en-v1.5"  # runs locally via FastEmbed

    firecrawl = Firecrawl(api_key=FIRECRAWL_API_KEY)
    qdrant = QdrantClient(":memory:")
    # Persistent alternative:
    # qdrant = QdrantClient(url="YOUR-QDRANT-URL", api_key="YOUR-QDRANT-API-KEY")
    ```

3. Crawl the site. Firecrawl returns one document per page with `markdown` plus metadata such as the source URL and title. By default the crawl stays under the start URL; `limit` caps the number of pages.

    ```python
    crawl = firecrawl.crawl(
        "https://qdrant.tech/documentation/",
        limit=10,
        scrape_options={"formats": ["markdown"]},
    )
    print(crawl.status, len(crawl.data), "pages")
    ```

4. Split each page into overlapping chunks and build the points, grouped by page. Wrapping each chunk in `models.Document` lets the Qdrant client embed it for you. The point id is derived from the URL and chunk index so it is stable across runs.

    ```python
    def chunks(text, size=1000, overlap=100):
        for start in range(0, len(text), size - overlap):
            yield text[start : start + size]

    pages = {}
    for page in crawl.data:
        url = page.metadata.source_url
        pages[url] = [
            models.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{url}#{i}")),
                vector=models.Document(text=piece, model=MODEL),
                payload={"url": url, "title": page.metadata.title, "chunk": i, "text": piece},
            )
            for i, piece in enumerate(chunks(page.markdown or ""))
        ]
    ```

5. Create the collection with a payload index on `url`, then load the points. Deleting a page's existing points before upserting the new ones means a re-crawl replaces the page cleanly, even when it has fewer chunks than before.

    ```python
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=models.VectorParams(
                size=qdrant.get_embedding_size(MODEL),
                distance=models.Distance.COSINE,
            ),
        )
        qdrant.create_payload_index(COLLECTION, "url", models.PayloadSchemaType.KEYWORD)

    for url, points in pages.items():
        qdrant.delete(
            collection_name=COLLECTION,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[models.FieldCondition(key="url", match=models.MatchValue(value=url))]
                )
            ),
        )
        qdrant.upsert(collection_name=COLLECTION, points=points)
    ```

6. Query the collection with the same model:

    ```python
    hits = qdrant.query_points(
        collection_name=COLLECTION,
        query=models.Document(text="How do I filter points by payload?", model=MODEL),
        limit=3,
    ).points

    for hit in hits:
        print(round(hit.score, 3), hit.payload["url"])
    ```

In a test run with `limit=10`, the crawl produced 484 chunks and the payload filtering page came back as the top hit for that query. Crawl order is not fixed, so your exact numbers may differ.

## Keeping the Collection Fresh

Re-running the script on a schedule refreshes every page it crawls: the delete-then-upsert step in step 5 replaces a page's chunks in full, so shortened pages do not leave stale points behind. Pages that have disappeared from the site are not crawled and therefore not deleted; if you need that, compare the crawled URLs with the distinct `url` values in the collection and delete the difference.

To crawl only part of a site, pass `include_paths` or `exclude_paths` (regex patterns) to `crawl`, and use `limit` to cap the number of pages. For long crawls, Firecrawl supports [webhooks](https://docs.firecrawl.dev/webhooks/overview) so you can process pages as they arrive instead of waiting for the whole job.

## Further Reading

- Firecrawl [Crawl documentation](https://docs.firecrawl.dev/features/crawl)
- Firecrawl [Python SDK](https://docs.firecrawl.dev/sdks/python)
- Qdrant [FastEmbed](/documentation/fastembed/)
- Qdrant [Collections](/documentation/manage-data/collections/)
