---
title: SmolAgents
---

# SmolAgents

HuggingFace [SmolAgents](https://github.com/huggingface/smolagents) is a Python library for building AI agents. These agents write Python code to call tools and orchestrate other agents.

It uses `CodeAgent`. An LLM engine that writes its actions in code. SmolAgents suggests that this approach is demonstrated to work better than the current industry practice of letting the LLM output a dictionary of the tools it wants to call: [uses 30% fewer steps](https://huggingface.co/papers/2402.01030) (thus 30% fewer LLM calls)
and [reaches higher performance on difficult benchmarks](https://huggingface.co/papers/2411.01747).

## Usage with Qdrant

We'll demonstrate how you can pair SmolAgents with Qdrant's retrieval by building a movie recommendation agent.

### Installation

```shell
pip install smolagents qdrant-client fastembed
```

### Setup a Qdrant tool

We'll build a SmolAgents tool that can query a Qdrant collection. This tool will vectorise queries locally using [FastEmbed](https://github.com/qdrant/fastembed).

Initially, we'll be populating a Qdrant collection with information about 1000 movies from IMDb that we can search across.

```py
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from smolagents import Tool


class QdrantQueryTool(Tool):
    name = "qdrant_query"
    description = "Uses semantic search to retrieve movies from a Qdrant collection."
    inputs = {
        "query": {
            "type": "string",
            "description": "The query to perform. This should be semantically close to your target documents.",
        }
    }
    output_type = "string"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.collection_name = "smolagents"
        self.client = QdrantClient()

        if not self.client.collection_exists(self.collection_name):
            self.client.recover_snapshot(
                collection_name=self.collection_name,
                location="https://snapshots.qdrant.io/imdb-1000-jina.snapshot",
            )
        self.embedder = TextEmbedding(model_name="jinaai/jina-embeddings-v2-base-en")

    def forward(self, query: str) -> str:
        points = self.client.query_points(
            self.collection_name, query=next(self.embedder.query_embed(query)), limit=5
        ).points
        docs = "Retrieved documents:\n" + "".join(
            [
                f"== Document {str(i)} ==\n"
                + f"MOVIE TITLE: {point.payload['movie_name']}\n"
                + f"MOVIE SUMMARY: {point.payload['description']}\n"
                for i, point in enumerate(points)
            ]
        )

        return docs
```

### Define the agent

We can now set up `CodeAgent` to use our `QdrantQueryTool`.

```python
from smolagents import CodeAgent, HfApiModel
import os

# HuggingFace Access Token
# https://huggingface.co/docs/hub/en/security-tokens
os.environ["HF_TOKEN"] = "----------"

agent = CodeAgent(
    tools=[QdrantQueryTool()], model=HfApiModel(), max_iterations=4, verbose=True
)
```

Finally, we can run the agent with a user query.

```python
agent_output = agent.run("Movie about people taking a strong action for justice")
print(agent_output)
```

We should results similar to:

```console
[...truncated]

Out - Final answer: Jai Bhim
[Step 1: Duration 0.25 seconds| Input tokens: 4,497 | Output tokens: 134]
Jai Bhim
```

## Further Reading

- [SmolAgents Blog](https://huggingface.co/blog/smolagents#code-agents)
- [SmolAgents Source](https://github.com/huggingface/smolagents)
