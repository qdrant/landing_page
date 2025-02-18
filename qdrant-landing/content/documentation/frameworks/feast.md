---
title: Feast
---

## Feast

[Feast (**Fe**ature **St**ore)](https://docs.feast.dev) is an open-source feature store that helps teams operate production ML systems at scale by allowing them to define, manage, validate, and serve features for production AI/ML.

Qdrant is available as a supported vectorstore in Feast to integrate in your workflows.

## Insatallation

To use the Qdrant online store, you need to install Feast with the `qdrant` extra.

```bash
pip install 'feast[qdrant]'
```

## Usage

An example config with Qdrant could look like:

```yaml
project: my_feature_repo
registry: data/registry.db
provider: local
online_store:
    type: qdrant
    host: xyz-example.eu-central.aws.cloud.qdrant.io
    port: 6333
    api_key: <your-own-key>
    vector_len: 384
    # Reference: https://qdrant.tech/documentation/concepts/vectors/#named-vectors
    # vector_name: text-vec
    write_batch_size: 100
```

You can refer to the Feast [documentation](https://docs.feast.dev/reference/alpha-vector-database#configuration-and-installation) for the full list of configuration options.

## Retrieving Documents

The Qdrant online store supports retrieving document vectors for a given list of entity keys. The document vectors are returned as a dictionary where the key is the entity key and the value being the vector.

```python
from feast import FeatureStore

feature_store = FeatureStore(repo_path="feature_store.yaml")

query_vector = [1.0, 2.0, 3.0, 4.0, 5.0]
top_k = 5

feature_values = feature_store.retrieve_online_documents(
    feature="my_feature",
    query=query_vector,
    top_k=top_k
)
```

## 📚 Further Reading

- [Feast Documentation](http://docs.feast.dev/)
- [Source](https://github.com/feast-dev/feast/tree/master/sdk/python/feast/infra/online_stores/)
