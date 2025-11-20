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


class LanguageGo(Language):
    NAME = "go"
    SNIPPET_FILENAME = "go.go"

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

        subprocess.run(["go", "build", "-o", "tester", "."], cwd=tmpdir, check=True)

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
    def shorten(cls, contents: str) -> str:
        if (m := LanguageGo.RE_CODE.match(contents)) is None:
            msg = "Invalid snippet format"
            raise ValueError(msg)
        return generic_shorten(
            m["imports"].strip() + "\n\n" + textwrap.dedent(m["body"]).strip()
        )

    @classmethod
    def format(cls, fnames: list[str]) -> None:
        subprocess.run(["gofmt", "-w", *fnames], check=True)

    RE_RENDERED = re.compile(
        r"""
        (?P<imports> (?:import\s*\([^)]+\)\n|\n)* )
        (?P<body> .* )
        $
        """,
        re.DOTALL | re.VERBOSE,
    )

    @classmethod
    def unshorten(cls, contents: str) -> str:
        if m := LanguageGo.RE_RENDERED.match(contents):
            return textwrap.dedent(
                """\
                package snippet

                {imports}

                func Main() {{
                {body}
                }}
                """
            ).format(
                imports=m["imports"].strip(),
                body=textwrap.indent(m["body"].strip(), "\t"),
            )
        return contents
