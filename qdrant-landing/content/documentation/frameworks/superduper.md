---
title: Superduper
---

# Superduper

[Superduper](https://superduper.io/) is a framework for building flexible, compositional AI applications which may be applied directly to databases using a declarative programming model. These applications declare and maintain a desired state of the database, and use the database directly to store outputs of AI components, meta-data about the components and data pertaining to the state of the system.

Qdrant is available as a vector search provider in Superduper.

## Installation

```bash
pip install superduper-framework
```

## Setup

- To use Qdrant for vector search layer, create a `settings.yaml` file with the following config.

> settings.yaml
```yaml
cluster:
  vector_search:
    type: qdrant

vector_search_kwargs:
  url: "http://localhost:6333"
  api_key: "<YOUR_API_KEY>
  # Supports all parameters of qdrant_client.QdrantClient
```

- Set the `SUPERDUPER_CONFIG` env value to the path of the config file.

```bash
export SUPERDUPER_CONFIG=path/to/settings.yaml
```

That's all. You can now use Superduper backed by Qdrant.

## Example

Here's an example to run vector search using the configured Qdrant index.

```python
import json
import requests 
from superduper import superduper, Document
from superduper.ext.sentence_transformers import SentenceTransformer

r = requests.get('https://superduperdb-public-demo.s3.amazonaws.com/text.json')

with open('text.json', 'wb') as f:
    f.write(r.content)

with open('text.json', 'r') as f:
    data = json.load(f)        

db = superduper('mongomock://test')

_ = db['documents'].insert_many([Document({'txt': txt}) for txt in data]).execute()

model = SentenceTransformer(
    identifier="test",
    predict_kwargs={"show_progress_bar": True},
    model="all-MiniLM-L6-v2",
    device="cpu",
    postprocess=lambda x: x.tolist(),
)

vector_index = model.to_vector_index(select=db['documents'].find(), key='txt')

db.apply(vector_index)

query = db['documents'].like({'txt': 'Tell me about vector-search'}, vector_index=vector_index.identifier, n=3).find()
cursor = query.execute()

for r in cursor:
    print('=' * 100)
    print(r.unpack()['txt'])
    print('=' * 100)
```

## 📚 Further Reading

- Superduper [Intro](https://docs.superduper.io/docs/intro)
- Superduper [Source](https://github.com/superduper-io/superduper)
