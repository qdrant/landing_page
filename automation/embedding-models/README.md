# Embedding model catalogs

These scripts generate the model tables on the FastEmbed and Qdrant Cloud
Inference embeddings pages. The
[Update Embedding Models](../../.github/workflows/update-embedding-models.yml)
workflow runs them every Sunday and opens a PR when a catalog changes. The data
files are generated, so change the scripts rather than editing the files.

```bash
# qdrant-landing/data/fastembed_models.json, from the latest FastEmbed release
uv run --upgrade automation/embedding-models/update-fastembed.py

# qdrant-landing/data/cloud_inference_models.json, from the Qdrant Cloud API
uv run automation/embedding-models/update-cloud-inference.py
```
