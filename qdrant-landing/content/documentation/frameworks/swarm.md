---
title: OpenAI Swarm
---

# Swarm

[OpenAI Swarm](https://github.com/openai/swarm) is a Python framework for managing multiple AI agents that can work together. Instead of relying on a single LLM instance to perform all tasks, Swarm allows you to build specialized agents that communicate and collaborate, like a team of experts with unique skills.

## Getting Started

To start using Swarm, follow these steps:

- Install Swarm

```bash
pip install git+https://github.com/openai/swarm.git
```

- Set up your OpenAI API key

```bash
export OPENAI_API_KEY="<YOUR_KEY>"
```

## How Swarm Works

In Swarm, agents represent individual team members with specific roles and instructions. Each agent can execute tasks or hand off the conversation to another agent, depending on the situation.

An `Agent` instance simply encapsulates a set of instructions with a set of functions, and has the capability to hand off execution to another Agent.

These simple building blocks allow you to create complex workflows with a simple mental model.

## Creating Your First Agents

Here’s a basic example of two agents:

- **Agent A**: A helpful assistant.
- **Agent B**: An arithmetric specialist.

Agent A transfers the conversation to Agent B when requested.

```python
from swarm import Swarm, Agent

client = Swarm()

# Define Agent B
agent_b = Agent(
    name="Agent B",
    instructions="Arithmetic solving expertise holder.",
)

def transfer_to_agent_b():
    return agent_b

# Define Agent A
agent_a = Agent(
    name="Agent A",
    instructions="You are a helpful agent.",
    functions=[transfer_to_agent_b],
)

# Run the interaction
response = client.run(
    agent=agent_a,
    messages=[{"role": "user", "content": "I want some help with numbers."}],
)
print(response)
```

In this example, Agent A passes the conversation to Agent B when deemed necessary.

## Features of an agent

### 1. **Instructions**

Agent instructions define their behavior. These are translated into system prompts for conversations. Only the active agent's instructions are used during an interaction.

### 2. **Functions**

Agents can execute Python functions, enabling them to perform tasks like processing data or querying databases. Swarm automatically converts functions into a JSON Schema that is passed into Chat Completions tools.

Example:

```python
def greet(context_variables, language):
    user_name = context_variables["user_name"]
    greeting = "Hola" if language.lower() == "spanish" else "Hello"
    print(f"{greeting}, {user_name}!")
    return "Done"

agent = Agent(
    name="Greeter Agent",
    functions=[greet],
)

client.run(
    agent=agent,
    messages=[{"role": "user", "content": "Greet me in Spanish."}],
    context_variables={"user_name": "John"},
)
```

Errors are handled gracefully by appending an error response to the conversation.

### 3. **Handoffs**

If a function returns another agent, the system transfers control to that agent.

## Integrating Swarm with Qdrant

You can connect you Swarm agents to retrieve or ingest data into a Qdrant collection. Thereby building you knowledge base. Here’s how to enable an agent to retrieve information from Qdrant.

Assume you have a Qdrant [collection created](https://qdrant.tech/documentation/concepts/collections/#create-a-collection) using the `"text-embedding-3-small"` model. The payload structure includes a `text` field for knowledge storage.

```python
import qdrant_client
from openai import OpenAI

# Initialize clients
openai_client = OpenAI()
qdrant = qdrant_client.QdrantClient(host="localhost")

# Configuration
EMBEDDING_MODEL = "text-embedding-3-small"
COLLECTION_NAME = "help_center"
LIMIT = 5
SCORE_THRESHOLD = 0.7

# Function to query Qdrant
def query_qdrant(query):
    """Retrieve semantically relevant content from Qdrant."""
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
        return {"response": "\n".join([point.payload["text"] for point in results])}
    else:
        return {"response": "No results found."}

# Define agents
qdrant_agent = Agent(
    name="Qdrant Agent",
    instructions="Retrieve relevant info from a knowledge base stored in Qdrant.",
    functions=[query_qdrant],
)

def transfer_to_qdrant():
    return qdrant_agent

main_agent = Agent(
    name="Main Agent",
    instructions="Handle user queries and delegate searches to Qdrant.",
    functions=[transfer_to_qdrant],
)
```

Our `qdrant_agent` can now query a Qdrant collection whenever deemed necessary to answer a user query.

## Further Reading

You can find more usage examples in the [Swarm repo](https://github.com/openai/swarm/blob/main/examples/) that further describe its capabilities.
