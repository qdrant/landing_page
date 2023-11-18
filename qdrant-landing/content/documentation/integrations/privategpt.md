---
title: PrivateGPT
weight: 1600
---

# PrivateGPT

[PrivateGPT](https://docs.privategpt.dev/) is a production-ready AI project that allows you to ask questions about your documents using the power of Large Language Models (LLMs), even in scenarios without an Internet connection. 100% private, no data leaves your execution environment at any point.

PrivateGPT supports Qdrant as a vectorstore for ingesting and retrieving documents.

## Usage

To enable Qdrant, set the vectorstore.database property in the settings.yaml file to qdrant and install the qdrant extra within your PrivateGPT project.

```bash
poetry install --extras qdrant
```

By default Qdrant tries to connect to an instance at http://localhost:3000.

Qdrant settings can be configured by setting values to the qdrant property in the `settings.yaml` file.

Example: 
```yaml
vectorstore:
    database: qdrant

qdrant:
    url: "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333"
    api_key: "<your-api-key>"
```

The available configuration options are:
| Field        | Description |
|--------------|-------------|
| location     | If `:memory:` - use in-memory Qdrant instance.<br>If `str` - use it as a `url` parameter.|
| url          | Either host or str of 'Optional[scheme], host, Optional[port], Optional[prefix]'.<br> Eg. `http://localhost:6333` |
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
