---
title: SmolAgents
short_description: "Pair Hugging Face SmolAgents with Qdrant retrieval to build code-writing agents that query vector collections through reusable tools."
description: "Build Hugging Face SmolAgents that call Qdrant retrieval tools to query vector collections, combining code-driven agents with semantic search over your data."
---

# SmolAgents

HuggingFace [SmolAgents](https://github.com/huggingface/smolagents) is a Python library for building AI agents. These agents write Python code to call tools and orchestrate other agents.

It uses `CodeAgent`. An LLM engine that writes its actions in code. SmolAgents suggests that this approach is demonstrated to work better than the current industry practice of letting the LLM output a dictionary of the tools it wants to call: [uses 30% fewer steps](https://huggingface.co/papers/2402.01030) (thus 30% fewer LLM calls)
and [reaches higher performance on difficult benchmarks](https://huggingface.co/papers/2411.01747).

## Usage with Qdrant

We'll demonstrate how you can pair SmolAgents with Qdrant's retrieval by building a product search agent.

### Installation

```shell
pip install smolagents qdrant-client fastembed
```

### Setup a Qdrant tool

We'll build a SmolAgents tool that can query a Qdrant collection. This tool will vectorise queries locally using [FastEmbed](https://github.com/qdrant/fastembed).

Initially, we'll be populating a Qdrant collection with about 45,000 products from the [Amazon Berkeley Objects](/documentation/datasets/#amazon-berkeley-objects) dataset that we can search across. Each product is represented by a CLIP embedding of its image, so we'll embed text queries with the matching CLIP text model.

The snapshot requires Qdrant 1.20 or later. Start it locally with `docker run --pull=always -p 6333:6333 qdrant/qdrant`.

```py
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from smolagents import Tool


class QdrantQueryTool(Tool):
    name = "qdrant_query"
    description = "Uses semantic search to retrieve products from a Qdrant collection."
    inputs = {
        "query": {
            "type": "string",
            "description": "The query to perform. This should be semantically close to your target documents.",
        }
    }
    output_type = "string"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.collection_name = "smolagents_products"
        self.client = QdrantClient(timeout=120)

        if not self.client.collection_exists(self.collection_name):
            self.client.recover_snapshot(
                collection_name=self.collection_name,
                location="https://snapshots.qdrant.io/amazon-berkeley-objects.snapshot",
            )
        self.embedder = TextEmbedding(model_name="Qdrant/clip-ViT-B-32-text")

    def forward(self, query: str) -> str:
        points = self.client.query_points(
            self.collection_name, query=next(self.embedder.query_embed(query)), limit=5
        ).points
        docs = "Retrieved documents:\n" + "".join(
            [
                f"== Document {str(i)} ==\n"
                + f"PRODUCT NAME: {point.payload['name']}\n"
                + f"BRAND: {point.payload.get('brand', '')}\n"
                for i, point in enumerate(points)
            ]
        )

        return docs
```

### Define the agent

We can now set up `CodeAgent` to use our `QdrantQueryTool`. `InferenceClientModel` needs a Hugging Face token with the "Make calls to Inference Providers" permission, and Inference Providers credits on your account.

```python
from smolagents import CodeAgent, InferenceClientModel, LogLevel
import os

# HuggingFace Access Token
# https://huggingface.co/docs/hub/en/security-tokens
os.environ["HF_TOKEN"] = "----------"

agent = CodeAgent(
    tools=[QdrantQueryTool()], model=InferenceClientModel(model_id="openai/gpt-oss-120b"), max_steps=4, verbosity_level=LogLevel.DEBUG
)
```

Finally, we can run the agent with a user query.

```python
agent_output = agent.run("I need a comfortable chair for my home office. What do you recommend?")
print(agent_output)
```

The agent can call `qdrant_query` to find products and use the results in its recommendation.

## Further Reading

- [SmolAgents Blog](https://huggingface.co/blog/smolagents#code-agents)
- [SmolAgents Source](https://github.com/huggingface/smolagents)
