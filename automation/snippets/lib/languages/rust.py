import os
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


class LanguageRust(Language):
    NAME = "rust"
    SNIPPET_FILENAME = "rust.rs"

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        tmpdir.mkdir()
        (tmpdir / "src").mkdir()
        shutil.copyfile("templates/rust/Cargo.toml", f"{tmpdir}/Cargo.toml")
        shutil.copyfile("templates/rust/Cargo.lock", f"{tmpdir}/Cargo.lock")

        src_mods = []
        src_cases = []

        trimmed_fnames = trim_commonpath(fnames)

        result = CompileResult()
        binary_path = Path.cwd() / "templates/rust/target/debug/snippets-amalgamation"

        for no, (snippet_fname, trimmed_fname) in enumerate(trimmed_fnames.items()):
            copy_template(snippet_fname, tmpdir / "src" / "s" / trimmed_fname)
            src_mods.append(f'#[path = "s/{trimmed_fname}"] mod s{no};')
            src_cases.append(f'"{snippet_fname}" => s{no}::main().await.unwrap(),\n')
            result.run_args[snippet_fname] = [binary_path, snippet_fname]

        template(
            original_fname=Path("templates/rust/src/main.rs"),
            target_fname=tmpdir / "src/main.rs",
            replacements={
                "// %mods%": "\n".join(src_mods),
                "// %cases%": "\n".join(src_cases),
            },
        )

        subprocess.run(
            ["cargo", "build"],
            cwd=tmpdir,
            env={
                **os.environ,
                "CARGO_TARGET_DIR": str(Path.cwd() / "templates/rust/target"),
            },
            check=True,
        )

        return result

    @classmethod
    def format(cls, fnames: list[str]) -> None:
        subprocess.run(["rustfmt", "--edition=2024", *fnames], check=True)

    RE_CODE = re.compile(
        r"""
        (?P<uses> (?:use\s[^;]+;\n|\n)* )
        pub\s+async\s+fn\s+main\(\)\s*->\s*anyhow::Result<\(\)>\s*\{\n
        (?P<body> .*? )
        \s*Ok\(\(\)\)\n
        \}\n?
        $
        """,
        re.DOTALL | re.VERBOSE,
    )

    EXAMPLE_CODE = textwrap.dedent(
        """\
        use qdrant_client::Qdrant;

        pub async fn main() -> anyhow::Result<()> {
            // Your code here

            Ok(())
        }
        """
    )
    assert RE_CODE.match(EXAMPLE_CODE) is not None

    @classmethod
    def shorten(cls, contents: str) -> str:
        if (m := LanguageRust.RE_CODE.match(contents)) is None:
            msg = "Invalid snippet format"
            raise ValueError(msg)
        return generic_shorten(
            m["uses"].strip() + "\n\n" + textwrap.dedent(m["body"]).strip()
        )

    RE_RENDERED = re.compile(
        r"""
        (?P<uses> (?:use\s[^;]+;\n|\n)* )
        (?P<body> .* )
        $
        """,
        re.DOTALL | re.VERBOSE,
    )

    @classmethod
    def unshorten(cls, contents: str) -> str:
        if m := LanguageRust.RE_RENDERED.match(contents):
            return textwrap.dedent(
                """\
                {uses}

                pub async fn main() -> anyhow::Result<()> {{
                {body}

                    Ok(())
                }}
                """
            ).format(
                uses=m["uses"].strip(),
                body=textwrap.indent(m["body"].strip(), " " * 4),
            )
        return contents
