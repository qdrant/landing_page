---
title: Working With LlamaIndex
weight: 2
---

# Working With LlamaIndex
The [Qdrant MCP Server](https://github.com/qdrant/mcp-server-qdrant) is a Model Context Protocol server for keeping and retrieving memories in the Qdrant vector search engine. It acts as a semantic memory layer on top of the Qdrant database. LlamaIndex is an opensource framework for building applications powered by Large Language Models. 

## Requirements & Setup
First, install the required libraries:

```bash
pip install datasets llama-index llama-index-vector-stores-qdrant qdrant-client llama-index-tools-mcp
```

## Run Qdrant MCP Server
Launch the MCP server via Docker:
```bash 
docker run \
  -p 8000:8000 \
  -e FASTMCP_HOST="0.0.0.0" \
  -e QDRANT_URL="https://YOUR_QDRANT_URL.cloud.qdrant.io:6333/" \
  -e QDRANT_API_KEY="YOUR_QDRANT_API" \
  -e COLLECTION_NAME="legal_contracts" \
  mcp-server-qdrant
```
## Check the Available Tools
Check the tools exposed by the Qdrant MCP Server:
```python
from llama_index.tools.mcp import aget_tools_from_mcp_url
async def main():
    tools = await aget_tools_from_mcp_url("http://127.0.0.1:8000/sse")
    for t in tools:
        print(f"- {t.metadata.name}: {t.metadata.description}")
        
await main()
```
```markdown
- qdrant-store: Keep the memory for later use, when you are asked to remember something.
- qdrant-find: Look up memories in Qdrant. Use this tool when you need to: 
 - Find memories by their content 
 - Access memories for further analysis 
 - Get some personal information about the user
```
## Load a Sample Dataset
Load a sample dataset:
```python
from datasets import load_dataset
# Load legal contracts dataset (first 100 samples)
ds = load_dataset("albertvillanova/legal_contracts")
subset = ds["train"].select(range(100))
```
## Store the Data in Qdrant
Next, use the Qdrant MCP `qdrant-store` tool to store the data.
```python
from llama_index.core.schema import Document
# Convert into LlamaIndex Documents
documents = [Document(text=item["text"], id_=str(idx)) for idx, item in enumerate(subset)]
# Async function to store documents using the exact MCP tool name
async def main():
    tools = await aget_tools_from_mcp_url("http://127.0.0.1:8000/sse")

    # Use the tool with the exact name "qdrant-store"
    store_tool = next(t for t in tools if t.metadata.name == "qdrant-store")

    # Store each document by calling the tool
    for doc in documents:
        store_tool(
            information=doc.text,
            metadata={"doc_id": doc.id_}
        )

# Run the script
await main()
```
## Configure the LLM
Define the LLM:
```python
from llama_index.core.settings import Settings

# 1️⃣ Set the global LLM 
Settings.llm = OpenAI(model="gpt-4.1", temperature=0)
from llama_index.llms.openai import OpenAI
```
## Sample Agent Workflow
Run a sample workflow: 
```python
import asyncio
from llama_index.core.agent.workflow import FunctionAgent
async def main():
    # Load only the needed tool to avoid bloating function definitions
    tools = await aget_tools_from_mcp_url("http://127.0.0.1:8000/sse")
    find_tool = next(t for t in tools if t.metadata.name == "qdrant-find")

    agent = FunctionAgent(
        tools=[find_tool],
        llm=Settings.llm,
        name="LegalContractAgent",
        description="Help retrieve legal contract clauses from memory"
    )

    query = (
        "Get the termination clause from the contract involving Avocent Employment Services Co. "
        "and R. Byron Driver. Limit results to 2."
    )

    # Run the agent
    response = await agent.run(query)
    print(response)

await main()
```