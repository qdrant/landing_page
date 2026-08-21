#!/usr/bin/env python3
"""Generate Markdown tables of FastEmbed supported models.

Writes four .md files to qdrant-landing/content/documentation/headless/content/fastembed/.
Run this script whenever a new fastembed release adds or removes models, then commit
the updated files and open a PR.
"""

import pathlib

from fastembed import (
    ImageEmbedding,
    LateInteractionTextEmbedding,
    SparseTextEmbedding,
    TextEmbedding,
)

REPO_ROOT = pathlib.Path(__file__).parent.parent.parent
OUTPUT_DIR = REPO_ROOT / "qdrant-landing/content/documentation/headless/content/fastembed"


def _row(cells: list) -> str:
    return "| " + " | ".join(str(c) for c in cells) + " |"


def _table(headers: list[str], rows: list[list]) -> str:
    lines = [_row(headers), _row(["---"] * len(headers))]
    lines.extend(_row(r) for r in rows)
    return "\n".join(lines) + "\n"


def write_table(filename: str, content: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = OUTPUT_DIR / filename
    dest.write_text(content)
    print(f"Wrote {dest.relative_to(REPO_ROOT)}")


def main() -> None:
    # Dense text embeddings
    models = sorted(TextEmbedding.list_supported_models(), key=lambda m: m["model"])
    rows = [[m["model"], m["dim"], m["license"], m["size_in_GB"]] for m in models]
    write_table(
        "text-embedding-models.md",
        _table(["Model", "Dimensions", "License", "Size (GB)"], rows),
    )

    # Sparse text embeddings
    models = sorted(SparseTextEmbedding.list_supported_models(), key=lambda m: m["model"])
    rows = [
        [m["model"], m.get("vocab_size", ""), "Yes" if m.get("requires_idf") else "", m["license"], m["size_in_GB"]]
        for m in models
    ]
    write_table(
        "sparse-text-embedding-models.md",
        _table(["Model", "Vocab Size", "[Requires IDF](/documentation/manage-data/indexing/#idf-modifier)", "License", "Size (GB)"], rows),
    )

    # Late interaction
    models = sorted(LateInteractionTextEmbedding.list_supported_models(), key=lambda m: m["model"])
    rows = [[m["model"], m["dim"], m["license"], m["size_in_GB"]] for m in models]
    write_table(
        "late-interaction-models.md",
        _table(["Model", "Dimensions", "License", "Size (GB)"], rows),
    )

    # Image embeddings
    models = sorted(ImageEmbedding.list_supported_models(), key=lambda m: m["model"])
    rows = [[m["model"], m["dim"], m["license"], m["size_in_GB"]] for m in models]
    write_table(
        "image-embedding-models.md",
        _table(["Model", "Dimensions", "License", "Size (GB)"], rows),
    )


if __name__ == "__main__":
    main()
