---
title: "Installing Dependencies"
description: Install Python dependencies including FastEmbed and Qdrant client.
weight: 2
---

{{< date >}} Module 0 {{< /date >}}

# Installing Dependencies

To work with multi-vector search in Qdrant, you'll need several Python libraries: Qdrant client for search and FastEmbed for multi-vector embeddings.

We'll set up a clean Python environment and install everything you need to start experimenting with multi-vector representations.

## Python Environment Setup

### Using uv (Recommended)

For this course, we recommend using [uv](https://docs.astral.sh/uv/), a modern Python package manager that's significantly faster and more reliable than traditional pip. It handles virtual environments and dependencies with better performance and dependency resolution.

**Install uv:**

On macOS and Linux:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

On Windows:
```bash
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Create a new virtual environment:**

```bash
uv venv
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate  # On Windows
```

### Alternative: Using Poetry

If you prefer Poetry for dependency management, it offers robust project management with automatic virtual environment handling and dependency lock files.

**Install Poetry:**

On macOS and Linux:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

On Windows (PowerShell):
```bash
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

**Create a new project or add dependencies:**

```bash
# Initialize a new Poetry project
poetry init

# Activate the virtual environment
poetry shell
```

**Python Version Requirements:**
You'll need Python 3.10 or higher, as required by the qdrant-client library.

## Installing Dependencies

With your virtual environment activated, install the required libraries:

**Using uv (recommended):**

```bash
uv pip install "qdrant-client==1.16.2" "fastembed==0.7.4"
```

**Using Poetry:**

```bash
poetry add "qdrant-client==1.16.2" "fastembed==0.7.4"
```

**Using pip:**

```bash
pip install "qdrant-client==1.16.2" "fastembed==0.7.4"
```

### What These Libraries Do

- **qdrant-client (1.16.2)**: The official Python client for Qdrant, providing both synchronous and asynchronous APIs for vector search operations. This library contains full type definitions and supports all Qdrant features.

- **fastembed (0.7.4)**: A fast, lightweight library for generating embeddings, maintained by the Qdrant team. It includes support for multi-vector embeddings which we'll use extensively in this course.

## Verification Steps

Let's verify that everything is installed correctly.

**Test your imports:**

```python
from qdrant_client import QdrantClient
from fastembed import TextEmbedding

print("All dependencies installed successfully!")
```

**Quick connection test:**

If you set up Qdrant in the previous lesson, verify you can connect:

```python
# For Qdrant Cloud
client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key"
)

# For local Qdrant
# client = QdrantClient(url="http://localhost:6333")

print(f"Connected to Qdrant: {client.get_collections()}")
```

## Next Steps

With your Python environment configured and dependencies installed, you're ready to dive into Module 1, where we'll explore the fundamentals of multi-vector search and understand how it differs from traditional single-vector approaches.
