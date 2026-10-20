---
title: From Elasticsearch
short_description: "Migrate Elasticsearch dense vectors and document fields into Qdrant collections."
description: "Reference for Elasticsearch-to-Qdrant migration: field mappings, score conversion, Docker networking, authentication, and result verification."
weight: 20
partition: ecosystem
learning_kind: examples
goal: Operations
stack:
  - Python
  - Elasticsearch
  - Qdrant Migration Tool
  - Qdrant
  - Docker
example_resources:
  - label: Open Notebook
    url: https://colab.research.google.com/github/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb
  - label: Notebook Source
    url: https://github.com/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb
---

# Migrate From Elasticsearch to Qdrant

| Level | Stack | Time | |
| :--- | :--- | :--- |  :--- |
| Intermediate | Python, Elasticsearch, Qdrant Migration Tool, Qdrant; Docker for the container command | About 20 minutes, plus downloads, for the notebook example |[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb)|

The [Qdrant Migration Tool](https://github.com/qdrant/migration) copies dense vectors and document fields from an Elasticsearch index into a Qdrant collection. This page covers the Elasticsearch connector in [v0.6.12](https://github.com/qdrant/migration/releases/tag/v0.6.12).

For an executable migration and verification example, [open the notebook in Colab](https://colab.research.google.com/github/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb) or [view its source in `qdrant/examples`](https://github.com/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb). It migrates five documents and compares counts, IDs, payloads, vectors, rankings, and cosine scores. The notebook runs pinned native binaries in a Linux CPU runtime without Docker; the Docker options on this page apply when running the migration tool in a container.

## Run the Verification Example

Start with a fresh Colab CPU runtime, or a native Linux x86-64 or ARM64 runtime with Python **3.12 or newer**, at least **4 GB available RAM**, and **5 GB free disk space**. No existing database, Docker installation, or API key is needed for the notebook. It downloads about **900 MB** of pinned binaries and uses HTTPX **0.28.1** for HTTP requests.

1. Open the notebook and select a CPU runtime. Run sections **1–4** in order to install the HTTP client, download and verify the binaries, and start temporary Elasticsearch and Qdrant services.
2. Run sections **5–6** to create the five-document, single-shard source index and migrate it. The tool creates a Qdrant collection with the named vector `embedding` and preserves each original document ID in the `__id__` payload field.
3. Run section **7** to compare the source and destination. Every document's ID, payload, vector, ranking, and converted cosine score must pass the assertions. The [comparison table](#validated-small-migration) shows the expected results.
4. Run section **8** to stop the notebook's database processes and remove its temporary files, including if a previous cell failed. To repeat the example, rerun from section **2** after cleanup.

Successful verification prints:

```text
PASS: 5 source documents = 5 destination points.
PASS: original IDs, payloads, unit vectors, configuration, and ranking match.
PASS: all converted scores match within absolute tolerance 1e-6.
```

The example demonstrates named vectors, payload preservation, exact vector queries, and score verification. For your own index, use the requirements, mappings, and options in this reference and repeat the [verification checks](#verify-the-migration) before cutover.

## Requirements

- An Elasticsearch HTTP endpoint, a concrete index name, and credentials with `read` and `view_index_metadata` privileges.
- Top-level `dense_vector` fields with known dimensions, and document fields available through `_source`.
- A Qdrant endpoint reachable over gRPC, normally port `6334`, with credentials that can manage the destination and migration-offset collections (`_migration_offsets` by default). Port `6333` serves the HTTP API used for verification.
- A network path from the migration container to both services. The services do not need to connect directly to each other.
- For the Docker command, a running Docker Engine or Docker Desktop using Linux containers.

Use a new destination collection, or confirm that an existing collection has matching vector names, dimensions, and distance metrics. Keep the source stable during migration and verification; this connector does not provide change capture or a point-in-time snapshot.

The connector discovers top-level vector fields; it does not reconstruct nested vector mappings, Elasticsearch analyzers, or index settings. In v0.6.12, other nonempty numeric-array fields in `_source` can also be interpreted as vectors. Check such fields before migrating: an array intended as metadata can cause an unknown-vector-name error.

### Multi-Shard Pagination Limitation

Migration Tool v0.6.12 can skip documents from indexes with multiple primary shards while returning a successful exit code. Its [pagination implementation](https://github.com/qdrant/migration/blob/v0.6.12/cmd/migrate_from_elasticsearch.go) uses `_doc` with `search_after` without a unique tie-breaker. Elasticsearch documents why a [unique tie-breaker is needed](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/paginate-search-results#search-after).

In a separate check using the same service versions as the [validated small migration](#validated-small-migration), a 20-document source with one primary shard migrated all 20 documents. With two primary shards and 10 documents per shard, only 10 of 20 documents migrated. Both commands used a batch size of `1` and exited successfully.

For a source with multiple shards, use a migration path whose pagination has been verified for that source. Before cutover, compare exact counts and complete original-ID coverage. A successful exit code or a matching sample of search results does not establish completeness.

## Field and Distance Mapping

The distance mappings apply to numeric float vectors. Elasticsearch `byte` and `bit` vector semantics are outside this reference's scope.

| Elasticsearch | Qdrant | Behavior |
| :--- | :--- | :--- |
| Index | Collection | The tool can create the destination collection from the source mapping. |
| Document | Point | Original `_id` is stored in the `__id__` payload field. Valid UUIDs are reused as point IDs; other IDs become deterministic UUIDs. |
| Top-level `dense_vector` field | Named vector | The field name becomes the vector name, including when the index has only one vector field. Dimensions come from the mapping. |
| Other `_source` fields | Payload | Vector fields are removed from the payload. Check the numeric-array limitation in [Requirements](#requirements). |
| `cosine` | `Cosine` | Same similarity measure, different score scale. |
| `l2_norm` | `Euclid` | Elasticsearch transforms squared distance into a score; Qdrant returns Euclidean distance. |
| `dot_product` | `Dot` | For float vectors, Elasticsearch requires unit vectors and transforms the dot product into a score. |
| `max_inner_product` | `Dot` | Same underlying dot product, different score transformation. |

Use `--qdrant.id-field` to choose an unused payload field if your source already contains `__id__`; a source field with the same name can overwrite the preserved ID. Compare results by this payload field, not by assuming Elasticsearch `_id` equals the Qdrant point ID. The [connector implementation](https://github.com/qdrant/migration/blob/v0.6.12/cmd/migrate_from_elasticsearch.go) defines these mappings.

### Cosine-Score Conversion

For a vector-only, unboosted Elasticsearch kNN query using `similarity: "cosine"` and a Qdrant vector configured with `Cosine`:

```text
Elasticsearch _score = (1 + cosine_similarity) / 2
Qdrant score        = cosine_similarity
Qdrant score        = 2 * Elasticsearch _score - 1
```

For example, an Elasticsearch `_score` of `0.9` corresponds to a Qdrant cosine score of `0.8`. A Qdrant score of `0` corresponds to an Elasticsearch `_score` of `0.5`. The transformation preserves ranking, but raw scores and score thresholds are not interchangeable.

This conversion applies to the vector-only kNN score. A custom `script_score`, boost, lexical clause, or hybrid fusion can change the final `_score`; derive the conversion from that query instead. Elasticsearch's kNN `similarity` cutoff uses the underlying similarity, not the transformed `_score`, so do not apply this conversion to that cutoff. See the [Elasticsearch kNN query reference](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-knn-query).

For float vectors with `l2_norm`, Elasticsearch uses `1 / (1 + distance²)`, whereas Qdrant `Euclid` returns distance, with smaller values ranking first. For float `dot_product`, Elasticsearch uses `(1 + dot_product) / 2`, whereas Qdrant `Dot` returns the dot product. Metric mapping therefore does not make raw scores or application thresholds interchangeable. See the [Elasticsearch similarity definitions](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector#similarity) and [Qdrant distance metrics](https://qdrant.tech/documentation/search/search/#metrics).

## Docker Networking

Inside a container, `localhost` normally refers to that container. Select addresses based on where the databases run.

| Database Location / Platform | Migration Container Configuration |
| :--- | :--- |
| Remote or cloud services, on any supported platform | Use their reachable DNS names. Host networking is not required; the default Docker network normally provides outbound connectivity. Firewalls, VPN routing, and service allowlists must permit the connection. |
| Other containers on the same Docker daemon | Attach all three containers to the same user-defined network. Pass `--network <network-name>` and use container names, such as `http://elasticsearch:9200` and `http://qdrant:6334`. |
| Host services with Docker Engine on Linux | Add `--network host` and use `localhost`. Alternatively, add `--add-host=host.docker.internal:host-gateway` and use `host.docker.internal`; the host service must listen on an interface reachable from the bridge. |
| Host services with Docker Desktop on macOS | Use `host.docker.internal` with the default network, for example `http://host.docker.internal:9200`. |
| Windows host services with Docker Desktop, including its WSL 2 backend | Run Linux containers and use `host.docker.internal`. When invoking Docker from WSL, enable Docker Desktop integration for that distribution. The container does not share the WSL shell's `localhost`. |

Docker documents `host.docker.internal` in its [container-to-host connection instructions](https://docs.docker.com/desktop/features/networking/networking-how-tos/#connect-a-container-to-a-service-on-the-host).

Docker Desktop 4.34 and later also supports `--network host` when **Enable host networking** is enabled in **Settings > Resources > Network**. This is optional, supports Linux containers, and is incompatible with Enhanced Container Isolation. See [Docker host networking](https://docs.docker.com/engine/network/drivers/host/).

If Docker Engine runs directly inside a WSL distribution instead of Docker Desktop, host networking refers to that Linux environment. A database running in another WSL distribution or on Windows needs an address reachable from that environment.

No `-p` options are needed on the migration container because it makes outbound connections. For databases on a shared user-defined network, use their container ports, not host-published ports. See [Docker bridge networking](https://docs.docker.com/engine/network/drivers/bridge/).

In hosted Colab, `127.0.0.1` refers to the notebook runtime, not your computer. The linked notebook starts both databases in that runtime and does not require these Docker networking options.

## Migration Command

The commands use Bash-compatible line continuations. On Windows, use Bash in WSL or adapt the continuations for your shell. Replace the placeholders with your endpoints and credentials.

For remote services with basic authentication:

```bash
docker run --rm registry.cloud.qdrant.io/library/qdrant-migration:v0.6.12 elasticsearch \
    --elasticsearch.url 'https://your-es-host:9200' \
    --elasticsearch.index 'your-index' \
    --elasticsearch.username 'elastic' \
    --elasticsearch.password 'your-password' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

For Elasticsearch API-key authentication, replace the username and password flags with `--elasticsearch.api-key 'your-encoded-es-api-key'`. Use the API key's `encoded` value, the Base64 encoding of `id:api_key`, rather than the raw `api_key` component.

For local services, add the network option from [Docker Networking](#docker-networking) before the image name and change the endpoint addresses accordingly.

### Elasticsearch Options

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--elasticsearch.url` | Yes | Elasticsearch HTTP(S) endpoint. |
| `--elasticsearch.index` | Yes | Concrete index to migrate. |
| `--elasticsearch.username` | For basic auth | Username. |
| `--elasticsearch.password` | For basic auth | Password. |
| `--elasticsearch.api-key` | For API-key auth | Encoded Elasticsearch API key; use instead of basic-auth credentials. |
| `--elasticsearch.insecure-skip-verify` | No | Disables Elasticsearch TLS certificate verification; default `false`. |

### Qdrant Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.url` | `http://localhost:6334` | Qdrant gRPC endpoint reachable from the container. Set it explicitly. |
| `--qdrant.api-key` | None | Qdrant API key, if authentication is enabled. |
| `--qdrant.collection` | None | Required destination collection name. |
| `--qdrant.id-field` | `__id__` | Payload field that preserves each Elasticsearch document's original `_id`. |

See [general migration options](https://qdrant.tech/documentation/migrate-to-qdrant/#universal-cli-options) for collection creation, batching, and resuming interrupted migrations.

## Verify the Migration

Before cutover, compare a stable source index with the destination:

1. Compare the source document count with the destination point count and verify complete original-ID coverage. Check vectors and payloads as well; equal counts alone do not establish a successful migration. Account for the [v0.6.12 multi-shard pagination limitation](#multi-shard-pagination-limitation).
2. Match documents using the original-ID payload field and compare non-vector fields. Confirm each expected named vector exists with the correct dimensions and distance metric. Retrieve Elasticsearch vectors through `fields` when they are excluded from `_source`. Qdrant normalizes vectors stored with `Cosine`, so compare normalized values when source vectors are not unit length.
3. Query both services with identical vectors and equivalent filters. Specify the migrated vector name in Qdrant's `using` parameter. For a small comparison, use an exact baseline to separate migration errors from approximate-search differences.
4. Compare result IDs and ordering, then compare scores using the applicable conversion. Retune application thresholds and test the full hybrid query separately.

For production cutover and broader search-quality checks, use the [Migration Verification Guide](https://qdrant.tech/documentation/migration-guidance/).

### Validated Small Migration

The [verification notebook](https://github.com/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb) provides a runnable version of this comparison with the same fixture and checks. Follow [Run the Verification Example](#run-the-verification-example) for its starting requirements and execution order.

On October 20, 2026, a five-document migration passed using Elasticsearch **9.5.5**, Qdrant **1.19.2**, and Migration Tool **v0.6.12**, running as Linux ARM64 containers on a shared Docker network through Docker Desktop **4.67.0** on macOS.

The source used one primary shard, zero replicas, and one three-dimensional float `dense_vector` named `embedding`, with `similarity: "cosine"` and `index_options.type: "flat"`. Migration used a batch size of `2` and created the destination collection automatically. Elasticsearch's default vector exclusion from `_source` remained enabled; the connector retrieved vectors through the `fields` API.

With query vector `[1, 0, 0]`, a vector-only Elasticsearch kNN query and a Qdrant query using `using: "embedding"` and `params.exact: true` returned the same five IDs in this order:

| Original ID | Source Vector | Elasticsearch `_score` | `2 * _score - 1` | Qdrant Score |
| :--- | :--- | :--- | :--- | :--- |
| `aligned` | `[1, 0, 0]` | `1.0` | `1.0` | `1.0` |
| `near` | `[0.8, 0.6, 0]` | `0.9` | `0.8` | `0.8` |
| `orthogonal` | `[0, 1, 0]` | `0.5` | `0.0` | `0.0` |
| `negative` | `[-0.6, 0.8, 0]` | `0.2` | `-0.6` | `-0.6` |
| `opposite` | `[-1, 0, 0]` | `0.0` | `-1.0` | `-1.0` |

Scores are rounded for display. Counts matched at five documents and five points; original IDs, non-vector payload fields, and named vectors were checked. Vector values matched within an absolute tolerance of `1e-6`. The largest absolute difference between converted Elasticsearch scores and Qdrant scores was approximately `2e-8`, within the same tolerance. This checks migration correctness for this fixture; it does not measure production recall, performance, or every supported field type.

The runtime check covers the shared Docker network on macOS. The Linux and Windows host-networking instructions are based on Docker's documentation; those platform configurations were not exercised by this fixture.

## Troubleshooting

| Symptom | Check |
| :--- | :--- |
| Connection refused when using `localhost` | Select the service address for your platform and deployment location in [Docker Networking](#docker-networking). |
| Migration cannot connect to Qdrant | Use the gRPC endpoint, normally `6334`. The HTTP API, normally `6333`, is used for verification. Check TLS, credentials, and firewall rules. |
| Query reports an unknown vector name | Set Qdrant's `using` parameter to the original Elasticsearch vector-field name. |
| Numeric-array metadata causes an unknown-vector-name error during migration | Migration Tool v0.6.12 can interpret nonempty numeric arrays as vectors. Transform those metadata fields before migrating. |
| Migration reports success but destination documents are missing | Check the [v0.6.12 multi-shard pagination limitation](#multi-shard-pagination-limitation). Compare exact counts and complete original-ID coverage before cutover. |
| Result scores differ | Apply `2 * _score - 1` only to pure, unboosted cosine kNN scores. Compare IDs and exact-search ordering separately. |

## Hybrid Search

The migration copies dense vectors and document fields. It does not transfer Elasticsearch's inverted index, analyzers, or BM25 statistics. Generate [sparse vectors](https://qdrant.tech/documentation/manage-data/vectors/#sparse-vectors) separately if you need sparse retrieval in Qdrant, then combine dense and sparse results with [hybrid queries and Reciprocal Rank Fusion](https://qdrant.tech/documentation/search/hybrid-queries/).

Revalidate hybrid ranking on representative queries. Copying dense vectors does not reproduce an Elasticsearch BM25 + kNN scoring configuration.
