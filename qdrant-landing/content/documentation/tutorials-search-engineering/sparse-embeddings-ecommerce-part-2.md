---
title: "Fine-Tuning Sparse Embeddings for E-Commerce Search | Part 2: Training SPLADE on Modal"
short_description: "Part 2 (hands-on) of a 5-part tutorial: train a SPLADE model on Amazon's ESCI dataset with Sentence Transformers on Modal."
description: "Part 2 of a 5-part tutorial on fine-tuning SPLADE for e-commerce search: train on Amazon ESCI with Sentence Transformers on Modal GPUs."
social_preview_image: /documentation/tutorials/sparse-embeddings-ecommerce-part-2/preview/social_preview.jpg
weight: 21
author: Thierry Damiba
author_link: https://github.com/thierrydamiba
date: 2026-03-09T00:00:00.000Z
goal: Search Quality
stack:
  - Python
  - Sentence Transformers
  - Modal
example_resources:
  - label: View Code
    url: https://github.com/qdrant-labs/finetune-ecommerce-search
aliases:
  - /articles/sparse-embeddings-ecommerce-part-2/
---

<link rel="stylesheet" href="/documentation/tutorials/sparse-embeddings-ecommerce/figures.css">

*This is Part 2 of a 5-part tutorial on fine-tuning sparse embeddings for e-commerce search. In [Part 1](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-1/), we covered why sparse embeddings beat BM25 for e-commerce. Now we build the training pipeline.*

**Series:**
- [Part 1: Why Sparse Embeddings Beat BM25](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-1/)
- Part 2: Training SPLADE on Modal (here)
- [Part 3: Evaluation and Hard Negatives](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-3/)
- [Part 4: Specialization vs Generalization](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-4/)
- [Part 5: From Research to Product](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-5/)

---

