import os
import sys
import typing
from pathlib import Path

from .languages import Language

SNIPPETS_DIR = Path(os.path.normpath(Path(__file__) / "../../snippets")).relative_to(
    Path.cwd()
)


def log(msg: str) -> None:
    """Print a message.

    Use this instead of `print()` to make the output more visible compared to
    the output of builders/snippet runs.
    """
    print(f"\x1b[30;43m + \x1b[m {msg}", file=sys.stderr)


type CollectedSnippetsType = dict[
    Path,  # directory path
    dict[type[Language], Path],  # language -> snippet path
]
"""Snippet filenames grouped by directory then by language.

Example:
{
    Path("snippets/example1"): {
        LanguageGo: Path("snippets/example1/go.go"),
        LanguagePython: Path("snippets/example1/python.py"),
    },
    Path("snippets/example2"): {
        LanguageGo: Path("snippets/example2/go.go"),
        LanguagePython: Path("snippets/example2/python.py"),
        LanguageRust: Path("snippets/example2/rust.rs"),
    },
}
"""


def collect_snippets(
    bases: list[Path],
    languages: typing.Sequence[type[Language]],
) -> CollectedSnippetsType:
    """Locate snippets in the given base paths."""

    result: CollectedSnippetsType = {}

    for base in bases:
        found = False
        if base.is_file():
            for lang in languages:
                if base.name == lang.SNIPPET_FILENAME:
                    result.setdefault(base.parent, {})[lang] = base
                    found = True
                    break
        elif base.is_dir():
            for root, dirs, files in os.walk(base):
                dirs[:] = [d for d in dirs if d != "__pycache__"]
                dirs.sort()
                dir_path = Path(root)

                for lang in languages:
                    if lang.SNIPPET_FILENAME in files:
                        found = True
                        result.setdefault(dir_path, {})[lang] = (
                            dir_path / lang.SNIPPET_FILENAME
                        )
        if not found:
            log(f"Warning: No snippets found in {base}")

    return result
