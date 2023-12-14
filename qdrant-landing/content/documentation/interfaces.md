---
title: Interfaces
weight: 14
---

# Interfaces

> **Note:** If you are using a language that is not listed here, you can use the REST API directly or generate a client for your language 
using [OpenAPI](https://github.com/qdrant/qdrant/blob/master/docs/redoc/master/openapi.json)
or [protobuf](https://github.com/qdrant/qdrant/tree/master/lib/api/src/grpc/proto) definitions. 

## Client Libraries
||Client Repository|Installation|Version|
|-|-|-|-|
|[![python](/docs/misc/python.webp)](https://python-client.qdrant.tech/)|**[Python](https://github.com/qdrant/qdrant-client)**|`pip install qdrant-client[fastembed]`|**Latest Release**, [API Docs](https://python-client.qdrant.tech/)|
|![typescript](/docs/misc/ts.webp)|**[Typescript](https://github.com/qdrant/qdrant-js)**|`npm install @qdrant/js-client-rest`|**Latest Release**|
|![rust](/docs/misc/rust.webp)|**[Rust](https://github.com/qdrant/rust-client)**|`cargo add qdrant-client`|**Latest Release**|
|![golang](/docs/misc/go.webp)|**[Go](https://github.com/qdrant/go-client)**|`go get github.com/qdrant/go-client`|**Latest Release**|
|![.net](/docs/misc/dotnet.webp)|**[.NET](https://github.com/qdrant/qdrant-dotnet)**|`dotnet add package Qdrant.Client`|**Latest Release**|


## API Reference

All interaction with Qdrant takes place via the REST API. We recommend using REST API if you are using Qdrant for the first time or if you are working on a prototype.

|API|Documentation|
|-|-|
| REST API |[OpenAPI Specification](https://qdrant.github.io/qdrant/redoc/index.html)|
| gRPC API| [gRPC Documentation](https://github.com/qdrant/qdrant/blob/master/docs/grpc/docs.md)|

### gRPC Interface

The gRPC methods follow the same principles as REST. For each REST endpoint, there is a corresponding gRPC method.

As per the [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml), the gRPC interface is available on the specified port.

```yaml
service:
  grpc_port: 6334
```
<aside role="status">If you decide to use gRPC, you must expose the port when starting Qdrant.</aside>
 
Running the service inside of Docker will look like this:

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

**When to use gRPC:** The choice between gRPC and the REST API is a trade-off between convenience and speed. gRPC is a binary protocol and can be more challenging to debug. We recommend using gRPC if you are already familiar with Qdrant and are trying to optimize the performance of your application.

## Qdrant Web UI

Qdrant's Web UI is an intuitive and efficient graphic interface for your Qdrant Collections, REST API and data points.

In the **Console**, you may use the REST API to interact with Qdrant, while in **Collections**, you can manage all the collections and upload Snapshots. 

![Qdrant Web UI](/articles_data/qdrant-1.3.x/web-ui.png)

### Accessing the Web UI

First, run the Docker container:

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

The GUI is available at `http://localhost:6333/dashboard`




