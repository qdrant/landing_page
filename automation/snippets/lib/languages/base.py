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
    def shorten(cls, contents: str) -> dict[str, str]:
        """Shorten the snippet contents into a form suitable for inclusion in
        documentation. Also splits the snippet into blocks.

        Removes boilerplate code, e.g. class wrappers, main functions, etc.
        Returns mapping `block_name` -> `block_contents`.
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


_RE_COMMENT = re.compile(
    r"""
    ^
    (?P<code> .*\s | )       # code before comment
    (?: // | \# )            # comment start
    \s*
    (?P<annotation> @\S+ )
    (?P<param> \s+ .* )?
    $
    """,
    re.VERBOSE,
)


def generic_shorten(text: str) -> dict[str, str]:
    """Generic implementation of Language.shorten().

    Processes annotation comments (@hide, @block-start, etc.), trims excessive
    newlines, and splits into blocks.
    """
    blocks = {
        # empty string is the default block (does not live in a subdirectory)
        "": []
    }
    current_blocks = [""]
    hide_mode = False
    for line in text.splitlines():
        if (m := _RE_COMMENT.match(line)) is None:
            if not hide_mode:
                for block in current_blocks:
                    blocks[block].append(line + "\n")
            continue

        has_code = m["code"].strip() != ""
        annotation = m["annotation"]
        param = m["param"].strip() if m["param"] is not None else ""
        if annotation == "@hide":
            if not has_code:
                raise ValueError("Hiding empty line is not allowed")
            if hide_mode:
                raise ValueError("@hide inside @hide-start/@hide-end is not allowed")
            if param:
                raise ValueError("@hide should not be followed by any parameters")
        elif annotation == "@hide-start":
            if has_code:
                raise ValueError("@hide-start should be on its own line")
            if hide_mode:
                raise ValueError("Nesting @hide-start is not allowed")
            if param:
                raise ValueError("@hide-start should not be followed by any parameters")
            hide_mode = True
        elif annotation == "@hide-end":
            if has_code:
                raise ValueError("@hide-end should be on its own line")
            if not hide_mode:
                raise ValueError("@hide-end without matching @hide-start")
            if param:
                raise ValueError("@hide-end should not be followed by any parameters")
            hide_mode = False
        elif annotation == "@block-start":
            if has_code:
                raise ValueError("@block-start should be on its own line")
            if param:
                current_blocks.append(param)
                blocks[param] = []
            else:
                raise ValueError("@block-start should be followed by block name")
        elif annotation == "@block-end":
            if has_code:
                raise ValueError("@block-end should be on its own line")
            if param:
                current_blocks.remove(param)
            else:
                raise ValueError("@block-end should be followed by block name")
        else:
            raise ValueError(f"Unknown annotation: {annotation}")
    if hide_mode:
        raise ValueError("Unclosed @hide-start")

    snippets = {}
    for key in blocks.keys():
        text = "".join(blocks[key])
        text = text.lstrip("\n").rstrip("\n")
        text = re.sub(r"\n{3,}", "\n\n", text)
        if text:
            text += "\n"
        snippets[key] = text
    return snippets


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
