# /// script
# requires-python = ">=3.10"
# ///
"""Refresh the docs catalog: uv run automation/embedding-models/update-cloud-inference.py.
"""

import json
from pathlib import Path
from urllib.request import urlopen

API_URL = "https://api.cloud.qdrant.io/api/booking/v1/inference-models?cloud_provider_id=aws&cloud_provider_region_id=us-east-1"
GROUPS = {
    "VECTOR_TYPE_DENSE": "dense",
    "VECTOR_TYPE_SPARSE": "sparse",
    "VECTOR_TYPE_MULTI": "multivector",
}
MODALITIES = {
    "MODEL_MODALITY_TEXT": "Text",
    "MODEL_MODALITY_IMAGE": "Image",
}


def main():
    with urlopen(API_URL, timeout=30) as response:
        items = json.load(response)["items"]
    catalog = {name: [] for name in GROUPS.values()}
    for item in items:
        # Provider passthroughs such as `openai/*` are not hosted models.
        if item.get("isExternal"):
            continue
        group = GROUPS.get(item.get("vectorType"))
        modality = MODALITIES.get(item.get("modality"))
        if not (group and modality):
            raise ValueError(f"Unknown vector type or modality for {item.get('name')}")
        entry = {"model": item["name"], "modality": modality}
        if group != "sparse":
            entry["dimensions"] = item["dimensionality"]
        entry["cost"] = "Paid" if item.get("unitIntPrice") else "Free"
        catalog[group].append(entry)
    for models in catalog.values():
        models.sort(key=lambda model: model["model"].casefold())
    output = Path(__file__).resolve().parents[2] / "qdrant-landing/data/cloud_inference_models.json"
    output.write_text(json.dumps(catalog, indent=2) + "\n")
    print(f"Updated {output.name}: {sum(map(len, catalog.values()))} models")


if __name__ == "__main__":
    main()
