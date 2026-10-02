# fastembed-tables

Generates Markdown tables of FastEmbed supported models for the Qdrant documentation site.

## What it does

`generate.py` calls `list_supported_models()` for each of the four FastEmbed model types and writes one Markdown table per type to:

```
qdrant-landing/content/documentation/headless/content/fastembed/
├── text-embedding-models.md
├── sparse-text-embedding-models.md
├── late-interaction-models.md
└── image-embedding-models.md
```

These files are included by `qdrant-landing/content/documentation/fastembed/fastembed-models.md` via the Hugo `include` shortcode.

## How to run

```bash
pip install fastembed
python generate.py
```

Run this script whenever a new FastEmbed release adds or removes models, then commit the updated table files and open a PR.
