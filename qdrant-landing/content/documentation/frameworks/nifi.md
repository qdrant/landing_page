---
title: Apache NiFi
weight: 3500
---

# Apache NiFi

[NiFi] is a real time data ingestion platform, which can transfer and manage data transfer between different sources and destination systems. It supports a wide variety of data formats like logs, geolocation data, social feeds, etc. It also supports many protocols and offers a web-based user interface for developing and monitoring data flows.

NiFi includes support for ingesting and querying data in Qdrant via its processor modules.

## Configuration

![NiFi Qdrant configuration](/documentation/frameworks/nifi/nifi-config.png)

You can configure Qdrant NiFi processors with your Qdrant credentials, query/upload configurations. The processors offer 2 built-in embedding providers to encode data into vector embeddings - HuggingFace, OpenAI.

## Put Qdrant

![NiFI Put Qdrant](/documentation/frameworks/nifi/nifi-put-qdrant.png)

The `Put Qdrant` processor can ingest NiFi [FlowFile](https://nifi.apache.org/docs/nifi-docs/html/nifi-in-depth.html#intro) data into a Qdrant collection.

## Query Qdrant

![NiFI Query Qdrant](/documentation/frameworks/nifi/nifi-query-qdrant.png)

The `Query Qdrant` processor can perform a similarity search across a Qdrant collection and return a [FlowFile](https://nifi.apache.org/docs/nifi-docs/html/nifi-in-depth.html#intro) result.

## Further Reading

- [NiFi Documentation](https://nifi.apache.org/documentation/v2/).
- [Source Code](https://github.com/apache/nifi/tree/main/nifi-python-extensions/nifi-text-embeddings-module/src/main/python)
