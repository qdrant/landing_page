---
title: Autogen
aliases: [ ../integrations/autogen/ ]
---

# Microsoft Autogen

[AutoGen](https://github.com/microsoft/autogen/tree/0.2)  is an open-source programming framework for building AI agents and facilitating cooperation among multiple agents to solve tasks.

- Multi-agent conversations: AutoGen agents can communicate with each other to solve tasks. This allows for more complex and sophisticated applications than would be possible with a single LLM.

- Customization: AutoGen agents can be customized to meet the specific needs of an application. This includes the ability to choose the LLMs to use, the types of human input to allow, and the tools to employ.

- Human participation: AutoGen allows human participation. This means that humans can provide input and feedback to the agents as needed.

With the [Autogen-Qdrant integration](https://microsoft.github.io/autogen/0.2/docs/reference/agentchat/contrib/vectordb/qdrant/), you build Autogen workflows backed by Qdrant't performant retrievals.

## Installation

```bash
pip install "autogen-agentchat[retrievechat-qdrant]"
```

## Usage

#### Configuration

```python
import autogen

config_list = autogen.config_list_from_json("OAI_CONFIG_LIST")
```

The `config_list_from_json` function first looks for the environment variable `OAI_CONFIG_LIST` which needs to be a valid JSON string. If not found, it then looks for a JSON file named `OAI_CONFIG_LIST`. A sample file can be found [here](https://github.com/microsoft/autogen/blob/0.2/OAI_CONFIG_LIST_sample).

#### Construct agents for RetrieveChat

We start by initializing the RetrieveAssistantAgent and QdrantRetrieveUserProxyAgent. The system message needs to be set to "You are a helpful assistant." for RetrieveAssistantAgent. The detailed instructions are given in the user message.

```python
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

from autogen import AssistantAgent
from autogen.agentchat.contrib.retrieve_user_proxy_agent import RetrieveUserProxyAgent

# 1. Create an AssistantAgent instance named "assistant"
assistant = AssistantAgent(
    name="assistant",
    system_message="You are a helpful assistant.",
    llm_config={
        "timeout": 600,
        "cache_seed": 42,
        "config_list": config_list,
    },
)

sentence_transformer_ef = SentenceTransformer("all-distilroberta-v1").encode
client = QdrantClient(url="http://localhost:6333/")

# 2. Create the RetrieveUserProxyAgent instance named "ragproxyagent"
# Refer to https://microsoft.github.io/autogen/docs/reference/agentchat/contrib/retrieve_user_proxy_agent
# for more information on the RetrieveUserProxyAgent
ragproxyagent = RetrieveUserProxyAgent(
    name="ragproxyagent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    retrieve_config={
        "task": "code",
        "docs_path": [
            "path/to/some/doc.md",
            "path/to/some/other/doc.md",
        ],
        "chunk_token_size": 2000,
        "model": config_list[0]["model"],
        "vector_db": "qdrant",
        "db_config": {"client": client},
        "get_or_create": True,
        "overwrite": True,
        "embedding_function": sentence_transformer_ef,  # Defaults to "BAAI/bge-small-en-v1.5" via FastEmbed
    },
    code_execution_config=False,
)
```

#### Run the agent

```python
# Always reset the assistant before starting a new conversation.
assistant.reset()

# We use the ragproxyagent to generate a prompt to be sent to the assistant as the initial message.
# The assistant receives it and generates a response. The response will be sent back to the ragproxyagent for processing.
# The conversation continues until the termination condition is met.

qa_problem = "What is the .....?"
chat_results = ragproxyagent.initiate_chat(assistant, message=ragproxyagent.message_generator, problem=qa_problem)
```

## Next steps

- AutoGen [documentation](https://microsoft.github.io/autogen/0.2)
- Autogen [examples](https://microsoft.github.io/autogen/0.2/docs/Examples)
- [Source Code](https://github.com/microsoft/autogen/blob/0.2/autogen/agentchat/contrib/vectordb/qdrant.py)
