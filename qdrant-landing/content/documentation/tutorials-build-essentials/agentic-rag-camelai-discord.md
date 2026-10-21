---
title: Discord RAG Bot
short_description: "Build a Discord bot that answers questions from Qdrant documentation using vector search and CAMEL-AI."
description: "Build a Discord RAG bot with Qdrant, CAMEL-AI, and OpenAI. Retrieve documentation chunks and use them to answer questions."
weight: 20
social_preview_image: /documentation/examples/agentic-rag-camelai-discord/social-preview.png
aliases:
  - /documentation/agentic-rag-camelai-discord/
goal: RAG & Agents
stack:
  - Python
  - Qdrant
  - CAMEL-AI
  - OpenAI
  - discord.py
example_resources:
  - label: Open in Colab
    url: https://colab.research.google.com/github/qdrant/examples/blob/update-discord-bot/disord-bot/discord_rag_bot.ipynb
  - label: Notebook Source
    url: https://github.com/qdrant/examples/blob/update-discord-bot/disord-bot/discord_rag_bot.ipynb
---

# Discord RAG Bot

| Time: 45 min | Level: Intermediate | Stack: Python, Qdrant, CAMEL-AI, OpenAI, discord.py | Output: [GitHub](https://github.com/qdrant/examples/blob/update-discord-bot/disord-bot/discord_rag_bot.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/update-discord-bot/disord-bot/discord_rag_bot.ipynb) |
| --- | ----------- | ----------- | ----------- | ----------- |

Build a Discord bot that answers questions from Qdrant documentation using retrieval-augmented generation (RAG). Qdrant is the vector search engine that stores document chunks and their embeddings. [CAMEL-AI](https://www.camel-ai.org/) connects retrieval to an [OpenAI](https://openai.com/) model that drafts the answer.

The application controls the sequence. Each `!ask` question triggers one retrieval, followed by one generation call when usable context is found. The model receives the original question and retrieved text. It has no retrieval tools and does not decide whether to search again.

By the end, you can ask `!ask What is quantization in Qdrant?`, inspect the source chunks, and check whether the answer is supported by them.

![Discord bot answers a scalar-quantization question and links to Qdrant documentation](/documentation/tutorials/agentic-rag-camelai-discord/ragbot.png)

## Prerequisites

You need Python 3.12, familiarity with Python functions and `async`/`await`, and:

- An [OpenAI API key](https://platform.openai.com/api-keys) with access to `text-embedding-3-large` and `gpt-4o-mini`. Ingestion and questions make billable API calls.
- A [Qdrant Cloud cluster](https://cloud.qdrant.io/) with its HTTPS endpoint and a key that can create and read the tutorial collection.
- A Discord test server where you can install a bot, plus access to the [Discord Developer Portal](https://discord.com/developers/applications).

Use a dedicated collection for this tutorial. Run the bot as a persistent process when you want it to stay online.

## Run in Colab or Locally

The [Colab notebook](https://colab.research.google.com/github/qdrant/examples/blob/update-discord-bot/disord-bot/discord_rag_bot.ipynb) contains the same application code and dependency pins as this tutorial. Use a fresh Python 3 CPU runtime; a GPU is not needed. Enter your Qdrant endpoint and credentials at the notebook's hidden prompts, ingest the six documentation pages, and inspect the retrieved sources before generating an answer. The [notebook source](https://github.com/qdrant/examples/blob/update-discord-bot/disord-bot/discord_rag_bot.ipynb) is maintained in `qdrant/examples`.

The notebook has separate cells to start and stop the Discord client using Colab's existing event loop. Configure the Discord application and permissions before starting it. Send the test messages yourself in your test server. Colab runs the bot only while its runtime remains connected; use the local script for a persistent process.

For local execution, follow Steps 1 through 7.

## Understand the RAG Flow

Select **Index documents** or **Answer a question** to trace the two paths. Hover over a step, focus it with the keyboard, or select it to keep its explanation visible.

{{< island path="content/documentation/headless/discord-rag/flow" width="670" ratio="670 / 690" title="CAMEL runs the fixed application flow. OpenAI embeds and generates; Qdrant stores and retrieves the supporting text." >}}
![The application embeds a Discord question, searches Qdrant, and sends matching text with the original question to a fresh ChatAgent. Generation is skipped without usable context.](/documentation/tutorials/agentic-rag-camelai-discord/answer-flow.svg)
{{< /island >}}

There are two separate paths:

| Path | What Runs | What Qdrant Stores or Returns |
| --- | --- | --- |
| Ingestion, before starting the bot | `VectorRetriever.process()` reads each URL, splits its text into chunks, and embeds those chunks with OpenAI. | Qdrant stores vectors with the chunk text, source URL, and metadata in the payload. |
| Answering, for each `!ask` message | `VectorRetriever.query()` embeds the question and searches Qdrant. The application passes matching text and the original question to `ChatAgent.step()`. | Qdrant returns matching records and similarity scores. The language model receives their text, not their vectors. |

## Step 1: Install the Dependencies

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and create a local environment:

```bash
uv venv --python 3.12
source .venv/bin/activate
```

On Windows PowerShell, activate the environment with `.venv\Scripts\Activate.ps1`.

Create `requirements.txt` in your working directory with these dependency pins:

```text
camel-ai==0.2.90
mcp==1.30.0
openai==3.35.1
qdrant-client==1.19.1
discord.py==2.7.1
python-dotenv==1.2.4
unstructured==0.16.20
beautifulsoup4==4.15.0
lxml==6.1.3
```

Install the saved requirements:

```bash
uv pip install -r requirements.txt
```

These pins use [CAMEL-AI 0.2.90](https://pypi.org/project/camel-ai/0.2.90/). They install the dependencies needed for this example instead of CAMEL's full optional dependency set. The MCP 1.x pin preserves compatibility with this CAMEL release.

Create `discord_rag_bot.py` in the same directory. Append each Python block in Steps 2 through 6 to that file in order. Step 7 contains commands and a separate retrieval check to run after saving the script.

## Step 2: Configure the Connections

Create a `.env` file beside your script:

```ini
OPENAI_API_KEY=your-openai-api-key
QDRANT_CLOUD_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_CLOUD_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION=qdrant-discord-docs-v1
DISCORD_BOT_TOKEN=your-discord-bot-token
```

Replace the placeholders with your credentials and the exact endpoint from your cluster. Add `.env` to `.gitignore` to keep credentials out of version control.

Start the script with the imports and settings:

{{< code-snippet path="/documentation/headless/snippets/discord-rag-bot/" block="imports" >}}

Create the embedding model, storage adapter, and retriever:

{{< code-snippet path="/documentation/headless/snippets/discord-rag-bot/" block="retriever" >}}

`QdrantStorage` is imported explicitly, and the connection values come from the environment. `get_output_dim()` sets the collection's vector size to match the embedding model. Use the same model for documents and questions; if you change it, choose a new collection and ingest the documents again.

## Step 3: Ingest the Documentation

All source entries must be absolute URLs. Relative paths such as `/documentation/search/filtering` do not identify a web page on their own.

{{< code-snippet path="/documentation/headless/snippets/discord-rag-bot/" block="ingestion" >}}

The full source URL is stored in `extra_info` because CAMEL truncates its `content path` field to 100 characters. The answer function uses this full URL for source checks and citations.

This function is called separately from the bot. It refuses to append to a nonempty collection, which avoids accidentally adding duplicate chunks when you rerun ingestion. If ingestion is interrupted after writing some chunks, choose a new collection name and rerun it. Starting the bot again reuses the stored data.

## Step 4: Answer From the Retrieved Text

The retrieval result contains chunk text and its source path. Build the prompt explicitly so the model sees both the original question and the evidence:

{{< code-snippet path="/documentation/headless/snippets/discord-rag-bot/" block="answers" >}}

`top_k` limits the number of candidate chunks. `similarity_threshold` filters those candidates by their similarity score; it is not an answer-confidence percentage. Treat this value as a starting point and inspect the retrieved text for your own questions before changing it.

If no usable chunks are returned, the function returns an insufficient-context message without calling the chat model. A fresh agent handles each question, so questions from different users do not share conversation history. The prompt asks the model to use only the supplied evidence, but you still need to check generated claims against the sources.

## Step 5: Configure Discord

In the [Discord Developer Portal](https://discord.com/developers/applications), create an application and obtain its bot token from the **Bot** settings. Save that token as `DISCORD_BOT_TOKEN`.

Enable **Message Content Intent** in the portal. The message handler enables it too, so the bot can read a command such as `!ask What is quantization in Qdrant?`. Member and presence events are not needed for this example. See the [discord.py intent documentation](https://discordpy.readthedocs.io/en/stable/intents.html) for the distinction.

Generate a server installation link using the `bot` scope. Grant **View Channels** and **Send Messages** in your test channel, then install the bot in your test server. Test in a regular text channel rather than a thread.

## Step 6: Connect the Message Handler

{{< code-snippet path="/documentation/headless/snippets/discord-rag-bot/" block="discord-handler" >}}

Only messages beginning with `!ask ` trigger question answering. A bare `!ask` returns a usage hint. `asyncio.to_thread()` runs synchronous retrieval and model calls away from Discord's event loop, keeping the connection responsive while the response is generated. The lock processes one question at a time, which keeps this demo simple for a test server. The handler splits long answers to fit Discord's message limit and prevents generated text from triggering mentions.

Add the command-line entry point:

{{< code-snippet path="/documentation/headless/snippets/discord-rag-bot/" block="entry-point" >}}

## Step 7: Run and Check the Bot

Ingest the documentation once:

```bash
python discord_rag_bot.py ingest
```

The command prints the source URL and number of chunks indexed, then the total vector count. Counts depend on the current documentation content. A nonempty collection should refuse a second ingestion.

Then start the bot:

```bash
python discord_rag_bot.py bot
```

Keep this process running while you test the bot. Stop it before starting a second copy.

Send these messages yourself in the test channel:

| Check | Input or Action | Expected Behavior |
| --- | --- | --- |
| Grounded answer | `!ask What is quantization in Qdrant?` | The bot answers using retrieved documentation. Compare the claims with the quantization source. Exact wording can vary. |
| Unsupported question | `!ask What did I have for breakfast today?` | The bot should say it does not have enough information. If it invents an answer, the check fails. |
| Command handling | Send a message without `!ask`, then send an empty `!ask`. | Ordinary messages are ignored; an empty command gets a usage hint. |
| Separate conversations | Ask from two accounts. | Each answer is based on its own question and retrieved context. No prior conversation is carried over. |
| Restart | Stop the process and run the `bot` command again. | It uses the existing collection without ingesting the URLs again. |

To inspect retrieval independently of generation, run this in an interactive Python session in the same environment:

{{< code-snippet path="/documentation/headless/snippets/discord-rag-inspection/" >}}

If the answer is unsupported, inspect these chunks first. Missing evidence may mean the source was never ingested, useful text was split across chunks, or the score threshold excluded it. Increasing `top_k` can provide more context but also adds irrelevant text and model input tokens. A larger language model cannot recover a fact that this prompt never supplied.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| Missing configuration or authentication error | Confirm `.env` is beside the script, the keys belong to the right services, and the Qdrant endpoint is copied in full. |
| Vector-size mismatch | Use a new collection when changing embedding models or output dimensions, then ingest again. |
| Ingestion refuses to run | The target collection already has points. Reuse it with `bot`, or select a new collection for a fresh ingestion. |
| Gateway close code `4014` or `PrivilegedIntentsRequired` | Enable **Message Content Intent** for the Discord application that owns your bot token, save the setting, and restart the bot. |
| HTTP `403`, Discord code `50001` (`Missing Access`) | The bot cannot access the channel. Install it in the correct server, verify the channel ID, and grant **View Channel** and **Send Messages**, including channel permission overrides. |
| Bot is online but ignores commands | Enable Message Content Intent in both the portal and code, check channel permissions, and use `!ask ` followed by a question. |
| Repeated insufficient-context answers | Inspect the retrieved text and scores before adjusting the threshold or adding source pages. |

## Adapt the Bot

The same loop works for product support, community FAQs, or project onboarding. Point the bot at the pages people keep asking about and let the retrieved chunks show where the answer came from.

To answer questions about your own documentation, replace `QDRANT_URLS` with your source URLs, choose a new `QDRANT_COLLECTION`, and run ingestion. Try questions with known answers and inspect the retrieved chunks before changing `top_k` or the similarity threshold. Keep the bot process running while people use it; the Discord application alone does not host your Python code.

