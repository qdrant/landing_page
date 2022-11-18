---
title: Install
weight: 11
---

## With Docker

The easiest way to start using Qdrant is to run it from a ready-made Docker image.
The latest versions are always available on [DockerHub](https://hub.docker.com/r/qdrant/qdrant/tags?page=1&ordering=last_updated) and [GitHub Packages](https://github.com/qdrant/qdrant/packages/713873/versions).

Make sure that Docker daemon is installed and running:

```bash
sudo docker info
```

* If you do not see the server listed, start the Docker daemon.
* On Linux, Docker needs `sudo` privileges. To run Docker commands without `sudo` privileges, create a docker group and add your users (see [Post-installation Steps for Linux](https://docs.docker.com/engine/install/linux-postinstall/) for details).

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

With this command, you will start a Qdrant instance with the default configuration.
It will store all data in `./path/to/data` directory.

By default, Qdrant uses port 6333, so at [localhost:6333](http://localhost:6333) you should see the welcome message.

## From source

Qdrant is written in Rust and can be compiled into a binary executable.
This installation method can be helpful if you want to compile Qdrant for a specific processor architecture or if you do not want to use Docker for some reason.

Before compiling, make sure that the necessary libraries and the [rust toolchain](https://www.rust-lang.org/tools/install) are installed.
The current list of required libraries can be found in the [Dockerfile](https://github.com/qdrant/qdrant/blob/master/Dockerfile).

Select the minimum set of processor instructions that will be available when using the service.
The instruction set depends on the hardware at your disposal.

You can enable runtime selection of the architecture at the cost of a slightly bigger binary file size: 

```bash
export OPENBLAS_DYNAMIC_ARCH=1
```

Or select specific architecture:

```bash
export OPENBLAS_TARGET=CORE2
```

Build Qdrant with Cargo:

```bash
cargo build --release --bin qdrant
```

After a successful build, the binary is available at `./target/release/qdrant`.

## With Kubernetes

You can use a ready-made [Helm Chart](https://helm.sh/docs/) to run Qdrant in your Kubeternetes cluster.

```bash
helm repo add qdrant https://qdrant.to/helm
helm install qdrant-release qdrant/qdrant
```

Read further instructions in [qdrant-helm](https://github.com/qdrant/qdrant-helm) repository.

## Configuration

Qdrant gets its operating parameters from the configuration file.
The configuration file is read when you start the service from the directory `./config/`.

The default values are stored in the file [./config/config.yaml](https://github.com/qdrant/qdrant/blob/master/config/config.yaml).

You can overwrite values by adding new records to the file `./config/production.yaml`. See an example [here](https://github.com/qdrant/qdrant/blob/master/config/production.yaml).

If you are using Docker, then running the service with a custom configuration will be as follows:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/path/to/data:/qdrant/storage \
    -v $(pwd)/path/to/custom_config.yaml:/qdrant/config/production.yaml \
    qdrant/qdrant
```

Where `./path/to/custom_config.yaml` is your custom configuration file with values to override.

Among other things, the configuration file allows you to specify the following settings:

- Optimizer parameters
- Network settings
- Default vector index parameters
- Storage settings

See the comments in the [configuration file itself](https://github.com/qdrant/qdrant/blob/master/config/config.yaml) for details.

## Python client

In addition to the service itself, Qdrant has a distinct python client, which has some additional features compared to clients generated from OpenAPI directly.

To install this client, just run the following command:

```bash
pip install qdrant-client
```

### Integrations

Qdrant may be also used as an efficient vector search backend in some other tools. Please check out the [Integrations](../integrations/) section
for some more details.
