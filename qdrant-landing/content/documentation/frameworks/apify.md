---
title: Apify 
weight: 3600
---

# Apify

Apify[https://apify.com/] is a cloud platform to build fast, reliable web scrapers and automate web browser tasks. Its serverless Actors can crawl millions of pages and perform tasks like sending emails or data transformations. Actors can be started manually, via API, or on a schedule, and easily integrate with other apps.

Qdrant is available as an [official integration](https://apify.com/apify/qdrant-integration) to load Apify datasets into a collection.

You can refer to the [Apify documentation](https://docs.apify.com/platform/integrations/qdrant) to set up the integration via the Apify UI.

## Programmatic usage

Apify also supports programmatic access to integrations via the [Apify Python SDK](https://docs.apify.com/sdk/python/).

1. Install the Apify Python SDK by running the following command:

    ```py
    pip install apify-client
    ```

2. Create a Python script and import all the necessary modules:

    ```python
    from apify_client import ApifyClient

    APIFY_API_TOKEN = "YOUR-APIFY-TOKEN"
    OPENAI_API_KEY = "YOUR-OPENAI-API-KEY"
    # COHERE_API_KEY = "YOUR-COHERE-API-KEY"

    QDRANT_URL = "YOUR-QDRANT-URL"
    QDRANT_API_KEY = "YOUR-QDRANT-API-KEY"

    client = ApifyClient(APIFY_API_TOKEN)
    ```

3. Call the [Website Content Crawler](https://apify.com/apify/website-content-crawler) Actor to crawl the Qdrant documentation and extract text content from the web pages:

    ```python
    actor_call = client.actor("apify/website-content-crawler").call(
        run_input={"startUrls": [{"url": "https://qdrant.tech/documentation/"}]}
    )
    ```

4. Call the Qdrant integration and store all data in the Qdrant Vector Database:

    ```python
    qdrant_integration_inputs = {
        "qdrantUrl": QDRANT_URL,
        "qdrantApiKey": QDRANT_API_KEY,
        "qdrantCollectionName": "apify",
        "qdrantAutoCreateCollection": True,
        "datasetId": actor_call["defaultDatasetId"],
        "datasetFields": ["text"],
        "enableDeltaUpdates": True,
        "deltaUpdatesPrimaryDatasetFields": ["url"],
        "expiredObjectDeletionPeriodDays": 30,
        "embeddingsProvider": "OpenAI", # "Cohere"
        "embeddingsApiKey": OPENAI_API_KEY,
        "performChunking": True,
        "chunkSize": 1000,
        "chunkOverlap": 0,
    }
    actor_call = client.actor("apify/qdrant-integration").call(run_input=qdrant_integration_inputs)

    ```

Upon running the script, the data from <https://qdrant.tech/documentation/> will be scraped, transformed into vector embeddings and stored in the Qdrant collection.

## Further Reading

- Apify [Documentation](https://docs.apify.com/)
- Apify [Templates](https://apify.com/templates)
- [Source Code](https://github.com/apify/actor-vector-database-integrations)
