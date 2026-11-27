# /// script
# requires-python = ">=3.11"
# dependencies = ["fastembed"]
# ///
"""Refresh the docs catalog: uv run --upgrade automation/embedding-models/update-fastembed.py.
"""

import json
from pathlib import Path

import fastembed


def main():
    classes = []
    for name, models in fastembed.list_supported_models().items():
        entries = []
        for model in models:
            entry = {"model": model["model"], "license": model["license"]}
            if "dim" in model:
                entry["dimensions"] = model["dim"]
            entries.append(entry)
        classes.append({"name": name, "models": sorted(entries, key=lambda entry: entry["model"].casefold())})
    catalog = {"version": fastembed.__version__, "classes": classes}
    output = Path(__file__).resolve().parents[2] / "qdrant-landing/data/fastembed_models.json"
    output.write_text(json.dumps(catalog, indent=2) + "\n")
    print(f"Updated {output.name}: {sum(len(c['models']) for c in classes)} models, FastEmbed {catalog['version']}")


if __name__ == "__main__":
    main()
