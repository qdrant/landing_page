---
title: OpenAI Agents
aliases: [ /documentation/frameworks/swarm/ ]
---

# OpenAI Agents

[OpenAI Agents](https://github.com/openai/openai-agents-python) is a Python framework to build agentic AI apps in a lightweight, easy-to-use package with very few abstractions. It's a production-ready upgrade of the experimental framework, [Swarm](https://github.com/openai/swarm).

## Getting Started

To start using OpenAI Agents, follow these steps:

- Install the package

```bash
pip install openai-agents
```

- Set up your OpenAI API key

```bash
export OPENAI_API_KEY="<YOUR_KEY>"
```

## How It Works

The Agents SDK has a very small set of primitives:

- `Agents`, which are LLMs equipped with instructions and tools
- `Handoffs`, which allow agents to delegate to other agents for specific tasks
- `Guardrails`, which enable the inputs to agents to be validated

Used with Python, these building blocks make it easy to create real-world apps with tool-agent interactions and minimal learning curve. Plus, the SDK also includes tracing to help you debug, evaluate, and fine-tune your agent workflows.

## Creating Your First Agents

Here’s a basic example of three agents:

- Triage Agent: Acts as the initial point of contact. It analyzes the user's question and decides whether to route it to a specialized agent.
- Math Tutor: A specialist agent designed to help with math-related questions.
- History Tutor: A specialist agent focused on historical topics.

```python
from agents import Agent, Runner


math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)

triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent],
)

# Run the interaction
result = Runner.run_sync(triage_agent, "I want some help with WW1.")
print(result.final_output)
```

## Integrating with Qdrant

You can connect agents to retrieve or ingest data into a Qdrant collection. Thereby building your knowledge base. Here’s how to enable an agent to retrieve information from Qdrant.

Assume you have a Qdrant [collection created](https://qdrant.tech/documentation/concepts/collections/#create-a-collection) using the `"text-embedding-3-small"` model. The payload structure includes a `text` field for knowledge storage.

```python
import qdrant_client
from openai import OpenAI
from agents import Agent, function_tool

# Initialize clients
openai_client = OpenAI()
qdrant = qdrant_client.QdrantClient(host="localhost")

# Configuration
EMBEDDING_MODEL = "text-embedding-3-small"
COLLECTION_NAME = "help_center"
LIMIT = 5
SCORE_THRESHOLD = 0.7

@function_tool
def query_qdrant(query: str) -> str:
    """Retrieve semantically relevant content from Qdrant.

    Args:
        query: The query to search.
    """
    embedded_query = openai_client.embeddings.create(
        input=query,
        model=EMBEDDING_MODEL,
    ).data[0].embedding

    results = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=embedded_query,
        limit=LIMIT,
        score_threshold=SCORE_THRESHOLD,
    ).points

    if results:
        return "\n".join([point.payload["text"] for point in results])
    else:
        return "No results found."

qdrant_agent = Agent(
    name="Qdrant searcher",
    handoff_description="Specialist agent for retrieving info from a Qdrant collection",
    instructions="You help find answers for user queries using Qdrant. Do not make up any info on your own.",
    tools=[query_qdrant],  
)
```

Our `qdrant_agent` can now query a Qdrant collection whenever deemed necessary to answer a user query.

## Further Reading

- [Agents Documentation](https://openai.github.io/openai-agents-python/)
- [Agents Examples](https://github.com/openai/openai-agents-python/tree/main/examples)
