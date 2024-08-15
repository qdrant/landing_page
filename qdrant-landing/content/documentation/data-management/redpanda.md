---
title: Redpanda Connect
---

![Redpanda Cover](/documentation/data-management/redpanda/redpanda-cover.png)

[Redpanda Connect](https://www.redpanda.com/connect) is a declarative data-agnostic streaming service designed for efficient, stateless processing steps. It offers transaction-based resiliency with back pressure, ensuring at-least-once delivery when connecting to at-least-once sources with sinks, without the need to persist messages during transit.

Connect pipelines are configured using a YAML file, which organizes components hierarchically. Each section represents a different component type, such as inputs, processors and outputs, and these can have nested child components and [dynamic values](https://docs.redpanda.com/redpanda-connect/configuration/interpolation/).

The [Qdrant Output](https://docs.redpanda.com/redpanda-connect/components/outputs/qdrant/) component enables streaming vector data into Qdrant collections in your RedPanda pipelines.

## Example

An example configuration of the output once the inputs and processors are set, would look like:

```yaml
input:
    # https://docs.redpanda.com/redpanda-connect/components/inputs/about/

pipeline:
  processors:
    # https://docs.redpanda.com/redpanda-connect/components/processors/about/

output:
  label: "qdrant-output"
  qdrant:
    max_in_flight: 64
    batching:
      count: 8
    grpc_host: xyz-example.eu-central.aws.cloud.qdrant.io:6334
    api_token: "<provide-your-own-key>"
    tls:
      enabled: true
    #   skip_cert_verify: false
    #   enable_renegotiation: false
    #   root_cas: ""
    #   root_cas_file: ""
    #   client_certs: []
    collection_name: "<collection_name>"
    id: root = uuid_v4()
    vector_mapping: 'root = {"some_dense": this.vector, "some_sparse": {"indices": [23,325,532],"values": [0.352,0.532,0.532]}}'
    payload_mapping: 'root = {"field": this.value, "field_2": 987}'
```

## Further Reading

- [Getting started with Connect](https://docs.redpanda.com/redpanda-connect/guides/getting_started/)
- [Qdrant Output Reference](https://docs.redpanda.com/redpanda-connect/components/outputs/qdrant/)
