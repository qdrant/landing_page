import os
import re
import shutil
import subprocess
import textwrap
from pathlib import Path

from .base import CompileResult, Language, generic_shorten, template, trim_commonpath


class LanguageJava(Language):
    NAME = "java"
    SNIPPET_FILENAME = "java.java"

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        (tmpdir / "src/main/java/s").mkdir(parents=True)
        shutil.copyfile("templates/java/build.gradle", f"{tmpdir}/build.gradle")
        shutil.copyfile("templates/java/settings.gradle", f"{tmpdir}/settings.gradle")

        trimmed_fnames = trim_commonpath(fnames)

        result = CompileResult()
        src_cases = []

        for no, (snippet_fname, trimmed_fname) in enumerate(trimmed_fnames.items()):
            content = (
                snippet_fname.read_text()
                .replace("public class Snippet", f"public class Snippet{no}")
                .replace("{collection_name}", "collection_name")
            )
            dest_path = (
                tmpdir / "src/main/java/s" / trimmed_fname.parent / f"Snippet{no}.java"
            )
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_text(content)
            src_cases.append(f'case "{snippet_fname}": Snippet{no}.run(); break;\n')
            result.run_args[snippet_fname] = [
                "java",
                "-jar",
                f"{tmpdir}/build/libs/app-1.0.0-all.jar",
                snippet_fname,
            ]

        template(
            original_fname=Path("templates/java/src/main/java/Main.java"),
            target_fname=tmpdir / "src/main/java/Main.java",
            replacements={
                "// %cases%": "\n".join(src_cases),
            },
        )

        gradlew = os.path.abspath("templates/java/gradlew")
        client = os.path.abspath("clients/java")
        subprocess.run(
            [gradlew, "--no-daemon", f"-PclientPath={client}", "shadowJar"],
            cwd=tmpdir,
            check=True,
        )

        return result

    RE_CODE = re.compile(
        r"""
        package\s[a-zA-Z0-9_.]+;\n
        (?P<imports> .*? )
        \s*public\ class\ Snippet\ \{\n
        \s*public\ static\ void\ run\(\)\ throws\ Exception\ \{\n
        (?P<body> .*? )
        \s*\}\s*}\s*
        $
        """,
        re.DOTALL | re.VERBOSE,
    )

    EXAMPLE_CODE = textwrap.dedent(
        """\
        package com.example.snippets_amalgamation;

        import io.qdrant.client.QdrantClient;

        public class Snippet {
            public static void run() throws Exception {
                // Your code here
            }
        }
        """
    )
    assert RE_CODE.match(EXAMPLE_CODE) is not None

    @classmethod
    def shorten(cls, contents: str) -> str:
        if (m := LanguageJava.RE_CODE.match(contents)) is None:
            msg = "Invalid snippet format"
            raise ValueError(msg)
        return generic_shorten(
            m["imports"].strip() + "\n\n" + textwrap.dedent(m["body"]).strip()
        )

    RE_RENDERED = re.compile(
        r"""
        (?P<imports> (?: import\s[^;]+;\n|\n)* )
        (?P<body> .* )
        $
        """,
        re.DOTALL | re.VERBOSE,
    )

    @classmethod
    def unshorten(cls, contents: str) -> str:
        if m := LanguageJava.RE_RENDERED.match(contents):
            return textwrap.dedent(
                """\
                package com.example.snippets_amalgamation;

                {imports}

                public class Snippet {{
                        public static void run() throws Exception {{
                {body}
                        }}
                }}
                """
            ).format(
                imports=m["imports"].strip(),
                body=textwrap.indent(m["body"].strip(), " " * 16),
            )
        return contents
