---
title: "Fine-Tuning Sparse Embeddings for E-Commerce Search | Part 5: From Research to Product"
short_description: "Part 5 (hands-on) of a 5-part tutorial: fine-tune SPLADE for your own product catalog with the qdrant-finetune CLI."
description: "Part 5 of a 5-part tutorial on fine-tuning SPLADE for e-commerce search: fine-tune for your own catalog with the qdrant-finetune CLI."
social_preview_image: /documentation/tutorials/sparse-embeddings-ecommerce-part-5/preview/social_preview.jpg
weight: 24
author: Thierry Damiba
author_link: https://github.com/thierrydamiba
date: 2026-03-09T00:00:00.000Z
goal: Search Quality
stack:
  - Python
  - Modal
example_resources:
  - label: View Code
    url: https://github.com/qdrant/sparse-finetune
aliases:
  - /articles/sparse-embeddings-ecommerce-part-5/
---

<link rel="stylesheet" href="/documentation/tutorials/sparse-embeddings-ecommerce/figures.css">

*This is Part 5 of a 5-part tutorial on fine-tuning sparse embeddings for e-commerce search. Parts [1](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-1/)–[4](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-4/) explained and built the pipeline from scratch. This part packages it into a tool anyone can use.*

**Series:**
- [Part 1: Why Sparse Embeddings Beat BM25](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-1/)
- [Part 2: Training SPLADE on Modal](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-2/)
- [Part 3: Evaluation and Hard Negatives](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-3/)
- [Part 4: Specialization vs Generalization](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-4/)
- Part 5: From Research to Product (here)

---

In Parts 1 through 4, we built a SPLADE fine-tuning pipeline piece by piece: data loading, Modal GPU training, Qdrant evaluation, ANCE-inspired hard negative mining, cross-domain experiments. The results were strong: 17% over BM25 on Amazon ESCI.

Using it required reading four tutorial parts, cloning a repo, understanding the training loop internals, wiring up Modal volumes, and configuring Qdrant connections manually. That's fine for a series walkthrough. It's not fine for someone who has a product catalog and wants a better search model by end of day.

