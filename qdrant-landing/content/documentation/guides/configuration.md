---
title: Configuration
weight: 160
aliases:
  - ../configuration
---

# Configuration

To change or correct Qdrant's behavior, default collection settings, and network interface parameters, you can use configuration files.

The default configuration file is located at [config/config.yaml](https://github.com/qdrant/qdrant/blob/master/config/config.yaml).

To change the default configuration, add a new configuration file and specify
the path with `--config-path path/to/custom_config.yaml`. If running in
production mode, you could also choose to overwrite `config/production.yaml`.
See [ordering](#order-and-priority) for details on how configurations are
loaded.

To use Qdrant in Docker and overwrite the production configuration use:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/path/to/custom_config.yaml:/qdrant/config/production.yaml \
    qdrant/qdrant
```

Or use your own configuration file and specify it:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/path/to/custom_config.yaml:/qdrant/config/custom_config.yaml \
    qdrant/qdrant \
    ./qdrant --config-path config/custom_config.yaml
```

## Order and priority

*Effective as of v1.2.1*

Multiple configurations may be loaded on startup. All of them are merged into a
single effective configuration that is used by Qdrant.

Configurations are loaded in the following order, if present:

1. Embedded base configuration ([source](https://github.com/qdrant/qdrant/blob/master/config/config.yaml))
2. File `config/config.yaml`
3. File `config/{RUN_MODE}.yaml` (such as `config/production.yaml`)
4. File `config/local.yaml`
5. Config provided with `--config-path PATH` (if set)
6. [Environment variables](#environment-variables)

This list is from least to most significant. Properties in later configurations
will overwrite those loaded before it. For example, a property set with
`--config-path` will overwrite those in other files.

Most of these files are included by default in the Docker container. But it is
likely that they are absent on your local machine if you run the `qdrant` binary
manually.

If file 2 or 3 are not found, a warning is shown on startup.
If file 5 is provided but not found, an error is shown on startup.

Other supported configuration file formats and extensions include: `.toml`, `.json`, `.ini`.

## Environment variables

It is possible to set configuration properties using environment variables.
Environment variables are always the most significant and cannot be overwritten
(see [ordering](#order-and-priority)).

All environment variables are prefixed with `QDRANT__` and are separated with
`__`.

These variables:

```bash
QDRANT__DEBUG=1
QDRANT__LOG_LEVEL=INFO
QDRANT__SERVICE__HTTP_PORT=6333
QDRANT__SERVICE__ENABLE_TLS=1
QDRANT__TLS__CERT=./tls/cert.pem
QDRANT__TLS__CERT_TTL=3600
```

result in this configuration:

```yaml
debug: true
log_level: INFO
service:
  http_port: 6333
  enable_tls: true
tls:
  cert: ./tls/cert.pem
  cert_ttl: 3600
```

To run Qdrant locally with a different HTTP port you could use:

```bash
QDRANT__SERVICE__HTTP_PORT=1234 ./qdrant
```

## Configuration file example

```yaml
debug: false
log_level: INFO

storage:
  # Where to store all the data
  storage_path: ./storage

  # Where to store snapshots
  snapshots_path: ./snapshots

  # Optional setting. Specify where else to store temp files as default is ./storage.
  # Route to another location on your system to reduce network disk use. 
  temp_path: /tmp

  # If true - a point's payload will not be stored in memory.
  # It will be read from the disk every time it is requested.
  # This setting saves RAM by (slightly) increasing the response time.
  # Note: those payload values that are involved in filtering and are indexed - remain in RAM.
  on_disk_payload: true

  # Write-ahead-log related configuration
  wal:
    # Size of a single WAL segment
    wal_capacity_mb: 32

    # Number of WAL segments to create ahead of actual data requirement
    wal_segments_ahead: 0

  # Normal node - receives all updates and answers all queries
  node_type: "Normal"

  # Listener node - receives all updates, but does not answer search/read queries
  # Useful for setting up a dedicated backup node
  # node_type: "Listener"

  performance:
    # Number of parallel threads used for search operations. If 0 - auto selection.
    max_search_threads: 0
    # Max total number of threads, which can be used for running optimization processes across all collections.
    # Note: Each optimization thread will also use `max_indexing_threads` for index building.
    # So total number of threads used for optimization will be `max_optimization_threads * max_indexing_threads`
    max_optimization_threads: 1

  optimizers:
    # The minimal fraction of deleted vectors in a segment, required to perform segment optimization
    deleted_threshold: 0.2

    # The minimal number of vectors in a segment, required to perform segment optimization
    vacuum_min_vector_number: 1000

    # Target amount of segments optimizer will try to keep.
    # Real amount of segments may vary depending on multiple parameters:
    #  - Amount of stored points
    #  - Current write RPS
    #
    # It is recommended to select default number of segments as a factor of the number of search threads,
    # so that each segment would be handled evenly by one of the threads.
    # If `default_segment_number = 0`, will be automatically selected by the number of available CPUs
    default_segment_number: 0

    # Do not create segments larger this size (in KiloBytes).
    # Large segments might require disproportionately long indexation times,
    # therefore it makes sense to limit the size of segments.
    #
    # If indexation speed have more priority for your - make this parameter lower.
    # If search speed is more important - make this parameter higher.
    # Note: 1Kb = 1 vector of size 256
    # If not set, will be automatically selected considering the number of available CPUs.
    max_segment_size_kb: null

    # Maximum size (in KiloBytes) of vectors to store in-memory per segment.
    # Segments larger than this threshold will be stored as read-only memmaped file.
    # To enable memmap storage, lower the threshold
    # Note: 1Kb = 1 vector of size 256
    # To explicitly disable mmap optimization, set to `0`.
    # If not set, will be disabled by default.
    memmap_threshold_kb: null

    # Maximum size (in KiloBytes) of vectors allowed for plain index.
    # Default value based on https://github.com/google-research/google-research/blob/master/scann/docs/algorithms.md
    # Note: 1Kb = 1 vector of size 256
    # To explicitly disable vector indexing, set to `0`.
    # If not set, the default value will be used.
    indexing_threshold_kb: 20000

    # Interval between forced flushes.
    flush_interval_sec: 5

    # Max number of threads, which can be used for optimization per collection.
    # Note: Each optimization thread will also use `max_indexing_threads` for index building.
    # So total number of threads used for optimization will be `max_optimization_threads * max_indexing_threads`
    # If `max_optimization_threads = 0`, optimization will be disabled.
    max_optimization_threads: 1

  # Default parameters of HNSW Index. Could be overridden for each collection or named vector individually
  hnsw_index:
    # Number of edges per node in the index graph. Larger the value - more accurate the search, more space required.
    m: 16
    # Number of neighbours to consider during the index building. Larger the value - more accurate the search, more time required to build index.
    ef_construct: 100
    # Minimal size (in KiloBytes) of vectors for additional payload-based indexing.
    # If payload chunk is smaller than `full_scan_threshold_kb` additional indexing won't be used -
    # in this case full-scan search should be preferred by query planner and additional indexing is not required.
    # Note: 1Kb = 1 vector of size 256
    full_scan_threshold_kb: 10000
    # Number of parallel threads used for background index building. If 0 - auto selection.
    max_indexing_threads: 0
    # Store HNSW index on disk. If set to false, index will be stored in RAM. Default: false
    on_disk: false
    # Custom M param for hnsw graph built for payload index. If not set, default M will be used.
    payload_m: null

service:

  # Maximum size of POST data in a single request in megabytes
  max_request_size_mb: 32

  # Number of parallel workers used for serving the api. If 0 - equal to the number of available cores.
  # If missing - Same as storage.max_search_threads
  max_workers: 0

  # Host to bind the service on
  host: 0.0.0.0

  # HTTP(S) port to bind the service on
  http_port: 6333

  # gRPC port to bind the service on.
  # If `null` - gRPC is disabled. Default: null
  grpc_port: 6334
  # Uncomment to enable gRPC:
  # grpc_port: 6334

  # Enable CORS headers in REST API.
  # If enabled, browsers would be allowed to query REST endpoints regardless of query origin.
  # More info: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
  # Default: true
  enable_cors: true

  # Use HTTPS for the REST API
  enable_tls: false

  # Check user HTTPS client certificate against CA file specified in tls config
  verify_https_client_certificate: false

  # Set an api-key.
  # If set, all requests must include a header with the api-key.
  # example header: `api-key: <API-KEY>`
  #
  # If you enable this you should also enable TLS.
  # (Either above or via an external service like nginx.)
  # Sending an api-key over an unencrypted channel is insecure.
  #
  # Uncomment to enable.
  # api_key: your_secret_api_key_here

cluster:
  # Use `enabled: true` to run Qdrant in distributed deployment mode
  enabled: false

  # Configuration of the inter-cluster communication
  p2p:
    # Port for internal communication between peers
    port: 6335

    # Use TLS for communication between peers
    enable_tls: false

  # Configuration related to distributed consensus algorithm
  consensus:
    # How frequently peers should ping each other.
    # Setting this parameter to lower value will allow consensus
    # to detect disconnected nodes earlier, but too frequent
    # tick period may create significant network and CPU overhead.
    # We encourage you NOT to change this parameter unless you know what you are doing.
    tick_period_ms: 100


# Set to true to prevent service from sending usage statistics to the developers.
# Read more: https://qdrant.tech/documentation/telemetry
telemetry_disabled: false


# TLS configuration.
# Required if either service.enable_tls or cluster.p2p.enable_tls is true.
tls:
  # Server certificate chain file
  cert: ./tls/cert.pem

  # Server private key file
  key: ./tls/key.pem

  # Certificate authority certificate file.
  # This certificate will be used to validate the certificates
  # presented by other nodes during inter-cluster communication.
  #
  # If verify_https_client_certificate is true, it will verify
  # HTTPS client certificate
  #
  # Required if cluster.p2p.enable_tls is true.
  ca_cert: ./tls/cacert.pem

  # TTL, in seconds, to re-load certificate from disk. Useful for certificate rotations,
  # Only works for HTTPS endpoints, gRPC endpoints (including intra-cluster communication)
  # doesn't support certificate re-load
  cert_ttl: 3600
```

## Validation

*Available since v1.1.1*

The configuration is validated on startup. If a configuration is loaded but
validation fails, a warning is logged. E.g.:

```text
WARN Settings configuration file has validation errors:
WARN - storage.optimizers.memmap_threshold: value 123 invalid, must be 1000 or larger
WARN - storage.hnsw_index.m: value 1 invalid, must be from 4 to 10000
```

The server will continue to operate. Any validation errors should be fixed as
soon as possible though to prevent problematic behavior.