In Part 1 we made the case for sparse embeddings in e-commerce search. Now we write the code. All source code is available in the [GitHub repo](https://github.com/qdrant-labs/finetune-ecommerce-search), and you can try the [fine-tuned models on HuggingFace](https://huggingface.co/Qdrant/splade-ecommerce-esci). Want to skip straight to fine-tuning on your own data? See the [`sparse-finetune`](https://github.com/qdrant/sparse-finetune) CLI. By the end of this piece, you'll have a SPLADE model trained on Amazon's ESCI dataset, running on Modal's serverless GPUs, with checkpoints saved to persistent storage.

## Prerequisites

- Python 3.10 or later, [uv](https://docs.astral.sh/uv/), and a [Modal](https://modal.com/) account.
- A Qdrant cluster URL and API key, stored as a Modal secret named `qdrant`. The repository's Modal functions reference this secret.
- The 100K-sample training run uses about $0.35 of Modal A100 time.

```bash
git clone https://github.com/qdrant-labs/finetune-ecommerce-search.git
cd finetune-ecommerce-search
uv run modal setup
uv run modal secret create qdrant QDRANT_URL=<your-cluster-url> QDRANT_API_KEY=<your-api-key>
```

Run all commands in this tutorial from the repository root. The code blocks on this page explain what the repository's `modal_app.py` does.

## The Dataset: Amazon ESCI

We use Amazon's [ESCI dataset](https://github.com/amazon-science/esci-data) (Shopping Queries Dataset), released for KDD Cup 2022. It's one of the most realistic e-commerce search benchmarks available:

- **1.2M+ query-product pairs** with human-annotated relevance labels
- **Four relevance grades**: Exact (E), Substitute (S), Complement (C), Irrelevant (I)
- **Rich product metadata**: titles, descriptions, bullet points, brands

The graded relevance is what makes ESCI interesting:

{{< include "content/headless/sparse-embeddings-ecommerce/figures/esci-relevance-gradient.html" >}}

For training, we use Exact and Substitute pairs as positives. This teaches the model that both the exact product and reasonable alternatives are relevant, matching how real shoppers think.

### Loading the Data

```python
from datasets import Dataset, load_dataset

def load_esci_training_data(max_samples: int | None = None) -> Dataset:
    """Load ESCI dataset as anchor-positive pairs for contrastive training."""
    dataset = load_dataset("tasksource/esci", split="train")

    pairs = []
    for row in dataset:
        # keep US products only
        if row["product_locale"] != "us":
            continue
        if row["esci_label"] not in ("Exact", "Substitute"):
            continue

        query = row["query"]
        product_text = build_product_text(
            title=row["product_title"],
            brand=row.get("product_brand", ""),
            description=row.get("product_description", ""),
            bullets=(row.get("product_bullet_point") or "").split("\n"),  # bullets arrive as one string
        )
        pairs.append({"anchor": query, "positive": product_text})

        if max_samples and len(pairs) >= max_samples:
            break

    return Dataset.from_list(pairs)
```

### Product Text Formatting

How you format product text matters for sparse embeddings. Unlike dense models that capture broad semantic meaning, SPLADE is lexically grounded: the specific tokens in your text determine which vocabulary dimensions activate:

```python
def build_product_text(
    title: str,
    brand: str = "",
    description: str = "",
    bullets: list[str] | None = None,
    max_length: int = 512,
) -> str:
    """Consistent product text formatting for SPLADE."""
    parts = []

    # Brand in brackets makes it a distinct signal
    if brand:
        parts.append(f"[{brand}]")

    parts.append(title)

    # Pipe separators help the model distinguish sections
    if description:
        parts.append(f"| {description[:200]}")

    if bullets:
        parts.append(f"| {' | '.join(bullets[:3])}")

    text = " ".join(parts)
    return text[:max_length]

# Example output:
# "[Sony] WH-1000XM5 Wireless Headphones | Industry-leading noise
#  cancellation | 30hr battery | Hi-Res Audio"
```

The bracket notation for brands, pipe separators between sections, and character limits are deliberate. They preserve lexical signals that SPLADE can learn from: brand names, product attributes, and key features remain as distinct tokens rather than blurring into a wall of text.

{{< include "content/headless/sparse-embeddings-ecommerce/figures/training-stack.html" >}}

## Setting Up the Modal App

Modal gives us serverless GPUs. No provisioning, no idle hardware, pay-per-second billing. Here's the app configuration:

```python
import modal

app = modal.App("esci-sparse-encoder")

# Persistent storage for checkpoints and datasets
checkpoint_volume = modal.Volume.from_name(
    "esci-sparse-checkpoints", create_if_missing=True
)
dataset_volume = modal.Volume.from_name(
    "esci-datasets", create_if_missing=True
)

# Docker image with dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "sentence-transformers>=5.0.0",
        "torch>=2.2.0",
        "transformers>=4.45.0",
        "datasets>=2.20.0",
        "qdrant-client>=1.19.0",  # Memory tiers (Part 3) need 1.19 or later
        "accelerate>=0.30.0",
    )
)
```

Two things matter here:

**Persistent volumes.** Training runs can take hours. If your SSH connection drops or a container restarts, you don't want to lose checkpoints. Modal volumes persist data across runs. Mount them at a path and write to them like a local filesystem.

**Detached runs.** For long training jobs, launch with `--detach` and walk away:

```bash
# Start training and disconnect
uv run modal run --detach modal_app.py --config-path configs/splade_standard.yaml --mode train

# Come back later, check your checkpoints
uv run modal volume ls esci-sparse-checkpoints /splade_standard
```

No S3 uploads, no checkpoint management code, no lost training runs.

## Creating the SPLADE Model

Sentence Transformers v5 introduced `SparseEncoder`, making SPLADE training straightforward. The model has two components:

1. **MLMTransformer**: A transformer with a masked language model head that outputs logits over the full vocabulary
2. **SpladePooling**: Applies ReLU + log saturation to the token-level logits and max-pools across positions

```python
from sentence_transformers import SparseEncoder
from sentence_transformers.sparse_encoder.models import (
    MLMTransformer,
    SpladePooling,
)

def create_sparse_encoder(base_model: str = "distilbert/distilbert-base-uncased") -> SparseEncoder:
    """Create a SPLADE model from a base transformer."""

    # MLM transformer outputs logits over vocabulary
    mlm = MLMTransformer(base_model)

    # SPLADE pooling: max over tokens, ReLU activation
    pooling = SpladePooling(pooling_strategy="max")

    return SparseEncoder(modules=[mlm, pooling])
```

We start from DistilBERT rather than a pre-trained SPLADE checkpoint (like `naver/splade-v3`). This is a deliberate choice. We want to measure how much domain-specific fine-tuning helps when starting from a general language model, not from a model already trained on web search data.

## The Training Function

Here's the core training logic, decorated as a Modal function:

```python
@app.function(
    image=image,
    gpu="A100",
    volumes={
        "/checkpoints": checkpoint_volume,
        "/datasets": dataset_volume,
    },
    timeout=3600 * 6,
)
def train_sparse_encoder(config: dict) -> str:
    from sentence_transformers import SparseEncoder, SparseEncoderTrainingArguments
    from sentence_transformers.sparse_encoder import SparseEncoderTrainer
    from sentence_transformers.sparse_encoder.losses import SpladeLoss, SparseMultipleNegativesRankingLoss
    from sentence_transformers.training_args import BatchSamplers

    # Create model
    model = create_sparse_encoder(config["base_model"])

    # Load ESCI dataset (anchor-positive pairs)
    train_dataset = load_esci_training_data(
        max_samples=config.get("max_samples")
    )

    # SPLADE loss combines contrastive learning with sparsity regularization
    loss = SpladeLoss(
        model=model,
        loss=SparseMultipleNegativesRankingLoss(model=model),
        query_regularizer_weight=float(config.get("query_regularizer_weight", 5e-5)),
        document_regularizer_weight=float(config.get("document_regularizer_weight", 3e-5)),
    )

    # Training arguments
    args = SparseEncoderTrainingArguments(
        output_dir=f"/checkpoints/{config['run_name']}",
        num_train_epochs=config.get("num_epochs", 1),
        per_device_train_batch_size=config.get("batch_size", 32),
        learning_rate=float(config.get("learning_rate", 2e-5)),
        warmup_ratio=0.1,
        fp16=True,
        batch_sampler=BatchSamplers.NO_DUPLICATES,  # deduplicate texts in one batch
        save_steps=1000,
        logging_steps=100,
    )

    # Train
    trainer = SparseEncoderTrainer(
        model=model,
        args=args,
        train_dataset=train_dataset,
        loss=loss,
    )
    trainer.train()

    # Save final model
    model.save_pretrained(f"/checkpoints/{config['run_name']}/final")

    return f"/checkpoints/{config['run_name']}/final"
```

### Understanding SpladeLoss

`SpladeLoss` wraps two objectives:

**Contrastive loss** (`SparseMultipleNegativesRankingLoss`): Given a batch of (query, product) pairs, treat other products in the batch as negatives. Push relevant query-product pairs together, push irrelevant ones apart. This is the same in-batch negative approach used for dense embedding training, and it works because most random products are irrelevant to a given query.

**Sparsity regularization**: Penalizes dense outputs to maintain efficiency. Without it, the model would activate all 30,000 vocabulary dimensions for every input. That's technically optimal for matching but useless for retrieval speed and storage.

The regularization weights control this tradeoff:

| Parameter | Value | Effect |
|---|---|---|
| `query_regularizer_weight` | 5e-5 | Higher = sparser queries |
| `document_regularizer_weight` | 3e-5 | Higher = sparser documents |

The sweet spot is ~30 active terms per query and 100-400 per product. Too high regularization produces nearly empty vectors (fast but low recall). Too low produces thousands of terms (slow, huge index).

Document regularization is lower than query regularization because product descriptions need more terms to capture all relevant attributes. A product listing for headphones should activate terms like "audio", "wireless", "bluetooth", "noise", "canceling" - more than the 3-4 words in a typical query.

### Configuration via YAML

We keep hyperparameters in YAML files for easy experimentation:

```yaml
# configs/splade_standard.yaml
run_name: splade_standard
base_model: distilbert/distilbert-base-uncased
architecture: splade
batch_size: 32
learning_rate: 2e-5
num_epochs: 1
query_regularizer_weight: 5e-5
document_regularizer_weight: 3e-5
max_samples: 100000
```

100K samples trains in about 6 minutes on an A100 and costs less than $1 on Modal. The full 1.2M dataset with multiple epochs takes a few hours, still cheap compared to reserved GPU instances.

## Parallel Hyperparameter Sweeps

One of Modal's strengths is embarrassingly parallel workloads. Hyperparameter sweeps are a natural fit. `spawn()` launches one GPU per configuration:

```python
# Pseudocode: training and evaluate() are elided.
# The runnable version is run_sweep() in the repository's modal_app.py.
@app.function(gpu="A10G")
def train_single_experiment(config: dict) -> dict:
    """Train one configuration."""
    model = create_sparse_encoder(config["base_model"])
    # ... training code ...
    return {"config": config, "ndcg": evaluate(model)}

@app.local_entrypoint()
def run_hyperparameter_sweep() -> None:
    """Launch all experiments in parallel."""
    base = {"base_model": "distilbert/distilbert-base-uncased", "max_samples": 5000}
    configs = [
        {**base, "learning_rate": 1e-5, "query_regularizer_weight": 1e-5, "document_regularizer_weight": 1e-5},
        {**base, "learning_rate": 2e-5, "query_regularizer_weight": 5e-5, "document_regularizer_weight": 3e-5},
        {**base, "learning_rate": 5e-5, "query_regularizer_weight": 1e-4, "document_regularizer_weight": 5e-5},
        {**base, "learning_rate": 2e-5, "query_regularizer_weight": 1e-4, "document_regularizer_weight": 1e-4},
    ]

    # Launch all experiments simultaneously
    handles = [train_single_experiment.spawn(c) for c in configs]

    # Collect results as they complete
    results = [h.get() for h in handles]
    best = max(results, key=lambda r: r["ndcg"])
    print(f"Best config: {best}")
```

A 4-experiment sweep finishes in the time of a single training run. Each experiment gets its own GPU. You pay only for the compute time actually used, not for idle GPUs waiting in a queue.

## Inference-Free SPLADE

Standard SPLADE runs the transformer on every query. Inference-free SPLADE runs it only on documents, at index time, so documents keep their neural expansions while queries skip the model entirely. Query cost drops to about the level of BM25.

The training code in this series can build that variant: with `architecture: inference_free_splade`, the query side becomes a `SparseStaticEmbedding`, which learns one fixed weight per vocabulary token, and the document side stays the full SPLADE encoder. Trained with the same configuration as the standard model and evaluated on the same 10,000 products and 2,000 queries, **it reached nDCG@10 0.379**, against 0.390 for standard SPLADE trained the same way.

For a deeper look, see the [Inference-Free SPLADE blog post of our core team engineer](https://www.kshivendu.dev/blog/if-splade) and the [talk recording from the RAG: Retrieval Augmented Gathering series](https://maven.com/p/73ce5d/neural-search-at-bm25-latency).

{{< include "content/headless/sparse-embeddings-ecommerce/figures/modal-detached-training.html" >}}

## Running Training

With everything in place, launch training:

```bash
# Quick test run (100K samples)
uv run modal run modal_app.py \
    --config-path configs/splade_standard.yaml \
    --mode train

# Full dataset (set max_samples: null in the YAML), detached
uv run modal run --detach modal_app.py \
    --config-path configs/splade_standard.yaml \
    --mode train
```

The model checkpoint gets saved to the persistent volume at `/checkpoints/splade_standard/final`. We've also published the trained model on HuggingFace as [splade-ecommerce-esci](https://huggingface.co/Qdrant/splade-ecommerce-esci) so you can skip training and use it directly. In Part 3, we'll load this model, index products into Qdrant, and run retrieval benchmarks to see exactly how much we've improved over BM25.

The run ends with `Training complete. Model saved to: /checkpoints/splade_standard/final`. Checkpoints and cached data stay in the `esci-sparse-checkpoints` and `esci-datasets` volumes until you delete them with `uv run modal volume delete <name>`.

## Key Takeaways

- **ESCI's graded relevance** (Exact, Substitute, Complement, Irrelevant) teaches the model nuanced matching, not just binary relevant/not-relevant.
- **Product text formatting matters** for sparse models. Keep lexical signals distinct with structured formatting.
- **SpladeLoss balances two objectives**: contrastive learning for relevance and regularization for sparsity. The regularization weights are the main knob to tune.
- **Modal's persistent volumes** solve the checkpoint management problem. Detached runs survive SSH drops.

---

*Next: [Part 3 - Evaluation and Hard Negatives](/documentation/tutorials-search-engineering/sparse-embeddings-ecommerce-part-3/)*
