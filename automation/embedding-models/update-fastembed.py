# /// script
# requires-python = ">=3.10"
# dependencies = ["fastembed>=0.9.0"]
# ///
"""Refresh the docs catalog: uv run --upgrade automation/embedding-models/update-fastembed.py.
"""

import json
from importlib.metadata import version
from pathlib import Path

from fastembed import (
    ImageEmbedding,
    LateInteractionMultimodalEmbedding,
    LateInteractionTextEmbedding,
    SparseTextEmbedding,
    TextEmbedding,
)


def main():
    registries = {
        "dense": TextEmbedding,
        "sparse": SparseTextEmbedding,
        "multivector": LateInteractionTextEmbedding,
        "image": ImageEmbedding,
        "multimodal": LateInteractionMultimodalEmbedding,
    }
    groups = {}
    for name, registry in registries.items():
        models = []
        for model in registry.list_supported_models():
            # FastEmbed retains this misspelled alias for older callers.
            if model["model"] == "prithvida/Splade_PP_en_v1":
                continue
            entry = {"model": model["model"], "license": model["license"]}
            if name != "sparse":
                entry["dimensions"] = model["dim"]
            models.append(entry)
        if not models:
            raise ValueError(f"FastEmbed returned an empty {name} registry")
        groups[name] = sorted(models, key=lambda model: model["model"].casefold())
    catalog = {"version": version("fastembed"), "models": groups}
    output = Path(__file__).resolve().parents[2] / "qdrant-landing/data/fastembed_models.json"
    output.write_text(json.dumps(catalog, indent=2) + "\n")
    print(f"Updated {output.name}: {sum(map(len, groups.values()))} models, FastEmbed {catalog['version']}")


if __name__ == "__main__":
    main()
