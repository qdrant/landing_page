---
title: API Reference
weight: 20
---

## REST API
[API documentation](https://qdrant.github.io/qdrant/redoc/index.html).

### gRPC

In addition to REST API, Qdrant also supports gRPC interface.
To enable gPRC interface, specify the following lines in the [configuration file](https://github.com/qdrant/qdrant/blob/master/config/config.yaml):

```yaml
service:
  grpc_port: 6334
```

gRPC interface will be available on the specified port.
The gRPC methods follow the same principles as REST. For each REST endpoint, there is a corresponding gRPC method.
Documentation on all available gRPC methods and structures is available here - [gRPC Documentation](https://github.com/qdrant/qdrant/blob/master/docs/grpc/docs.md).

The choice between gRPC and the REST API is a trade-off between convenience and speed.
gRPC is a binary protocol and can be more challenging to debug.
We recommend switching to it if you are already familiar with Qdrant and are trying to optimize the performance of your application.

If you are applying Qdrant for the first time or working on a prototype, you might prefer to use REST.