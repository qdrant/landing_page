---
title: DocArray
aliases: [ ../integrations/docarray/ ]
---

# DocArray

You can use Qdrant natively in DocArray, where Qdrant serves as a high-performance document store to enable scalable vector search.

DocArray is a library from Jina AI for nested, unstructured data in transit, including text, image, audio, video, 3D mesh, etc.
It allows deep-learning engineers to efficiently process, embed, search, recommend, store, and transfer the data with a Pythonic API.

To install DocArray with Qdrant support, please do

```bash
pip install "docarray[qdrant]"
```

## Further Reading

- [DocArray documentations](https://docarray.jina.ai/advanced/document-store/qdrant/).
- [Source Code](https://github.com/docarray/docarray/blob/main/docarray/index/backends/qdrant.py)
