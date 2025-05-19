---
title: Microsoft NLWeb
---

# NLWeb

Microsoft's [NLWeb](https://github.com/microsoft/NLWeb) is a proposed framework that enables natural language interfaces for websites, using Schema.org, formats like RSS and the emerging [MCP protocol](https://github.com/microsoft/NLWeb/blob/main/docs/RestAPI.md).

Qdrant is supported as a vector store backend within NLWeb for embedding storage and context retrieval.

## Usage

NLWeb includes Qdrant integration by default. You can install and configure it to use Qdrant as the retrieval engine.

### Installation

Clone the repo and set up your environment:

```bash
git clone https://github.com/microsoft/NLWeb
cd NLWeb
python -m venv .venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
cd code
pip install -r requirements.txt
```

### Configuring Qdrant

To use **Qdrant**, update your configuration.

#### 1. Copy and edit the environment variables file

```bash
cp .env.template .env
```

Ensure the following values are set in your `.env` file:

```text
QDRANT_URL="https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6333"
QDRANT_API_KEY="<your-api-key-here>"
```

#### 2. Update config files in `code/config`

* **`config_retrieval.yaml`**

```yaml
retrieval_engine: qdrant_url
```

Alternatively you can use an in-memory Qdrant instance for experimentation.

```yaml
retrieval_engine: qdrant_local

endpoints:
  qdrant_local:
    # Use local file-based storage with a specific path
    database_path: "../data/db"
    # Set the collection name to use
    index_name: nlweb_collection
    # Specify the database type
    db_type: qdrant
```

### Loading Data

Once configured, load your content using RSS feeds or other supported formats.

From the `code` directory:

```bash
python -m tools.db_load https://feeds.libsyn.com/121695/rss Behind-the-Tech
python -m tools.db_load https://feeds.megaphone.fm/recodedecode Decoder
```

This will ingest the content into your local Qdrant instance.

### Running the Server

To start your NLWeb server with Qdrant:

```bash
python -m server.main
```

You can now query your content via natural language using either the web UI at <http://localhost:8000/> or directly through the MCP-compatible [REST API](https://github.com/microsoft/NLWeb/blob/main/docs/RestAPI.md).

## Further Reading

* [Source](https://github.com/microsoft/NLWeb)
* [Life of a Chat Query](https://github.com/microsoft/NLWeb/tree/main/docs/LifeOfAChatQuery.md)
* [Modifying behaviour by changing prompts](https://github.com/microsoft/NLWeb/tree/main/docs/Prompts.md)
* [Modifying control flow](https://github.com/microsoft/NLWeb/tree/main/docs/ControlFlow.md)
* [Modifying the user interface](https://github.com/microsoft/NLWeb/tree/main/docs/UserInterface.md)
