Run Qdrant from a pre-built Docker image. You can try this tutorial if you have Docker is installed on your system.

Download image from [DockerHub](https://hub.docker.com/r/qdrant/qdrant):

```bash
docker pull qdrant/qdrant
```

Run the service:

```bash
docker run -p 6333:6333 \
    -v $(pwd)/qdrant_storage:/qdrant/storage \
    qdrant/qdrant
```

In this case Qdrant will use default configuration and store all data under `./qdrant_storage` directory.

Now Qdrant should be accessible at [localhost:6333](http://localhost:6333)

<aside role="status">Qdrant has no encryption or authentication by default and new instances are open to everyone. Please read <a href="https://qdrant.tech/documentation/security/">Security</a> carefully for details on how to secure your instance.</aside>


