#!/usr/bin/env python3
"""Converts all runnable snippets to markdown files.

E.g., converts
    `snippets/create-collection/simple/python.py`
to
    `snippets/create-collection/simple/generated/python.md`

For using on CI and running before committing changes.
The reverse is `./migrate-snippet.py`.
"""

import difflib
import shutil
import sys
import traceback
import typing

from lib import SNIPPETS_DIR, collect_snippets
from lib.languages import ALL_LANGUAGES


def main() -> None:
    snippets = collect_snippets(bases=[SNIPPETS_DIR], languages=ALL_LANGUAGES)

    issues = 0

    for snippet_dir, snippets2 in snippets.items():
        generated_dir = snippet_dir / "generated"

        shutil.rmtree(generated_dir, ignore_errors=True)
        generated_dir.mkdir()

        for lang, snippet_fname in snippets2.items():
            try:
                shortened = lang.shorten(snippet_fname.read_text())
            except Exception as e:
                issues += 1
                print(f"Warning: failed to shorten snippet {snippet_fname}: {e}")
                traceback.print_exc()
                continue
            generated = f"```{lang.NAME}\n{shortened}```\n"

            generated_fname = generated_dir / f"{lang.NAME}.md"
            handwritten_fname = snippet_dir / f"{lang.NAME}.md"
            generated_fname.write_text(generated)

            if handwritten_fname.exists():
                issues += 1
                print(
                    "Warning: both snippet and generated file exist:",
                    snippet_dir / f"{lang.NAME}.md",
                )
                handwritten = (snippet_dir / f"{lang.NAME}.md").read_text()
                if handwritten != generated:
                    print_and_colorize_diff(
                        difflib.unified_diff(
                            handwritten.splitlines(keepends=True),
                            generated.splitlines(keepends=True),
                            fromfile=str(handwritten_fname),
                            tofile=str(generated_fname),
                        ),
                    )
                    print()

    if issues:
        print(f"Total issues found: {issues}")
        sys.exit(1)


def print_and_colorize_diff(diff: typing.Iterable[str]) -> None:
    for line in diff:
        if line.startswith("+"):
            print(end=f"\x1b[32m{line}\x1b[0m", file=sys.stderr)
        elif line.startswith("-"):
            print(end=f"\x1b[31m{line}\x1b[0m", file=sys.stderr)
        elif line.startswith("@"):
            print(end=f"\x1b[36m{line}\x1b[0m", file=sys.stderr)
        else:
            print(end=line, file=sys.stderr)


if __name__ == "__main__":
    main()
