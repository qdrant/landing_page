---
title: Agno
---

# Agno

[Agno](https://github.com/agno-agi/agno) is an incredibly fast multi-agent framework, runtime and UI. It enables you to build multi-agent systems with memory, knowledge, human-in-the-loop capabilities, and Model Context Protocol (MCP) support.

You can orchestrate agents as multi-agent teams (providing more autonomy) or step-based agentic workflows (offering more control). Agno works seamlessly with Qdrant as a vector database for knowledge bases, enabling efficient storage and retrieval of information for your AI agents.

Agno supports both synchronous and asynchronous operations, making it flexible for various use cases and deployment scenarios.

## Usage

- Install the required dependencies

```bash
pip install agno qdrant-client
```

- Set up environment variables for Qdrant connection

```bash
export QDRANT_API_KEY="<your-qdrant-api-key>"
export QDRANT_URL="<your-qdrant-url>"
```

- Create an agent with Qdrant knowledge base

```python
import os
from agno.agent import Agent
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.qdrant import Qdrant

# Configure Qdrant vector database
api_key = os.getenv("QDRANT_API_KEY")
qdrant_url = os.getenv("QDRANT_URL")
COLLECTION_NAME = "my-knowledge-base"

vector_db = Qdrant(
    collection=COLLECTION_NAME,
    url=qdrant_url,
    # or you can just url="http://localhost:6333"
    api_key=api_key, # (optional)
)

# Create a knowledge base with Qdrant
knowledge_base = Knowledge(
    vector_db=vector_db,
)

# Add content to the knowledge base
knowledge_base.add_content(
    url="https://example.com/document.pdf"
)

# Create an agent with the knowledge base
agent = Agent(
    knowledge=knowledge_base,
    debug_mode=True,
)

# Use the agent
response = agent.print_response("What information do you have?")
```

## Further Reading

- [Agno Documentation](https://docs.agno.com/introduction)
- [Qdrant integration with Agno](https://docs.agno.com/integrations/vectordb/qdrant/overview)
- [Qdrant Asynchronous](https://docs.agno.com/integrations/vectordb/qdrant/usage/async-qdrant-db)
- [Agno GitHub Repository](https://github.com/agno-agi/agno)