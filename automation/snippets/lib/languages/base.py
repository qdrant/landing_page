import dataclasses
import os
import re
import typing
from pathlib import Path

if typing.TYPE_CHECKING:
    from _typeshed import StrOrBytesPath


class Language:
    """Base class for a programming language snippet tester."""

    NAME: str
    """Name of the programming language, e.g., 'python'."""

    SNIPPET_FILENAME: str
    """Filename of the snippet in this language, e.g., 'python.py'."""

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> "CompileResult":
        """Compile, typecheck, and prepare all snippets listed in fnames.

        Might create scratch projects in tmpdir.
        """
        raise NotImplementedError

    @classmethod
    def shorten(cls, contents: str) -> str:
        """Shorten the snippet contents into a form suitable for inclusion in
        documentation.

        Removes boilerplate code, e.g. class wrappers, main functions, etc.
        """
        return generic_shorten(contents)

    @classmethod
    def unshorten(cls, contents: str) -> str:
        """Convert the shortened snippet into runnable code.

        Not reliable, might require manual adjustments.
        """
        return contents

    @classmethod
    def format(cls, fnames: list[str]) -> None:
        """Format the snippets specified by fnames in place."""
        pass


@dataclasses.dataclass
class CompileResult:
    run_args: dict[Path, typing.Sequence["StrOrBytesPath"]] = dataclasses.field(
        default_factory=dict
    )
    """Mapping from the snippet filename to the command that runs the
    snippet."""

    has_issues: bool = False
    """If true, indicates that there were issues during
    compilation/typechecking, but the snippets can still be run.
    """


def copy_template(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(src.read_text().replace("{collection_name}", "collection_name"))


def template(
    original_fname: Path,
    target_fname: Path,
    replacements: dict[str, str],
) -> None:
    result = []
    for line in original_fname.read_text().splitlines(keepends=True):
        if (r := replacements.get(line.strip())) is not None:
            result.append(r + "\n")
        else:
            result.append(line)
    target_fname.write_text("".join(result))


_RE_COMMENT = re.compile(r".*\s(?://|#)\s*(@.*)$")


def generic_shorten(text: str) -> str:
    """Generic implementation of Language.shorten().

    Removes comments with @hide annotation and trims excessive newlines.
    """
    result = []
    for line in text.splitlines():
        if (m := _RE_COMMENT.match(line)) is not None:
            if m[1] == "@hide":
                continue
            else:
                msg = f"Unknown annotation: {m[1]}"
                raise ValueError(msg)
        result.append(line + "\n")
    text = "".join(result)
    text = text.lstrip("\n").rstrip("\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    if text:
        text += "\n"
    return text


def trim_commonpath(fnames: list[Path]) -> dict[Path, Path]:
    """Trim the common path prefix from a list of file paths.

    Returns a mapping from original paths to trimmed paths.
    """
    common_prefix = os.path.commonpath(
        [(Path.cwd() / fname.parent) for fname in fnames]
    )
    result = {}
    for fname in fnames:
        trimmed = Path(os.path.relpath(fname, common_prefix))
        result[fname] = trimmed
    return result
