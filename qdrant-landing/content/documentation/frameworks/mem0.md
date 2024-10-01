---
title: Mem0
---

# Mem0

[Mem0](https://mem0.ai) enhances AI assistants with an intelligent memory layer for personalized interactions. It remembers user preferences, adapts to needs, and improves over time, ideal for chatbots and AI systems.

Key Features:
- Multi-Level Memory: User, Session, and AI Agent retention across interactions
- Adaptive Personalization: Continuously updates based on user feedback
- Developer-Friendly API: Easy integration into various applications
- Cross-Platform Consistency: Ensures uniform behavior across devices
- Managed Service: Hosted solution for simplified deployment
- Cost-Efficient: Adds relevant memories instead of full transcripts to context

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

When configuring Mem0 to use `Qdrant` as the vector store, you can specify various parameters in the `config` dictionary. Here are the available options:

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `collection_name` | The name of the collection to store the vectors | `mem0` |
| `embedding_model_dims` | Dimensions of the embedding model | `1536` |
| `client` | Custom client for Qdrant | `None` |
| `host` | The host where the Qdrant server is running | `None` |
| `port` | The port where the Qdrant server is running | `None` |
| `path` | Path for the Qdrant database | `/tmp/qdrant` |
| `url` | Full URL for the Qdrant server | `None` |
| `api_key` | API key for the Qdrant server | `None` |
| `on_disk` | For enabling persistent storage | `False` |

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
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

For more detailed information on Mem0's features and advanced usage, please refer to the full [documentation](https://docs.mem0.ai/).