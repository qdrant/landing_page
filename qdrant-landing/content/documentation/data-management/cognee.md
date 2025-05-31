---
title: cognee
---

# cognee

[cognee](https://www.cognee.ai) is a memory management tool for AI Apps and Agents

Qdrant is available as a native built-in vector database to store and retrieve embeddings.




## 📦 Installation

You can install Cognee using either **pip**, **poetry**, **uv** or any other python package manager.
Cognee supports Python 3.8 to 3.12

### With pip

```bash
pip install cognee
```

## Local Cognee installation

You can install the local Cognee repo using **pip**, **poetry** and **uv**.
For local pip installation please make sure your pip version is above version 21.3.

### with UV with all optional dependencies

```bash
uv sync --all-extras
```

## 💻 Basic Usage

### Setup

```
import os
os.environ["LLM_API_KEY"] = "YOUR OPENAI_API_KEY"

```

You can also set the variables by creating .env file, using our <a href="https://github.com/topoteretes/cognee/blob/main/.env.template">template.</a>
To use different LLM providers, for more info check out our <a href="https://docs.cognee.ai">documentation</a>


### Simple example

This script will run the default pipeline:

```python
import cognee
import asyncio


async def main():
    # Add text to cognee
    await cognee.add("Natural language processing (NLP) is an interdisciplinary subfield of computer science and information retrieval.")

    # Generate the knowledge graph
    await cognee.cognify()

    # Query the knowledge graph
    results = await cognee.search("Tell me about NLP")

    # Display the results
    for result in results:
        print(result)


if __name__ == '__main__':
    asyncio.run(main())

```
Example output:
```
  Natural Language Processing (NLP) is a cross-disciplinary and interdisciplinary field that involves computer science and information retrieval. It focuses on the interaction between computers and human language, enabling machines to understand and process natural language.

```
