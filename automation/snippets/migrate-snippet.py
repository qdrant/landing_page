#!/usr/bin/env python3
"""Migrate the specified `.md` snippet to the runnable snippet file.

E.g., converts
    `snippets/create-collection/simple/python.md`
to
    `snippets/create-collection/simple/python.py`

Not reliable, might require manual adjustments.
Intended to be manually used to migrate non-runnable snippets into runnable
ones.
"""

import argparse
from pathlib import Path

from lib import log
from lib.languages import ALL_LANGUAGES


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("MD_FILE", nargs="+", type=Path)
    args = parser.parse_args()

    for md_file in args.MD_FILE:
        if md_file.suffix != ".md":
            log(f"Skipping non-markdown file: {md_file}")
            continue
        for lang in ALL_LANGUAGES:
            if md_file.name == f"{lang.NAME}.md":
                break
        else:
            log(f"Skipping unknown language file: {md_file}")
            continue

        lines = md_file.read_text().strip().splitlines()
        if not lines[0].startswith("```") or lines[-1] != "```":
            log(f"Can't parse snippet file: {md_file}, skipping")
            continue
        content = "\n".join(lines[1:-1]) + "\n"
        content = lang.unshorten(content)

        log(f"Converting {md_file} to {lang.SNIPPET_FILENAME}")
        (md_file.parent / lang.SNIPPET_FILENAME).write_text(content)


if __name__ == "__main__":
    main()
