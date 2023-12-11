---
title: PrivateGPT
weight: 1600
---

# PrivateGPT

[PrivateGPT](https://docs.privategpt.dev/) is a production-ready AI project that allows you to inquire about your documents using Large Language Models (LLMs) with offline support.

PrivateGPT uses Qdrant as the default vectorstore for ingesting and retrieving documents.

## Configuration

Qdrant settings can be configured by setting values to the qdrant property in the `settings.yaml` file. By default, Qdrant tries to connect to an instance at http://localhost:3000.

Example: 
```yaml
qdrant:
    url: "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333"
    api_key: "<your-api-key>"
```

The available [configuration options](https://docs.privategpt.dev/manual/storage/vector-stores#qdrant-configuration) are:
| Field        | Description |
|--------------|-------------|
| location     | If `:memory:` - use in-memory Qdrant instance.<br>If `str` - use it as a `url` parameter.|
| url          | Either host or str of `Optional[scheme], host, Optional[port], Optional[prefix]`.<br> Eg. `http://localhost:6333` |
| port         | Port of the REST API interface. Default: `6333` |
| grpc_port    | Port of the gRPC interface. Default: `6334` |
| prefer_grpc  | If `true` - use gRPC interface whenever possible in custom methods. |
| https        | If `true` - use HTTPS(SSL) protocol.|
| api_key      | API key for authentication in Qdrant Cloud.|
| prefix       | If set, add `prefix` to the REST URL path.<br>Example: `service/v1` will result in `http://localhost:6333/service/v1/{qdrant-endpoint}` for REST API.|
| timeout      | Timeout for REST and gRPC API requests.<br>Default: 5.0 seconds for REST and unlimited for gRPC |
| host         | Host name of Qdrant service. If url and host are not set, defaults to 'localhost'.|
| path         | Persistence path for QdrantLocal. Eg. `local_data/private_gpt/qdrant`|
| force_disable_check_same_thread         | Force disable check_same_thread for QdrantLocal sqlite connection.|

## Next steps

Find the PrivateGPT docs [here](https://docs.privategpt.dev/).
