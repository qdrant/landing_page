import re
import shutil
import subprocess
import textwrap
from pathlib import Path

from .base import (
    CompileResult,
    Language,
    copy_template,
    generic_shorten,
    template,
    trim_commonpath,
)

_RE_HEADER_LINE = re.compile(r"^(import|type|func)\b")


def _split_header_body(contents: str) -> tuple[str, str]:
    """Split shortened Go code into leading package-level declarations
    (imports, types, helper funcs) and the remaining statements that belong
    inside `func Main()`.

    `shorten()`/`generic_shorten()` flatten these together and dedent
    everything to column 0, so indentation alone can no longer tell them
    apart. Helper declarations always come first (`shorten()`'s `RE_CODE`
    requires `func Main()` to be the last top-level declaration), so this
    scans for the first line, outside of any brackets, that isn't the start
    of an `import`/`type`/`func` declaration and treats everything from
    there onward as the body.
    """
    lines = contents.splitlines(keepends=True)
    depth = 0
    header_end = 0
    for i, line in enumerate(lines):
        if depth == 0:
            stripped = line.strip()
            if stripped and _RE_HEADER_LINE.match(stripped) is None:
                break
        depth += line.count("{") + line.count("(")
        depth -= line.count("}") + line.count(")")
        header_end = i + 1
    return "".join(lines[:header_end]), "".join(lines[header_end:])


class LanguageGo(Language):
    NAME = "go"
    SNIPPET_FILENAME = "go.go"
    SUPPORTS_SYNTAX_CHECK = True

    @classmethod
    def check_syntax(cls, code: str) -> None:
        subprocess.run(
            ["gofmt", "-e"],
            input=cls.unshorten(code),
            text=True,
            check=True,
            stdout=subprocess.DEVNULL,
        )

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        shutil.copytree("templates/go", tmpdir)

        trimmed_fnames = trim_commonpath(fnames)

        src_imports = []
        src_cases = []

        result = CompileResult()

        for no, (snippet_fname, trimmed_fname) in enumerate(trimmed_fnames.items()):
            dest_path = tmpdir / "s" / trimmed_fname
            copy_template(snippet_fname, dest_path)
            src_imports.append(
                f's{no} "example.com/snippets-amalgamation/{("s" / trimmed_fname).parent}"'
            )
            src_cases.append(f'case "{snippet_fname}": s{no}.Main()\n')
            result.run_args[snippet_fname] = [tmpdir / "tester", snippet_fname]

        template(
            original_fname=Path("templates/go/main.go"),
            target_fname=tmpdir / "main.go",
            replacements={
                "// %imports%": "\n".join(src_imports),
                "// %cases%": "\n".join(src_cases),
            },
        )

        subprocess.run(
            ["go", "build", "-buildvcs=false", "-o", "tester", "."],
            cwd=tmpdir,
            check=True,
        )

        return result

    RE_CODE = re.compile(
        r"""
        package\ [a-zA-Z0-9_]+\n
        (?P<imports> .*? )
        func\ Main\(\)\ \{\n
        (?P<body> .*? )
        \}\s*$
        """,
        re.DOTALL | re.VERBOSE,
    )

    EXAMPLE_CODE = textwrap.dedent(
        """\
        package main

        import (
            "github.com/qdrant/go-client/qdrant"
        )

        func Main() {
            // Your code here
        }
        """
    )
    assert RE_CODE.match(EXAMPLE_CODE) is not None

    @classmethod
    def shorten(cls, contents: str) -> dict[str, str]:
        if (m := LanguageGo.RE_CODE.match(contents)) is None:
            msg = "Invalid snippet format"
            raise ValueError(msg)
        return generic_shorten(
            m["imports"].strip() + "\n\n" + textwrap.dedent(m["body"]).strip()
        )

    @classmethod
    def format(cls, fnames: list[str]) -> None:
        subprocess.run(["gofmt", "-w", *fnames], check=True)

    @classmethod
    def unshorten(cls, contents: str) -> str:
        header, body = _split_header_body(contents)
        return textwrap.dedent(
            """\
            package snippet

            {header}

            func Main() {{
            {body}
            }}
            """
        ).format(
            header=header.strip(),
            body=textwrap.indent(body.strip(), "\t"),
        )
