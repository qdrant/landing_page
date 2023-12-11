---
title: Autogen
weight: 1200
---

# Microsoft Autogen

[AutoGen](https://github.com/microsoft/autogen) is a framework that enables the development of LLM applications using multiple agents that can converse with each other to solve tasks. AutoGen agents are customizable, conversable, and seamlessly allow human participation. They can operate in various modes that employ combinations of LLMs, human inputs, and tools.

- Multi-agent conversations: AutoGen agents can communicate with each other to solve tasks. This allows for more complex and sophisticated applications than would be possible with a single LLM.
- Customization: AutoGen agents can be customized to meet the specific needs of an application. This includes the ability to choose the LLMs to use, the types of human input to allow, and the tools to employ.
- Human participation: AutoGen seamlessly allows human participation. This means that humans can provide input and feedback to the agents as needed.

With the Autogen-Qdrant integration, you can use the `QdrantRetrieveUserProxyAgent` from autogen to build retrieval augmented generation(RAG) services with ease.

## Installation

```bash
pip install "pyautogen[retrievechat]" "qdrant_client[fastembed]"
```

## Usage

A demo application that generates code based on context w/o human feedback

#### Set your API Endpoint

The config_list_from_json function loads a list of configurations from an environment variable or a JSON file.

```python
from autogen import config_list_from_json
from autogen.agentchat.contrib.retrieve_assistant_agent import RetrieveAssistantAgent
from autogen.agentchat.contrib.qdrant_retrieve_user_proxy_agent import QdrantRetrieveUserProxyAgent
from qdrant_client import QdrantClient

config_list = config_list_from_json(
    env_or_file="OAI_CONFIG_LIST",
    file_location="."
)
```

It first looks for the environment variable "OAI_CONFIG_LIST" which needs to be a valid JSON string. If that variable is not found, it then looks for a JSON file named "OAI_CONFIG_LIST". The file structure sample can be found [here](https://github.com/microsoft/autogen/blob/main/OAI_CONFIG_LIST_sample).

#### Construct agents for RetrieveChat

We start by initializing the RetrieveAssistantAgent and QdrantRetrieveUserProxyAgent. The system message needs to be set to "You are a helpful assistant." for RetrieveAssistantAgent. The detailed instructions are given in the user message.

```python
# Print the generation steps
autogen.ChatCompletion.start_logging()

# 1. create a RetrieveAssistantAgent instance named "assistant"
assistant = RetrieveAssistantAgent(
    name="assistant",
    system_message="You are a helpful assistant.",
    llm_config={
        "request_timeout": 600,
        "seed": 42,
        "config_list": config_list,
    },
)

# 2. create a QdrantRetrieveUserProxyAgent instance named "qdrantagent"
# By default, the human_input_mode is "ALWAYS", i.e. the agent will ask for human input at every step.
# `docs_path` is the path to the docs directory.
# `task` indicates the kind of task we're working on.
# `chunk_token_size` is the chunk token size for the retrieve chat.
# We use an in-memory QdrantClient instance here. Not recommended for production.

ragproxyagent = QdrantRetrieveUserProxyAgent(
    name="qdrantagent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    retrieve_config={
        "task": "code",
        "docs_path": "./path/to/docs",
        "chunk_token_size": 2000,
        "model": config_list[0]["model"],
        "client": QdrantClient(":memory:"),
        "embedding_model": "BAAI/bge-small-en-v1.5",
    },
)
```

#### Run the retriever service

```python
# Always reset the assistant before starting a new conversation.
assistant.reset()

# We use the ragproxyagent to generate a prompt to be sent to the assistant as the initial message.
# The assistant receives the message and generates a response. The response will be sent back to the ragproxyagent for processing.
# The conversation continues until the termination condition is met, in RetrieveChat, the termination condition when no human-in-loop is no code block detected.

# The query used below is for demonstration. It should usually be related to the docs made available to the agent
code_problem = "How can I use FLAML to perform a classification task?"
ragproxyagent.initiate_chat(assistant, problem=code_problem)
```

## Next steps

Check out more Autogen [examples](https://microsoft.github.io/autogen/docs/Examples/AgentChat). You can find detailed documentation about AutoGen [here](https://microsoft.github.io/autogen/).
