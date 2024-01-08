---
title: Installation
weight: 10
aliases:
  - ../install
  - ../installation
---

## Installation requirements

The following sections describe the requirements for deploying Qdrant.

### CPU and memory

The CPU and RAM that you need depends on:

- Number of vectors
- Vector dimensions
- [Payloads](/documentation/concepts/payload/) and their indexes
- Storage
- Replication
- How you configure quantization

Our [Cloud Pricing Calculator](https://cloud.qdrant.io/calculator) can help you estimate required resources without payload or index data.

### Storage

For persistent storage, Qdrant requires a block storage device with a proper file system such es ext4. This is especially important, if you mount an external volume inside the Qdrant container or if you use a Kubernetes Persistent Volume.
Qdrant won't work on a file storage device, such as NFS, or an object storage such as S3.

If you offload vectors to a local disk, we recommend you use a solid-state (SSD or NVMe) drive.

### Networking

Each Qdrant instance requires three open ports:

* `6333` - For the HTTP API, for the [Monitoring](/documentation/guides/monitoring/) health and metrics endpoints
* `6334` - For the [gRPC](documentation/interfaces/#grpc-interface) API
* `6335` - For [Distributed deployment](/documentation/guides/distributed_deployment/)

All Qdrant instances in a cluster must be able to:

- Communicate with each other over these ports
- Allow incoming connections to ports `6333` and `6334` from clients that use Qdrant.

## Installation options

Qdrant can be installed in different ways depending on your needs:

For testing or development setups, you can run the Qdrant container or as a binary executable. 

For production, you can use our Qdrant Cloud to run Qdrant either fully managed in our infrastructure or with Hybrid SaaS in yours. 

If you want to run Qdrant in your own infrastructure, without any cloud connection, we recommend to install Qdrant in a Kubernetes cluster with our Helm chart, or to use our Qdrant Enterprise Operator

## Production

For production, we recommend that you configure Qdrant in the cloud, with Kubernetes, or with a Qdrant Enterprise Operator.

### Qdrant Cloud

You can set up production with the [Qdrant Cloud](https://qdrant.to/cloud), which provides fully managed Qdrant databases. 
It provides horizontal and vertical scaling, one click installation and upgrades, monitoring, logging, as well as backup and disaster recovery. For more information, see the [Qdrant Cloud documentation](/documentation/cloud).

### Kubernetes

You can use a ready-made [Helm Chart](https://helm.sh/docs/) to run Qdrant in your Kubernetes cluster:

```bash
helm repo add qdrant https://qdrant.to/helm
helm install qdrant qdrant/qdrant
```

For more information, see the [qdrant-helm](https://github.com/qdrant/qdrant-helm/tree/main/charts/qdrant) README.

### Qdrant Operator

We provide a Qdrant Enterprise Operator for Kubernetes installations. For more information, [use this form](https://qdrant.to/contact-us) to contact us.

## Development

For development and testing, we recommend that you set up Qdrant in Docker. We also have different client libraries.

### Docker

The easiest way to start using Qdrant for testing or development is to run the Qdrant container image.
The latest versions are always available on [DockerHub](https://hub.docker.com/r/qdrant/qdrant/tags?page=1&ordering=last_updated).

Make sure that [Docker](https://docs.docker.com/engine/install/), [Podman](https://podman.io/docs/installation) or the container runtime of your choice is installed and running. The following instructions use Docker.

Pull the image:

```bash
docker pull qdrant/qdrant
```

Run the container:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/path/to/data:/qdrant/storage \
    qdrant/qdrant
```

With this command, you start a Qdrant instance with the default configuration.
It stores all data in the `./path/to/data` directory.

By default, Qdrant uses port 6333, so at [localhost:6333](http://localhost:6333) you should see the welcome message.

To change the Qdrant configuration, you can overwrite the production configuration:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/path/to/data:/qdrant/storage \
    -v $(pwd)/path/to/custom_config.yaml:/qdrant/config/production.yaml \
    qdrant/qdrant
```

Alternatively, you can use your own `custom_config.yaml` configuration file:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/path/to/data:/qdrant/storage \
    -v $(pwd)/path/to/custom_config.yaml:/qdrant/config/custom_config.yaml \
    qdrant/qdrant \
    ./qdrant --config-path config/custom_config.yaml
```

For more information, see the [Configuration](/documentation/guides/configuration/) documentation.

### Docker Compose

You can also use [Docker Compose](https://docs.docker.com/compose/) to run Qdrant.

Here is an example customized compose file for a single node Qdrant cluster:

```yaml
services:
  qdrant:
    image: qdrant/qdrant:v1.6.1
    restart: always
    container_name: qdrant
    ports:
      - 6333:6333
      - 6334:6334
    expose:
      - 6333
      - 6334
      - 6335
    configs:
      - source: qdrant_config
        target: /qdrant/config/production.yaml
    volumes:
      - ./qdrant_data:/qdrant_data

configs:
  qdrant_config:
    content: |
      log_level: INFO  
```

### From source

Qdrant is written in Rust and can be compiled into a binary executable.
This installation method can be helpful if you want to compile Qdrant for a specific processor architecture or if you do not want to use Docker.

Before compiling, make sure that the necessary libraries and the [rust toolchain](https://www.rust-lang.org/tools/install) are installed.
The current list of required libraries can be found in the [Dockerfile](https://github.com/qdrant/qdrant/blob/master/Dockerfile).

Build Qdrant with Cargo:

```bash
cargo build --release --bin qdrant
```

After a successful build, the binary is available at `./target/release/qdrant`.

## Client libraries

In addition to the service itself, Qdrant provides client libraries for different programming languages. For a full list and documentation, see the [Client libraries](../../interfaces/#client-libraries) section.
