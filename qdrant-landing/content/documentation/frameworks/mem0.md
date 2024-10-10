---
title: Mem0
---

![Mem0 Logo](/documentation/frameworks/mem0/mem0-banner.png)

[Mem0](https://mem0.ai) is a self-improving memory layer for LLM applications, enabling personalized AI experiences that save costs and delight users. Mem0 remembers user preferences, adapts to individual needs, and continuously improves over time, ideal for chatbots and AI systems.

Mem0 supports various vector store providers, including Qdrant, for efficient data handling and search capabilities.

## Installation

To install Mem0 with Qdrant support, use the following command:

```sh
pip install mem0ai
```

## Usage

Here's a basic example of how to use Mem0 with Qdrant:

```python
import os
from mem0 import Memory

os.environ["OPENAI_API_KEY"] = "sk-xx"

config = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "collection_name": "test",
            "host": "localhost",
            "port": 6333,
        }
    }
}

m = Memory.from_config(config)
m.add("Likes to play cricket on weekends", user_id="alice", metadata={"category": "hobbies"})
```

## Configuration

When configuring Mem0 to use Qdrant as the vector store, you can specify [various parameters](https://docs.mem0.ai/components/vectordbs/dbs/qdrant#config) in the `config` dictionary.

## Advanced Usage

Mem0 provides additional functionality for managing and querying your vector data. Here are some examples:

```python
# Search memories
related_memories = m.search(query="What are Alice's hobbies?", user_id="alice")

# Update existing memory
result = m.update(memory_id="m1", data="Likes to play tennis on weekends")

# Get memory history
history = m.history(memory_id="m1")
```

## Further Reading

- [Mem0 GitHub Repository](https://github.com/mem0ai/mem0)
- [Mem0 Documentation](https://docs.mem0.ai/)