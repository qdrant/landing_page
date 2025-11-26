import re
import shutil
import subprocess
import textwrap
from pathlib import Path

from .base import CompileResult, Language, generic_shorten, template, trim_commonpath


class LanguageCsharp(Language):
    NAME = "csharp"
    SNIPPET_FILENAME = "csharp.cs"

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        shutil.copytree("templates/csharp", tmpdir)

        csproj_path = tmpdir / "csharp.csproj"
        csproj_path.write_text(
            csproj_path.read_text().replace(
                "../../clients/csharp/",
                f"{Path('clients/csharp').absolute()}/",
            )
        )

        trimmed_fnames = trim_commonpath(fnames)

        src_cases = []

        result = CompileResult()

        for no, (snippet_fname, trimmed_fname) in enumerate(trimmed_fnames.items()):
            content = (
                snippet_fname.read_text()
                .replace("public class Snippet", f"public class Snippet{no}")
                .replace("{collection_name}", "collection_name")
            )
            dest_path = tmpdir / "s" / trimmed_fname.parent / f"Snippet{no}.cs"
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_text(content)
            src_cases.append(
                f'case "{snippet_fname}": await Snippet{no}.Run(); break;\n'
            )
            result.run_args[snippet_fname] = [
                "dotnet",
                f"{tmpdir}/bin/snippets-amalgamation.dll",
                snippet_fname,
            ]

        template(
            original_fname=Path("templates/csharp/Program.cs"),
            target_fname=tmpdir / "Program.cs",
            replacements={"// %cases%": "".join(src_cases)},
        )

        subprocess.run(["dotnet", "build", "-o", "bin"], cwd=tmpdir, check=True)

        return result

    RE_CODE = re.compile(
        r"""
        (?P<imports> .*? )
        \s*public\ class\ Snippet\s*\{\s*
        public\ static\ async\ Task\ Run\(\)\s*\{\n
        (?P<body> .*? )
        \s*\}\s*}\s*
        $
        """,
        re.DOTALL | re.VERBOSE,
    )

    EXAMPLE_CODE = textwrap.dedent(
        """\
        using Qdrant.Client;
        using Qdrant.Client.Grpc;

        public class Snippet
        {
            public static async Task Run()
            {
                // Your code here
            }
        }
        """
    )
    assert RE_CODE.match(EXAMPLE_CODE) is not None

    @classmethod
    def shorten(cls, contents: str) -> str:
        if (m := LanguageCsharp.RE_CODE.match(contents)) is None:
            msg = "Invalid snippet format"
            raise ValueError(msg)
        return generic_shorten(
            m["imports"].strip() + "\n\n" + textwrap.dedent(m["body"]).strip()
        )

    RE_RENDERED = re.compile(
        r"""
        (?P<imports> (?:using\s[^;]+;\n|\n)* )
        (?P<body> .* )
        $
        """,
        re.DOTALL | re.VERBOSE,
    )

    @classmethod
    def unshorten(cls, contents: str) -> str:
        if m := LanguageCsharp.RE_RENDERED.match(contents):
            return textwrap.dedent(
                """\
                {imports}

                public class Snippet
                {{
                \tpublic static async Task Run()
                \t{{
                {body}
                \t}}
                }}
                """
            ).format(
                imports=m["imports"].strip(),
                body=textwrap.indent(m["body"].strip(), "\t" * 2),
            )
        return contents
