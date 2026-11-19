---
title: LibreDB Studio
short_description: "Browse and query Qdrant collections from LibreDB Studio, an open-source, self-hosted web database IDE with a built-in, read-only Qdrant connection."
description: "Use LibreDB Studio to browse Qdrant collections, vectors, and payload indexes, and to run Qdrant REST read requests such as scroll, count, facet, and query from a web editor."
---

# LibreDB Studio

[LibreDB Studio](https://github.com/libredb/libredb-studio) is an open-source (MIT), self-hosted database IDE that runs in the browser. Qdrant support is built in, next to SQL and NoSQL databases such as PostgreSQL, MongoDB, and Redis, so no plugin needs to be installed.

Studio connects to Qdrant over the REST API. Its editor takes the same `METHOD /path` request and JSON body that the [Qdrant API reference](https://api.qdrant.tech/api-reference) prints, and its object tree shows the collections that the credential can see. The Qdrant connection is read-only: Studio sends no request that writes points, payloads, vectors, indexes, collections, aliases, or snapshots.

## Prerequisites

1. A Qdrant instance to connect to. See the [Local Quickstart](/documentation/quickstart/) to run one with Docker.
2. A LibreDB Studio instance. Run it with Docker:

```bash
docker run -p 3000:3000 ghcr.io/libredb/libredb-studio:latest
```

Or with Node.js 24 or later:

```bash
npx @libredb/studio
```

Open `http://localhost:3000`. With Docker, the admin password is printed to the container log on the first run.

## Setting Up

- Add a new connection and choose Qdrant as its type.
- Under **Host & Instance**, set your Qdrant host and the REST port, `6333` by default. You can also paste an address such as `http://localhost:6333` into the host box.
- If authentication is enabled, put the key in **API key or JWT**. A [read-only API key](/documentation/security/#read-only-api-key), or a [JWT](/documentation/security/#granular-access-api-keys) scoped to the collections you need and given an expiry, is the recommended choice. Studio warns when a JWT declares no expiry or manage access.
- Studio sends a key without TLS only to the local machine or through an SSH tunnel. For a remote server, enable [TLS](/documentation/security/#tls) and choose an SSL mode. A custom CA and client certificates are supported.
- Run **Test Connection**, then **Establish Connection**.

![LibreDB Studio connection dialog for Qdrant](/documentation/platforms/libredb-studio/libredb-studio-connection.png)

## Using Qdrant in LibreDB Studio

- **Browse collections**: The object tree lists each collection with its dense, sparse, and multivector fields and their types, its payload indexes, and the top-level payload keys found in a sample of 1,000 points. Clicking a collection scrolls its first 100 points.

![Qdrant collection in the LibreDB Studio object tree](/documentation/platforms/libredb-studio/libredb-studio-collection-tree.png)

- **Run read requests**: The editor runs one Qdrant REST request per run. Seventeen read routes are available, including point retrieval by ID, scroll, exact count, facet, [query](/documentation/search/search/), batch query, and grouped query, with [filters](/documentation/search/filtering/) written as Qdrant `must`, `should`, and `must_not` conditions. Body keys are checked against the route's schema, so a misspelled filter key is refused instead of being ignored.
- **Read vectors**: Results show IDs, payload fields, and vectors as columns. A vector cell shows its dimension and copies the full value.

![BM25 query result with vector cells in LibreDB Studio](/documentation/platforms/libredb-studio/libredb-studio-query.png)

- **Inspect a collection**: The Source tab of a collection shows its configuration and its state: status, optimizer status, the approximate point count, aliases, snapshots, optimizations, and cluster information.

Text queries on sparse vectors can use Qdrant's [BM25 model](/documentation/inference/inference-bm25/) (`qdrant/bm25`), which runs within the Qdrant cluster, so no separate inference service is involved.

## Compatibility

LibreDB Studio has been tested against Qdrant 1.19.1. It reads the server version when it connects, and when a request uses a key that needs a newer server, such as `match.prefix` or `params.idf` from 1.19.0, Studio stops the request before sending it and names the version that key needs.

## Further Reading

- [LibreDB Studio on GitHub](https://github.com/libredb/libredb-studio)
- [LibreDB Studio Qdrant provider documentation](https://github.com/libredb/libredb-studio/blob/main/docs/providers/qdrant.md)