So we packaged everything into [`qdrant-sparse-finetune`](https://github.com/qdrant/sparse-finetune): an open-source CLI and web dashboard that runs the entire pipeline (synthetic query generation, SPLADE training with ANCE-inspired hard negative mining, evaluation, and HuggingFace publishing) with a single command.

## The Problem We're Solving

{{< include "content/headless/sparse-embeddings-ecommerce/figures/research-to-production-pipeline.html" >}}

The [series repo](https://github.com/qdrant-labs/finetune-ecommerce-search) is research code. It demonstrates how sparse embedding fine-tuning works. Actually using it on your data means you need to:

1. Format your product data to match the expected schema
2. Either provide labeled queries or set up an LLM API for synthetic generation
3. Configure Modal volumes and GPU settings
4. Wire up Qdrant credentials for indexing and mining
5. Run training, manually trigger hard negative mining iterations
6. Evaluate, interpret metrics
7. Publish to HuggingFace if you want to share the model

Each step has its own configuration, its own failure modes, and its own set of assumptions about how the previous step ran. It's a pipeline with no orchestration.

`qdrant-sparse-finetune` handles all of that:

```bash
git clone https://github.com/qdrant/sparse-finetune.git
cd sparse-finetune
pip install -e .
qdrant-finetune setup
qdrant-finetune pipeline --data products.csv --gpu modal
```

The setup wizard configures Qdrant, your LLM provider, and your GPU backend (choose Modal). The pipeline command runs everything end-to-end. On Modal, the trained model stays in the `finetune-output` volume; download it with `mkdir -p output/finetune && modal volume get finetune-output /modal_run/final ./output/finetune` before evaluating or publishing. 

A successful run ends with `Training complete!` and `Pipeline complete!`. With `--gpu modal`, the evaluation table (nDCG@10, MRR@10, recall, precision) prints in the Modal output, and the local evaluation step is skipped until you download the model.

## Two Interfaces, Same Pipeline

### The CLI

For developers and automation:

```bash
# End-to-end on Modal (serverless A10G by default)
qdrant-finetune pipeline --data products.csv --gpu modal

# Or step by step
qdrant-finetune generate-queries --data products.csv --synth-model gpt-4o-mini
qdrant-finetune train --data products.csv --queries queries.jsonl --gpu modal
qdrant-finetune evaluate --model output/finetune/final --queries test_queries.jsonl
qdrant-finetune publish --model output/finetune/final --repo your-name/your-model
```

The `pipeline` command chains all four steps. If you already have labeled queries, pass `--queries` to skip generation. If you pass `--repo`, it publishes automatically. If you don't, it asks after training completes, when the model is available locally:

```
Training complete! Publish to HuggingFace Hub? [Y/n]: y
  Repo name (e.g. your-username/my-splade-model): acme/product-search-splade
  Private repo? [y/N]: n

Published → https://huggingface.co/acme/product-search-splade
```

No buried flags. The most valuable output, a shareable model URL, is the natural endpoint of the workflow.

### The Dashboard

For teams who prefer a visual interface:

```bash
pip install fastapi uvicorn
qdrant-finetune studio
```

This launches a web dashboard with tabs for each stage of the pipeline:

**Train.** Configure hard negative mining iterations, batch size, and GPU backend. Submit a job and follow its status in the job log.

**Evaluate.** Point at a trained model and test queries. Get metric cards for nDCG@10, MRR@10, Recall, and Precision.

**[Collections](https://qdrant.tech/documentation/manage-data/collections/).** Browse your Qdrant collections and check point counts. Useful for sanity-checking that indexing worked before evaluation.

**Publish.** Enter a model path, HuggingFace repo name, and token. Click publish.

**Jobs.** Full history of every training, evaluation, and publish job. Expand any job to see its configuration, logs, and results. Jobs are tracked whether they were launched from the CLI or the dashboard.

**Settings.** Manage API keys for Qdrant, OpenAI, Anthropic, and OpenRouter. All stored in `.env`, all masked in the UI.

The dashboard is a visual starting point. You can see everything the tool can do without reading documentation, and the job history gives you a record of every experiment.

## What Changed From the Series Code

{{< include "content/headless/sparse-embeddings-ecommerce/figures/production-architecture.html" >}}

The pipeline from Parts 2-4 is the same underneath. The toolkit wraps it with:

**Automatic data handling.** Pass a CSV, JSON, JSONL, or HuggingFace dataset path. The loader auto-detects columns (`title`, `description`, `name`, `product_id`) and builds product text by joining the detected columns with ` | `, the separator from Part 2. No manual formatting.

**Synthetic query generation.** If you don't have labeled queries, the toolkit generates them using any [litellm](https://docs.litellm.ai/docs/providers)-supported model. Pass `--synth-model gpt-4o-mini` or `--synth-model ollama/llama3` for local generation. It reads your product catalog and generates realistic search queries with relevance labels.

```bash
# OpenAI
qdrant-finetune generate-queries --data products.csv --synth-model gpt-4o-mini

# Local Ollama
qdrant-finetune generate-queries --data products.csv --synth-model ollama/llama3

# Anthropic
qdrant-finetune generate-queries --data products.csv --synth-model anthropic/claude-sonnet-4-20250514
```

**Serverless GPU training.** The `--gpu modal` flag handles volume creation, data upload, and job launching. Download the trained model with `modal volume get`.

**Interactive publishing.** The original series code required you to manually load the model and call `push_to_hub`. The toolkit prompts you after training completes (when the model is available locally), asks for the repo name, handles authentication, and prints the HuggingFace URL.

**Job tracking.** Every operation (train, evaluate, publish) is logged with configuration, timestamps, status, and output. The dashboard surfaces this as a job history. The CLI stores it in a local SQLite database.

## One-Line Python API

For notebooks and scripts, the same pipeline is available as a function call:

```python
from qdrant_finetune import finetune

model_path = finetune("products.csv")
```

That single line:
1. Loads your product data
2. Generates synthetic queries via LLM
3. Creates a SPLADE encoder
4. Runs 3 rounds of ANCE-inspired hard negative mining against Qdrant
5. Saves the fine-tuned model

For more control:

```python
from qdrant_finetune import Trainer, FinetuneConfig

config = FinetuneConfig(
    base_model="distilbert/distilbert-base-uncased",
    ance_iterations=5,
    batch_size=64,
    mining_top_k=20,
    num_negatives=3,
)

trainer = Trainer(config)
trainer.fit(data="products.csv", queries="queries.csv")
trainer.index(data="products.csv", collection_name="my_products")
metrics = trainer.evaluate(queries="test_queries.csv", collection_name="my_products")
print(metrics)  # prints nDCG@10, MRR@10 and related metrics
```

Same ANCE-inspired loop from Part 3, same evaluation metrics. The `Trainer` class wraps the training loop, Qdrant indexing, hard negative mining, and evaluation into a coherent API.

## Getting Started

You need Python 3.10 or later, a [Modal](https://modal.com/) account with a payment method on file, a Qdrant URL (and API key for Qdrant Cloud), an API key for your LLM provider if you generate synthetic queries, and a Hugging Face token if you publish. `qdrant-finetune setup` asks for these and creates the Modal secrets. 

To try the pipeline before using your own catalog, run it on the sample files in the repository root: `qdrant-finetune pipeline --data test_products.csv --queries test_queries.jsonl --gpu modal`.

```bash
# Install from GitHub; run all qdrant-finetune commands from the repository root
git clone https://github.com/qdrant/sparse-finetune.git
cd sparse-finetune
pip install -e .

# Configure (interactive wizard)
qdrant-finetune setup

# Run the full pipeline
qdrant-finetune pipeline --data your-products.csv --gpu modal
```

Your data and model stay in the Modal volumes `finetune-data` and `finetune-output` until you delete them with `modal volume delete <name>`. Training indexes products into the Qdrant collection `sparse_finetune` by default; delete it with `client.delete_collection("sparse_finetune")`.

Or skip the CLI and launch the dashboard (it also needs `pip install fastapi uvicorn`):

```bash
qdrant-finetune studio
```

The [source code is on GitHub](https://github.com/qdrant/sparse-finetune). File issues, submit PRs, or fork it for your own use case.

## What's Actually Different

The series taught the concepts. The toolkit removes the friction. Specifically:

- **No pipeline assembly.** You don't wire up Modal → training → Qdrant → mining → retraining. One command does it.
- **No data formatting.** Auto-detection handles CSV columns. Name your product ID column `product_id`, `id`, `asin`, `sku`, or `item_id`; otherwise the CLI numbers products itself, and query labels can point at the wrong products.
- **No query labeling requirement.** Synthetic generation means you can start with just a product CSV. No click logs, no relevance labels needed.
- **No credential juggling.** Setup once, stored in `.env`, used everywhere.
- **No manual publishing.** Interactive prompt after training, once the model is local. HuggingFace link as the final output.

The fine-tuning pipeline from Part 3 isn't locked behind a research repo anymore. It's now packaged as a CLI.

---

## Series Summary

- **[Part 1: Why Sparse Embeddings Beat BM25](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-1/)**: SPLADE combines keyword precision with learned expansion
- **[Part 2: Training SPLADE on Modal](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-2/)**: A100 training with persistent checkpoints
- **[Part 3: Evaluation and Hard Negatives](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-3/)**: +17% vs BM25, ANCE-inspired mining with Qdrant
- **[Part 4: Specialization vs Generalization](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-4/)**: Domain-specific vs multi-domain tradeoffs
- **[Part 5: From Research to Product](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-5/)**: CLI + dashboard that runs the full pipeline

---

## Acknowledgements

Thanks to all the people who made this series possible. It started with Kumar Shivendu's insight that the industry lacked good resources on fine-tuning retrieval models on your own dataset to outperform popular models optimized for general benchmarks. He shared Jason and Ivan's blog as a starting point. Charles Frye from Modal provided their GPU credits. Evgeniya Sukhodolskaya pointed to Sentence Transformers v5's native sparse model support which simplified training and reviewed every draft. Neil Kanungo pushed for more diagrams and clearer structure. Nathan LeRoy caught the remaining technical gaps we missed.
