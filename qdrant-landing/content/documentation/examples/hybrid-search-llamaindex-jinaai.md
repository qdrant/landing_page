---
title: Chat With Product PDF Manuals Using Hybrid Search
short_description: "Build a PDF-manual chatbot with Qdrant Hybrid Cloud, LlamaIndex, and Jina embeddings, using hybrid search to answer product-support questions."
description: "Create a RAG chatbot for PDF manuals using Qdrant Hybrid Cloud, LlamaIndex, and Jina embeddings, with hybrid search for precise customer-support answers."
weight: 45
social_preview_image: /blog/hybrid-cloud-llamaindex/hybrid-cloud-llamaindex-tutorial.png
aliases:
  - /documentation/tutorials/hybrid-search-llamaindex-jinaai/
goal: RAG & Agents
stack:
  - Python
  - LlamaIndex
  - Jina
example_resources:
  - label: Open Notebook
    url: https://colab.research.google.com/github/qdrant/examples/blob/Update-example-Chat-With-Product-PDF-Manuals/Chat%20With%20Product%20PDF%20Manuals%20Using%20Hybrid%20Search/HC_DO_LlamaIndex_Jina_v2.ipynb
keywords:
  - PDF
  - documents
  - manuals
  - LlamaIndex
  - Jina
  - RAG
---

# Chat With Product PDF Manuals Using Hybrid Search

