---
title: Loading Unstructured.io Data into Qdrant from the Terminal
slug: qdrant-unstructured
short_description: Loading Unstructured Data into Qdrant from the Terminal
description: Learn how to simplify the process of loading unstructured data into Qdrant using the Qdrant Unstructured destination.
preview_image: /blog/qdrant-unstructured/preview.jpg
date: 2024-01-09T00:41:38+05:30
author: Anush Shetty
tags:
  - integrations
  - qdrant
  - unstructured
---

Building powerful applications with Qdrant starts with loading vector representations into the system. Traditionally, this involves scraping or extracting data from sources, performing operations such as cleaning, chunking, and generating embeddings, and finally loading it into Qdrant. While this process can be complex, Unstructured.io includes Qdrant as an ingestion destination.

In this blog post, we'll demonstrate how to load data into Qdrant from the channels of a Discord server. You can use a similar process for the [20+ vetted data sources](https://unstructured-io.github.io/unstructured/ingest/source_connectors.html) supported by Unstructured.

### Prerequisites

- A running Qdrant instance. Refer to our [Quickstart guide](https://qdrant.tech/documentation/quick-start/) to set up an instance.
- A Discord bot token. Generate one [here](https://discord.com/developers/applications) after adding the bot to your server.
- Unstructured CLI with the required extras. For more information, see the Discord [Getting Started guide](https://discord.com/developers/docs/getting-started). Install it with the following command:

```bash
pip install unstructured[discord,local-inference,qdrant]
```

Once you have the prerequisites in place, let's begin the data ingestion.

### Retrieving Data from Discord

To generate structured data from Discord using the Unstructured CLI, run the following command with the [channel IDs](https://www.pythondiscord.com/pages/guides/pydis-guides/contributing/obtaining-discord-ids/):

```bash
unstructured-ingest \
  discord \
  --channels <CHANNEL_IDS> \
  --token "<YOUR_BOT_TOKEN>" \
  --output-dir "discord-output"
```

This command downloads and structures the data in the `"discord-output"` directory.

For a complete list of options supported by this source, run:

```bash
unstructured-ingest discord --help
```

### Ingesting into Qdrant

Before loading the data, set up a collection with the information you need for the following REST call. In this example we use a local Huggingface model generating 384-dimensional embeddings. You can create a Qdrant [API key](/documentation/cloud/authentication/#create-api-keys) and set names for your Qdrant [collections](/documentation/concepts/collections/).

We set up the collection with the following command:

```bash
curl -X PUT \
  <QDRANT_URL>/collections/<COLLECTION_NAME> \
  -H 'Content-Type: application/json' \
  -H 'api-key: <QDRANT_API_KEY>' \
  -d '{
    "vectors": {
      "size": 384,
      "distance": "Cosine"
    }
}'
```

You should receive a response similar to:

```console
{"result":true,"status":"ok","time":0.196235768}
```

To ingest the Discord data into Qdrant, run:

```bash
unstructured-ingest \
  local \
  --input-path "discord-output" \
  --embedding-provider "langchain-huggingface" \
  qdrant \
  --collection-name "<COLLECTION_NAME>" \
  --api-key "<QDRANT_API_KEY>" \
  --location "<QDRANT_URL>"
```

This command loads structured Discord data into Qdrant with sensible defaults. You can configure the data fields for which embeddings are generated in the command options. Qdrant ingestion also supports partitioning and chunking of your data, configurable directly from the CLI. Learn more about it in the [Unstructured documentation](https://unstructured-io.github.io/unstructured/core.html).

To list all the supported options of the Qdrant ingestion destination, run:

```bash
unstructured-ingest local qdrant --help
```

Unstructured can also be used programmatically or via the hosted API. Refer to the [Unstructured Reference Manual](https://unstructured-io.github.io/unstructured/introduction.html).

For more information about the Qdrant ingest destination, review how Unstructured.io configures their [Qdrant](https://unstructured-io.github.io/unstructured/ingest/destination_connectors/qdrant.html) interface.
