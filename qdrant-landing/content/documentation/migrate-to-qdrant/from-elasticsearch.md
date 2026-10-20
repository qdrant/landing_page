---
title: From Elasticsearch
short_description: "Migrate Elasticsearch vectors to Qdrant and verify that documents, rankings, and cosine scores match."
description: "Tutorial: migrate a five-document Elasticsearch index to Qdrant, compare payloads and exact search results, and configure Docker networking for your platform."
date: 2026-10-20
weight: 20
partition: ecosystem
learning_kind: examples
goal: Operations
stack:
  - Docker
  - Elasticsearch
  - Qdrant
example_resources:
  - label: Open Notebook
    url: https://colab.research.google.com/github/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb
  - label: Notebook Source
    url: https://github.com/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb
---

# Migrate from Elasticsearch to Qdrant

| Level | Stack | Estimated Time |
| :--- | :--- | :--- |
| Intermediate | Docker, Elasticsearch, Qdrant Migration Tool, curl, jq | 30 minutes, plus image downloads |

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb)

Migrate five documents from Elasticsearch into Qdrant, then verify the document count, original IDs, metadata, vectors, search order, and cosine scores. You will use real Elasticsearch and Qdrant services with a small deterministic fixture.

The terminal walkthrough uses Docker. The [matching notebook](https://github.com/qdrant/examples/blob/update-elastic-migration/elasticsearch-migration/elasticsearch-migration.ipynb) runs the same fixture and checks using native binaries in a Linux notebook runtime, without Docker. Choose one path.

## Prerequisites

- A running Docker Engine or Docker Desktop configured for Linux containers. Allow at least 4 GB of memory for the exercise.
- Bash, `curl`, and [jq](https://jqlang.org/download/) 1.6 or later. On Windows, use Bash through WSL with Docker Desktop integration enabled.
- Internet access to download the pinned images: Elasticsearch **9.5.5**, Qdrant **1.19.2**, and [Qdrant Migration Tool **v0.6.12**](https://github.com/qdrant/migration/releases/tag/v0.6.12).
- Available local ports `19200` and `16333`. The container names `es-migration-source` and `es-migration-target`, and network name `es-migration-tutorial`, must be unused.

This exercise uses disposable services with authentication disabled and host ports bound to `127.0.0.1`. Use authenticated TLS endpoints when adapting it to production.

## 1. Start the Services

Run `bash` to start a dedicated shell, then execute the tutorial's Bash blocks in that same shell. The cleanup handler removes only the containers and network created by this session when the shell exits.

```bash
set -euo pipefail

TUTORIAL_DIR=$(mktemp -d)
ES_ID=
QDRANT_ID=
NETWORK_ID=

cleanup() {
    if [ -n "$ES_ID" ]; then docker rm -f -v "$ES_ID" >/dev/null; fi
    if [ -n "$QDRANT_ID" ]; then docker rm -f -v "$QDRANT_ID" >/dev/null; fi
    if [ -n "$NETWORK_ID" ]; then docker network rm "$NETWORK_ID" >/dev/null; fi
}
trap cleanup EXIT

docker pull docker.elastic.co/elasticsearch/elasticsearch:9.5.5
docker pull qdrant/qdrant:v1.19.2
docker pull registry.cloud.qdrant.io/library/qdrant-migration:v0.6.12

NETWORK_ID=$(docker network create es-migration-tutorial)
QDRANT_ID=$(docker run -d --name es-migration-target \
    --network "$NETWORK_ID" \
    -p 127.0.0.1:16333:6333 \
    qdrant/qdrant:v1.19.2)
ES_ID=$(docker run -d --name es-migration-source \
    --network "$NETWORK_ID" \
    -p 127.0.0.1:19200:9200 \
    -e discovery.type=single-node \
    -e xpack.security.enabled=false \
    -e 'ES_JAVA_OPTS=-Xms512m -Xmx512m' \
    --memory 2g \
    docker.elastic.co/elasticsearch/elasticsearch:9.5.5)

for endpoint in http://127.0.0.1:19200/ http://127.0.0.1:16333/; do
    ready=false
    for attempt in {1..120}; do
        if curl -fsS "$endpoint" >/dev/null 2>&1; then
            ready=true
            break
        fi
        sleep 1
    done
    if [ "$ready" != true ]; then
        docker logs "$ES_ID"
        docker logs "$QDRANT_ID"
        exit 1
    fi
done

printf 'Services ready. Results directory: %s\n' "$TUTORIAL_DIR"
```

The services and migration tool share one Docker network. They reach each other by container name. Host-side `curl` uses the loopback-published ports; the migration container uses Qdrant's internal gRPC port `6334`.

## 2. Create the Source Index and Documents

Create one float vector field named `embedding`. Elasticsearch's `flat` index makes this small comparison exact, so approximate search and quantization do not obscure migration errors.

```bash
curl -fsS -X PUT http://127.0.0.1:19200/migration-cosine-check \
    -H 'Content-Type: application/json' -d @- <<'JSON'
{
  "settings": {"number_of_shards": 1, "number_of_replicas": 0},
  "mappings": {
    "properties": {
      "embedding": {
        "type": "dense_vector",
        "dims": 3,
        "index": true,
        "similarity": "cosine",
        "index_options": {"type": "flat"}
      },
      "title": {"type": "text"},
      "category": {"type": "keyword"},
      "tags": {"type": "keyword"},
      "metadata": {
        "properties": {
          "ordinal": {"type": "integer"},
          "verified": {"type": "boolean"}
        }
      }
    }
  }
}
JSON

curl -fsS -X POST \
    'http://127.0.0.1:19200/migration-cosine-check/_bulk?refresh=true' \
    -H 'Content-Type: application/x-ndjson' \
    --data-binary @- > "$TUTORIAL_DIR/bulk.json" <<'NDJSON'
{"index":{"_id":"aligned"}}
{"embedding":[1,0,0],"title":"Fixture: aligned","category":"cosine-validation","tags":["fixture","aligned"],"metadata":{"ordinal":0,"verified":true}}
{"index":{"_id":"near"}}
{"embedding":[0.8,0.6,0],"title":"Fixture: near","category":"cosine-validation","tags":["fixture","near"],"metadata":{"ordinal":1,"verified":true}}
{"index":{"_id":"orthogonal"}}
{"embedding":[0,1,0],"title":"Fixture: orthogonal","category":"cosine-validation","tags":["fixture","orthogonal"],"metadata":{"ordinal":2,"verified":true}}
{"index":{"_id":"negative"}}
{"embedding":[-0.6,0.8,0],"title":"Fixture: negative","category":"cosine-validation","tags":["fixture","negative"],"metadata":{"ordinal":3,"verified":true}}
{"index":{"_id":"opposite"}}
{"embedding":[-1,0,0],"title":"Fixture: opposite","category":"cosine-validation","tags":["fixture","opposite"],"metadata":{"ordinal":4,"verified":true}}
NDJSON

jq -e '.errors == false' "$TUTORIAL_DIR/bulk.json"
curl -fsS http://127.0.0.1:19200/migration-cosine-check/_count \
    | jq -e '.count == 5'
```

Both checks print `true`. The fixture includes positive, zero, and negative cosine similarities to the query vector `[1, 0, 0]`.

## 3. Run the Migration

Use the official migration image with the same network. The tool creates the destination collection and maps `embedding` to a Qdrant named vector with the same name.

```bash
docker run --rm --network "$NETWORK_ID" \
    registry.cloud.qdrant.io/library/qdrant-migration:v0.6.12 elasticsearch \
    --elasticsearch.url http://es-migration-source:9200 \
    --elasticsearch.index migration-cosine-check \
    --qdrant.url http://es-migration-target:6334 \
    --qdrant.collection migration-cosine-check \
    --migration.batch-size 2
```

The command must finish successfully before verification. Original Elasticsearch IDs such as `aligned` become deterministic Qdrant UUIDs; their original values remain in the `__id__` payload field.

## 4. Check Counts and Vector Configuration

```bash
curl -fsS http://127.0.0.1:19200/migration-cosine-check/_count \
    > "$TUTORIAL_DIR/source-count.json"
curl -fsS -X POST \
    http://127.0.0.1:16333/collections/migration-cosine-check/points/count \
    -H 'Content-Type: application/json' -d '{"exact":true}' \
    > "$TUTORIAL_DIR/target-count.json"
curl -fsS http://127.0.0.1:16333/collections/migration-cosine-check \
    > "$TUTORIAL_DIR/collection.json"

jq -e -s '.[0].count == 5 and .[1].result.count == 5' \
    "$TUTORIAL_DIR/source-count.json" "$TUTORIAL_DIR/target-count.json"
jq -e \
    '.result.config.params.vectors.embedding == {"size":3,"distance":"Cosine"}' \
    "$TUTORIAL_DIR/collection.json"
```

Both checks print `true`. Equal counts are necessary, but payloads, vectors, and search results still need comparison.

## 5. Compare Payloads, Vectors, and Search Results

Query all five documents with the same vector. Request Elasticsearch vectors through `fields`, because current Elasticsearch versions can exclude them from `_source`. Use Qdrant's `using` parameter to select the named vector and `exact` to avoid approximate-search differences.

```bash
curl -fsS -X POST \
    http://127.0.0.1:19200/migration-cosine-check/_search \
    -H 'Content-Type: application/json' -d @- \
    > "$TUTORIAL_DIR/elasticsearch-results.json" <<'JSON'
{
  "size": 5,
  "knn": {"field": "embedding", "query_vector": [1, 0, 0], "k": 5},
  "fields": ["embedding"]
}
JSON

curl -fsS -X POST \
    http://127.0.0.1:16333/collections/migration-cosine-check/points/query \
    -H 'Content-Type: application/json' -d @- \
    > "$TUTORIAL_DIR/qdrant-results.json" <<'JSON'
{
  "query": [1, 0, 0],
  "using": "embedding",
  "limit": 5,
  "with_payload": true,
  "with_vector": true,
  "params": {"exact": true}
}
JSON

jq -e -s '
  .[0].hits.hits as $source |
  .[1].result.points as $target |
  ($source | map(._id)) == ["aligned","near","orthogonal","negative","opposite"] and
  ($source | map(._id)) == ($target | map(.payload.__id__)) and
  all(range(0; 5);
    . as $i |
    ($source[$i]._source | del(.embedding)) ==
      ($target[$i].payload | del(.__id__)) and
    ($source[$i].fields.embedding | length) == 3 and
    ($target[$i].vector.embedding | length) == 3 and
    all(range(0; 3);
      . as $d |
      (($source[$i].fields.embedding[$d] -
        $target[$i].vector.embedding[$d]) | fabs) < 0.000001
    ) and
    ((2 * $source[$i]._score - 1 - $target[$i].score) | fabs) < 0.000001
  )
' "$TUTORIAL_DIR/elasticsearch-results.json" "$TUTORIAL_DIR/qdrant-results.json"

jq -r -s '
  .[0].hits.hits as $source |
  .[1].result.points as $target |
  ["ID","ES score","Converted cosine","Qdrant score"],
  (range(0; 5) as $i |
    [$source[$i]._id, $source[$i]._score,
     (2 * $source[$i]._score - 1), $target[$i].score]) |
  @tsv
' "$TUTORIAL_DIR/elasticsearch-results.json" "$TUTORIAL_DIR/qdrant-results.json"
```

The assertion prints `true`. The table should match these values, allowing floating-point rounding:

| Original ID | Elasticsearch `_score` | Converted Cosine | Qdrant Score |
| :--- | :--- | :--- | :--- |
| `aligned` | `1.0` | `1.0` | `1.0` |
| `near` | `0.9` | `0.8` | `0.8` |
| `orthogonal` | `0.5` | `0.0` | `0.0` |
| `negative` | `0.2` | `-0.6` | `-0.6` |
| `opposite` | `0.0` | `-1.0` | `-1.0` |

For an unboosted, vector-only cosine kNN query, Elasticsearch returns `(1 + cosine_similarity) / 2`. Qdrant returns cosine similarity directly, so convert with `2 * Elasticsearch _score - 1`. The unchanged IDs and order show ranking agreement; the conversion explains why the raw numbers differ.

These vectors have unit length. Qdrant normalizes vectors stored with `Cosine`, so compare normalized values or direction when adapting this check to non-unit vectors.

## 6. Clean Up

```bash
trap - EXIT
cleanup
printf 'Temporary services removed. Saved query responses: %s\n' "$TUTORIAL_DIR"
```

The JSON responses remain in the temporary results directory for inspection. To repeat the exercise, start again at step 1.

## Troubleshooting

| Symptom | Check |
| :--- | :--- |
| Docker reports a name or host-port conflict | Use unused names and ports. Do not remove an unrelated service to reuse its name. |
| A service does not become ready | Inspect the printed container logs and Docker's available memory. |
| Migration cannot connect to Qdrant | The migration tool uses gRPC on `6334`; the verification requests use HTTP on `6333`, published here as `16333`. |
| Query fails with an unknown vector name | Use `embedding` for this fixture, or the original Elasticsearch field name for your data. |
| A `jq -e` check prints `false` | Inspect the saved JSON. Check count and configuration first, then original IDs, payloads, vectors, and score conversion. |
| Numeric-array metadata triggers an unknown-vector-name error | Migration Tool v0.6.12 can classify nonempty numeric arrays as vectors. Transform those metadata fields before migrating. |

## Adapt the Migration to Your Index

The exercise checks one top-level float vector field with exact search and no filters, boosts, or hybrid scoring. For your own index, keep the source stable, use a new destination or a compatible existing collection, and check the mappings and connectivity requirements that follow.

## Requirements

- An Elasticsearch HTTP endpoint, a concrete index name, and credentials with `read` and `view_index_metadata` privileges.
- Top-level `dense_vector` fields with known dimensions, and document fields available through `_source`.
- A Qdrant endpoint reachable over gRPC, normally port `6334`, with credentials that can manage the destination and migration-offset collections (`_migration_offsets` by default). Port `6333` serves the HTTP API used for verification.
- A network path from the migration container to both services. The services do not need to connect directly to each other.

Use a new destination collection, or confirm that an existing collection has matching vector names, dimensions, and distance metrics. Keep the source stable during migration and verification; this connector does not provide change capture or a point-in-time snapshot.

The connector discovers top-level vector fields; it does not reconstruct nested vector mappings, Elasticsearch analyzers, or index settings. In v0.6.12, other nonempty numeric-array fields in `_source` can also be interpreted as vectors. Check such fields before migrating: an array intended as metadata can cause an unknown-vector-name error.

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

Use `--qdrant.id-field` to choose a different original-ID field if your source already contains `__id__`. Compare results by this payload field, not by assuming Elasticsearch `_id` equals the Qdrant point ID. The [connector implementation](https://github.com/qdrant/migration/blob/v0.6.12/cmd/migrate_from_elasticsearch.go) defines these mappings.

### Cosine-Score Conversion

For an unboosted Elasticsearch kNN query using `similarity: "cosine"`:

```text
Elasticsearch _score = (1 + cosine_similarity) / 2
Qdrant score        = cosine_similarity
Qdrant score        = 2 * Elasticsearch _score - 1
```

For example, an Elasticsearch `_score` of `0.9` corresponds to a Qdrant cosine score of `0.8`. A Qdrant score of `0` corresponds to an Elasticsearch `_score` of `0.5`.

This conversion applies to the vector-only kNN score. A custom `script_score`, boost, lexical clause, or hybrid fusion can change the final `_score`; derive the conversion from that query instead. Elasticsearch's kNN `similarity` cutoff uses the underlying similarity, not the transformed `_score`, so do not apply this conversion to that cutoff. See [Elasticsearch kNN scoring](https://www.elastic.co/docs/solutions/search/vector/knn).

For float vectors with `l2_norm`, Elasticsearch uses `1 / (1 + distance²)`, whereas Qdrant `Euclid` returns distance, with smaller values ranking first. For float `dot_product`, Elasticsearch uses `(1 + dot_product) / 2`, whereas Qdrant `Dot` returns the dot product. Metric mapping therefore does not make raw scores or application thresholds interchangeable. See the [Elasticsearch similarity definitions](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector#similarity) and [Qdrant distance metrics](/documentation/search/search/#metrics).

## Docker Networking

Inside a container, `localhost` normally refers to that container. Select addresses based on where the databases run.

| Database Location / Platform | Migration Container Configuration |
| :--- | :--- |
| Remote or cloud services, on any supported platform | Use their reachable DNS names. The default Docker network is sufficient; omit `--network host`. Firewalls, VPN routing, and service allowlists must permit the connection. |
| Other containers on the same Docker daemon | Attach all three containers to the same user-defined network. Pass `--network <network-name>` and use container names, such as `http://elasticsearch:9200` and `http://qdrant:6334`. |
| Host services with Docker Engine on Linux | Add `--network host` and use `localhost`. Alternatively, add `--add-host=host.docker.internal:host-gateway` and use `host.docker.internal`; the host service must listen on an interface reachable from the bridge. |
| Host services with Docker Desktop on macOS | Use `host.docker.internal` with the default network, for example `http://host.docker.internal:9200`. |
| Windows host services with Docker Desktop, including its WSL 2 backend | Run Linux containers and use `host.docker.internal`. Invoking Docker from a WSL shell does not make the container share that shell's `localhost`. |

Docker documents `host.docker.internal` in its [container-to-host connection instructions](https://docs.docker.com/desktop/features/networking/networking-how-tos/#i-want-to-connect-from-a-container-to-a-service-on-the-host).

Docker Desktop 4.34 and later also supports `--network host` when **Enable host networking** is enabled in **Settings > Resources > Network**. This is optional, supports Linux containers, and is incompatible with Enhanced Container Isolation. See [Docker host networking](https://docs.docker.com/engine/network/drivers/host/).

If Docker Engine runs directly inside a WSL distribution instead of Docker Desktop, host networking refers to that Linux environment. A database running in another WSL distribution or on Windows needs an address reachable from that environment.

No `-p` options are needed on the migration container because it makes outbound connections. For databases on a shared user-defined network, use their container ports, not host-published ports. See [Docker bridge networking](https://docs.docker.com/engine/network/drivers/bridge/).

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

See [general migration options](/documentation/migrate-to-qdrant/#universal-cli-options) for collection creation, batching, and resuming interrupted migrations.

## Hybrid Search

The migration copies dense vectors and document fields. It does not transfer Elasticsearch's inverted index, analyzers, or BM25 statistics. Generate [sparse vectors](/documentation/manage-data/vectors/#sparse-vectors) separately if you need sparse retrieval in Qdrant, then combine dense and sparse results with [hybrid queries and Reciprocal Rank Fusion](/documentation/search/hybrid-queries/).

Revalidate hybrid ranking on representative queries. Copying dense vectors does not reproduce an Elasticsearch BM25 + kNN scoring configuration.