| Time: 60 min | Level: Advanced | Stack: Python, LlamaIndex, Jina | Output: [GitHub](https://github.com/qdrant/examples/blob/Update-example-Chat-With-Product-PDF-Manuals/Chat%20With%20Product%20PDF%20Manuals%20Using%20Hybrid%20Search/HC_DO_LlamaIndex_Jina_v2.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/qdrant/examples/blob/Update-example-Chat-With-Product-PDF-Manuals/Chat%20With%20Product%20PDF%20Manuals%20Using%20Hybrid%20Search/HC_DO_LlamaIndex_Jina_v2.ipynb) |
| --- | --- | --- | --- | --- |

Product manuals usually ship as long PDFs full of tables and figures, which makes them hard to search when a customer needs a quick answer.

In this tutorial, you build a retrieval-augmented generation (RAG) chatbot that answers questions about household appliances from their PDF manuals. You set up data ingestion, hybrid retrieval, and response generation for a customer support use case.

## Components

- **Embeddings:** Jina Embeddings, served through the [Jina Embeddings API](https://jina.ai/embeddings/#apiform)
- **Vector search engine:** [Qdrant Hybrid Cloud](/documentation/hybrid-cloud/), deployed in a managed Kubernetes cluster on [DigitalOcean (DOKS)](https://www.digitalocean.com/products/kubernetes)
- **LLM:** [Qwen3-30B-A3B-Instruct-2507](https://openrouter.ai/qwen/qwen3-30b-a3b-instruct-2507), served through OpenRouter
- **Framework:** [LlamaIndex](https://www.llamaindex.ai/) for RAG and [hybrid search support](https://docs.llamaindex.ai/en/stable/examples/vector_stores/qdrant_hybrid/)
- **Parser:** [LlamaParse](https://github.com/run-llama/llama_parse) to parse complex documents with embedded tables and figures

{{< island path="content/documentation/headless/pdf-manual-rag/architecture" ratio="16 / 10" title="LlamaIndex runs in Colab or locally. Qdrant Hybrid Cloud runs in your DigitalOcean Kubernetes cluster; parsing, dense embeddings, and generation use external APIs." >}}
![Index PDFs with LlamaParse, Jina dense vectors, and local FastEmbed sparse vectors. Search Qdrant and pass at most two chunks through LlamaIndex to OpenRouter for an answer.](/documentation/tutorials/hybrid-search-llamaindex-jinaai/architecture.svg)
{{< /island >}}

## How RAG Works

RAG combines search with text generation. A retrieval system finds the documents most likely to be relevant to the user's question. The question and those documents then go to a language model, which writes the answer.

This lets the model answer from a much larger set of documents than it could read at once. Because the model only reads a few relevant sections, it's also less likely to produce unsupported answers.

## Prerequisites

### Deploying Qdrant Hybrid Cloud on DigitalOcean

[DigitalOcean Kubernetes (DOKS)](https://www.digitalocean.com/products/kubernetes) is a managed Kubernetes service. It runs the control plane for you, works with standard Kubernetes tools, and integrates with DigitalOcean Load Balancers and volumes.

1. To set up managed Kubernetes on DigitalOcean, follow the [platform-specific documentation](/documentation/hybrid-cloud/platform-deployment-options/#digital-ocean).
2. Once your Kubernetes cluster is up, [deploy Qdrant Hybrid Cloud](/documentation/hybrid-cloud/).
3. When the deployment finishes, you have a running Qdrant cluster and an API key.

### Development Environment

Use Python 3.12 or a Colab CPU runtime. The notebook connects to the Qdrant endpoint from outside the Kubernetes cluster. You need API keys and available credits for LlamaCloud parsing, Jina embeddings, and OpenRouter inference. The selected OpenRouter model is paid; requests use your OpenRouter credits. You can also use Hugging Face Inference instead by switching to LlamaIndex's `HuggingFaceInferenceAPI` integration with a supported model and your Hugging Face API token.

The versions below are the versions used for the accompanying local checks.
Hosted calls still require your credentials. Restart the kernel if Colab requests it
after installation, then continue with the next cell.

In a notebook, use `%pip install` for the active kernel. In a terminal, run:

```bash
python -m pip install -q llama-index-core==0.14.25 \
    llama-cloud==2.18.0 \
    python-dotenv==1.2.4 \
    llama-index-embeddings-jinaai==0.7.0 \
    llama-index-llms-openrouter==0.6.0 \
    llama-index-vector-stores-qdrant==0.10.4 \
    qdrant-client==1.19.1 \
    fastembed==0.9.0 \
    huggingface-hub==1.33.0 \
    httpx==0.28.1 \
    pypdf==6.20.0
```

## Download the Manuals

This cell downloads the three PDFs from the [original example's data folder](https://github.com/infoslack/qdrant-example/tree/1a45740d328bae4468dae61e47421eae5024a826/HC-demo/data).
The revision and checksums are fixed so reruns use the same inputs. Valid existing
files are reused; a mismatched file stops the run. All paths are relative to the
notebook's working directory, including Colab's temporary `/content` directory.

```python
import hashlib
from pathlib import Path

import httpx
from pypdf import PdfReader

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
DATA_BASE_URL = (
    "https://raw.githubusercontent.com/infoslack/qdrant-example/"
    "1a45740d328bae4468dae61e47421eae5024a826/HC-demo/data"
)
MANUALS = {
    "DJ68-00682F_0.0.pdf": "236016ffaf147ce0dc354ff43c2d3046bd1a26ce5fba6f98efa2221baf99417b",
    "F500E_WF80F5E_03445F_EN.pdf": "8064c40cb66a78cede2991ac95f01821fa7dd6d3d3a1b508a33688a4e70f102a",
    "O_ME4000R_ME19R7041FS_AA_EN.pdf": "f150339066974e8f3508e3dfcdda23b583065bee5be0ff69f5ec2c0d980626b2",
}
pdf_paths = []
page_counts = {}
with httpx.Client(follow_redirects=True, timeout=120) as http:
    for filename, expected_sha256 in MANUALS.items():
        path = DATA_DIR / filename
        if not path.exists():
            response = http.get(f"{DATA_BASE_URL}/{filename}")
            response.raise_for_status()
            content = response.content
            if hashlib.sha256(content).hexdigest() != expected_sha256:
                raise RuntimeError(f"Download checksum mismatch: {filename}")
            path.write_bytes(content)
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected_sha256:
            raise RuntimeError(f"Local checksum mismatch: {path}")
        page_counts[path.name] = len(PdfReader(path).pages)
        pdf_paths.append(path)
        print(f"{path}: {page_counts[path.name]} pages")

print(f"Ready: {len(pdf_paths)} PDFs, {sum(page_counts.values())} pages")
```

## Configure Credentials

For local Jupyter, create a `.env` file next to the notebook. Replace the placeholder
values; never commit that file or include its contents in notebook output.

```dotenv
JINAAI_API_KEY=your-jina-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
LLAMA_CLOUD_API_KEY=your-llama-cloud-api-key
QDRANT_HOST=https://your-qdrant-cluster-url
QDRANT_API_KEY=your-qdrant-database-api-key
```

In **Colab**, open **Secrets** (the key icon), add the same five names and values,
and enable **Notebook access** for each. The next cell reads Colab Secrets or the
local environment without displaying the values. A missing setting stops the run.

```python
import os

from dotenv import load_dotenv

load_dotenv(".env")
required_settings = (
    "JINAAI_API_KEY",
    "OPENROUTER_API_KEY",
    "LLAMA_CLOUD_API_KEY",
    "QDRANT_HOST",
    "QDRANT_API_KEY",
)

try:
    from google.colab import userdata
except ImportError:
    userdata = None

if userdata is not None:
    for name in required_settings:
        if not os.getenv(name):
            try:
                os.environ[name] = userdata.get(name)
            except (userdata.SecretNotFoundError, userdata.NotebookAccessError):
                pass

missing_settings = [name for name in required_settings if not os.getenv(name)]
if missing_settings:
    raise RuntimeError(
        "Set these values in .env or Colab Secrets before continuing: "
        + ", ".join(missing_settings)
    )
print("All five required settings are present.")
```

## Check Embeddings, Inference, and Qdrant

Use `llama_index.llms.openrouter`, provided by the
`llama-index-llms-openrouter` package. The wrapper sends chat-completion
requests to OpenRouter. No `CustomLLM` subclass is needed.

These small live requests check the embedding API, hosted generation, and Qdrant
connection before parsing the manuals. They do not prove that the final answer
will be correct. If inference fails, check your OpenRouter key, available credits,
and the model's current availability before continuing.

```python
from llama_index.embeddings.jinaai import JinaEmbedding
from llama_index.llms.openrouter import OpenRouter
from qdrant_client import QdrantClient

LLM_MODEL = "qwen/qwen3-30b-a3b-instruct-2507"
jina_embedding_model = JinaEmbedding(
    model="jina-embeddings-v2-base-en",
    api_key=os.environ["JINAAI_API_KEY"],
)
llm = OpenRouter(
    model=LLM_MODEL,
    api_key=os.environ["OPENROUTER_API_KEY"],
    is_chat_model=True,
    context_window=8192,
    timeout=120.0,
    max_tokens=512,
    max_retries=2,
    temperature=0.1,
)
client = QdrantClient(
    url=os.environ["QDRANT_HOST"],
    api_key=os.environ["QDRANT_API_KEY"],
    timeout=60,
)
```

```python
probe_embedding = jina_embedding_model.get_text_embedding("A washing machine manual.")
if not probe_embedding:
    raise RuntimeError("Jina returned an empty embedding.")
print(f"Jina embedding dimensions: {len(probe_embedding)}")
probe_response = llm.complete("Reply with the single word Ready.")
if not probe_response.text.strip():
    raise RuntimeError("The inference provider returned an empty response.")
print(f"Hosted inference returned text for {LLM_MODEL}.")
qdrant_version = client.info().version
print(f"Qdrant server version: {qdrant_version}")
```

## Parse the PDFs With LlamaParse

The `llama-cloud` SDK uploads each PDF and waits for the parsing job to finish.
`expand=["markdown"]` includes Markdown pages in the returned result. This example
uses `tier="cost_effective"` and `version="latest"`; the service's latest parser can
change independently of the pinned Python SDK.

Each manual becomes one LlamaIndex `Document`. Validate the returned page count,
failed pages, and nonempty text before appending it. Merely counting three created
`Document` objects would also count empty or partially parsed manuals.

The code does not catch a failed parsing job and continue with incomplete data.
Resolve any error and rerun the parser before indexing.

```python
from llama_cloud import LlamaCloud
from llama_index.core import Document

llama_cloud = LlamaCloud(api_key=os.environ["LLAMA_CLOUD_API_KEY"])
documents = []
parse_summary = []
for path in pdf_paths:
    uploaded = llama_cloud.files.create(file=path, purpose="parse")
    result = llama_cloud.parsing.parse(
        file_id=uploaded.id,
        tier="cost_effective",
        version="latest",
        expand=["markdown"],
    )
    if result.markdown is None or not result.markdown.pages:
        raise RuntimeError(f"No Markdown pages returned for {path}")
    pages = result.markdown.pages
    failed_pages = [page.page_number for page in pages if not page.success]
    if failed_pages:
        raise RuntimeError(f"Failed to parse pages {failed_pages} in {path}")
    if len(pages) != page_counts[path.name]:
        raise RuntimeError(f"Incomplete page count returned for {path}")
    text = "\n\n".join(page.markdown for page in pages)
    if not text.strip():
        raise RuntimeError(f"No readable text returned for {path}")
    documents.append(Document(text=text, metadata={"file_name": path.name}))
    parse_summary.append(
        {"file": path.name, "pages": len(pages), "characters": len(text)}
    )
    print(f"Parsed {path.name}: {len(pages)} pages, {len(text)} characters")

if len(documents) != len(MANUALS):
    raise RuntimeError("The manual set is incomplete.")
print(f"Parsed and validated {len(documents)} manuals")
```

## Store Dense and Sparse Vectors in Qdrant

Jina generates dense embeddings through its API. FastEmbed runs the sparse SPLADE
model locally on the notebook CPU; its first use downloads model weights. Install
`fastembed` even though dense embeddings come from Jina.

Set both LlamaIndex models explicitly so no OpenAI defaults are used. Each execution
of the next cell creates a **new collection**, whose name is printed. Reuse the
existing `index` when trying another question. Rebuilding creates another collection
and repeats embedding calls. Delete only your tutorial collections through the
Qdrant dashboard when you no longer need them.

```python
from uuid import uuid4

from llama_index.core import Settings, StorageContext, VectorStoreIndex
from llama_index.vector_stores.qdrant import QdrantVectorStore

Settings.embed_model = jina_embedding_model
Settings.llm = llm
Settings.chunk_size = 512

collection_name = f"pdf_manuals_hybrid_{uuid4().hex[:8]}"
vector_store = QdrantVectorStore(
    client=client,
    collection_name=collection_name,
    enable_hybrid=True,
    fastembed_sparse_model="prithivida/Splade_PP_en_v1",
    batch_size=20,
)
storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex.from_documents(
    documents=documents,
    storage_context=storage_context,
)
point_count = client.count(collection_name, exact=True).count
if point_count == 0:
    raise RuntimeError("The collection has no indexed chunks.")
print(f"Indexed {point_count} chunks in {collection_name}")
```

## Configure Hybrid Retrieval and the Prompt

- `similarity_top_k=12` requests up to 12 dense candidates.
- `sparse_top_k=12` requests up to 12 sparse candidates.
- `hybrid_top_k=2` requests up to 2 results after fusion; omitting it falls back to `similarity_top_k`.

Candidates can overlap. **A top-k of 2 does not mean 10 returned results.** The query
cell also caps the retrieved nodes at 2 before synthesis, because the integration's
fallback when one search branch is empty can bypass the fusion limit. Inspect the
returned nodes and the actual context count rather than assuming a fixed result count.

The prompt asks the LLM to use the retrieved manual text and say when it cannot
answer. This instruction does not guarantee factual accuracy; inspect the source
excerpts with the generated answer.

```python
from llama_index.core import PromptTemplate, QueryBundle, get_response_synthesizer
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever

qa_prompt = PromptTemplate(
    "Context information is below.\n"
    "-------------------------------\n"
    "{context_str}\n"
    "-------------------------------\n"
    "Given the context information and not prior knowledge, "
    "answer the query. Be concise and complete.\n"
    "If the context does not contain an answer to the query, "
    'respond with "I don\'t know!".\n'
    "Query: {query_str}\n"
    "Answer: "
)
HYBRID_TOP_K = 2
retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=12,
    sparse_top_k=12,
    hybrid_top_k=HYBRID_TOP_K,
    vector_store_query_mode="hybrid",
)
response_synthesizer = get_response_synthesizer(
    llm=llm,
    text_qa_template=qa_prompt,
    response_mode="compact",
)
query_engine = RetrieverQueryEngine(
    retriever=retriever,
    response_synthesizer=response_synthesizer,
)
```

## Retrieve Context and Generate an Answer

Ask specifically about **Eco Drum Clean**, which cleans the washing machine's drum.
It is not a laundry-washing cycle. The old broad question about laundry temperature
could produce an answer about the wrong operation.

The two calls below separate retrieval from generation so you can inspect the exact
nodes sent to the LLM. `synthesize` uses those nodes without retrieving a second time.

```python
query = (
    "According to the washing machine manual, what water temperature does "
    "Eco Drum Clean use, can it be changed, and should laundry be in the drum?"
)
query_bundle = QueryBundle(query)
retrieved_nodes = query_engine.retrieve(query_bundle)
context_nodes = retrieved_nodes[:HYBRID_TOP_K]
if not context_nodes:
    raise RuntimeError("No context was retrieved; check the collection and query.")
print(
    f"Retrieved {len(retrieved_nodes)} nodes; sending {len(context_nodes)} to the LLM."
)
for position, node in enumerate(context_nodes, start=1):
    print(f"\nSource {position}: {node.metadata['file_name']}")
    print(node.node.get_content())
```

```python
result = query_engine.synthesize(query_bundle=query_bundle, nodes=context_nodes)
if not result.response or not result.response.strip():
    raise RuntimeError("The LLM returned an empty answer.")
print(result.response)
```

### Check the Answer Against the Manual

The washer manual's printed page 30, headed **Eco Drum Clean**, says the water
temperature is 70 °C and cannot be changed. It also says never to run this cycle
with laundry in the washing machine. This is a source-based acceptance check,
**not a saved model response**. Only treat those facts as grounded if they are present
in the excerpts retrieved by your run. If they are missing, an abstention is appropriate;
inspect chunking and retrieval before changing the prompt.

Do not publish the old answer as proof of a new run. Keep your actual generated
answer, context excerpts, and package/server versions as the retest evidence.

## Record the Run

The final cell writes a local report only after parsing, indexing, retrieval, and
generation have succeeded. It records counts, versions, inputs, and the actual answer.
It does not include credentials. Review the answer against its excerpts before
submitting the notebook and matching tutorial.

```python
import json
import platform
from datetime import UTC, datetime
from importlib.metadata import version

package_names = [
    "llama-index-core",
    "llama-cloud",
    "llama-index-embeddings-jinaai",
    "llama-index-llms-openrouter",
    "llama-index-vector-stores-qdrant",
    "qdrant-client",
    "fastembed",
    "huggingface-hub",
    "httpx",
    "pypdf",
    "python-dotenv",
]
run_report = {
    "completed_at_utc": datetime.now(UTC).isoformat(),
    "python": platform.python_version(),
    "packages": {name: version(name) for name in package_names},
    "qdrant_server": qdrant_version,
    "llm_model": LLM_MODEL,
    "llm_provider_policy": "OpenRouter default routing",
    "parser": {"tier": "cost_effective", "version": "latest"},
    "manual_sha256": MANUALS,
    "parsed_manuals": parse_summary,
    "collection_name": collection_name,
    "indexed_chunks": point_count,
    "retrieved_nodes": len(retrieved_nodes),
    "context_nodes": len(context_nodes),
    "query": query,
    "answer": result.response,
    "sources": [
        {"file": node.metadata["file_name"], "text": node.node.get_content()}
        for node in context_nodes
    ],
    "answer_requires_manual_review": True,
}
Path("pdf_manuals_run_report.json").write_text(json.dumps(run_report, indent=2))
print("Saved pdf_manuals_run_report.json; check the answer against its sources.")
```
