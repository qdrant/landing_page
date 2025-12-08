import re
import subprocess
from pathlib import Path

from .base import (
    CompileResult,
    Language,
    copy_template,
    generic_shorten,
    trim_commonpath,
)

RE_IMPORTS = re.compile(
    r"^from qdrant_client import (.*)$",
    re.MULTILINE,
)


class LanguagePython(Language):
    NAME = "python"
    SNIPPET_FILENAME = "python.py"

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        trimmed_fnames = trim_commonpath(fnames)
        result = CompileResult()

        for snippet_fname, trimmed_fname in trimmed_fnames.items():
            target_path = tmpdir / str(trimmed_fname).replace("-", "_")
            target_path.parent.mkdir(parents=True, exist_ok=True)
            dir = tmpdir
            for component in Path(str(trimmed_fname).replace("-", "_")).parts:
                (dir / "__init__.py").touch()
                dir /= component
            copy_template(snippet_fname, target_path)
            result.run_args[snippet_fname] = [
                "uv",
                "--project=templates/python",
                "run",
                target_path,
            ]

        p = subprocess.run(
            [
                "uv",
                "--project=templates/python",
                "run",
                "mypy",
                "--config-file=templates/python/pyproject.toml",
                tmpdir,
            ]
        )
        result.has_issues = p.returncode != 0

        return result

    @classmethod
    def shorten(cls, contents: str) -> str:
        lines = [
            line
            for line in contents.splitlines(keepends=True)
            if not line.lstrip().startswith("# mypy:")
        ]
        return generic_shorten("".join(lines))

    @classmethod
    def unshorten(cls, contents: str) -> str:
        if "client." in contents and "QdrantClient" not in contents:
            contents = (
                'client = QdrantClient(url="http://localhost:6333")  # @hide\n\n'
                + contents.lstrip()
            )

        has_imports = set()
        if m := RE_IMPORTS.search(contents):
            has_imports = set(i.strip() for i in m[1].split(","))

        need_imports = set()
        if "QdrantClient" in contents:
            need_imports.add("QdrantClient")
        if "models." in contents:
            need_imports.add("models")

        if need_imports - has_imports:
            if m is not None:
                contents = RE_IMPORTS.sub(
                    f"from qdrant_client import {', '.join(sorted(need_imports | has_imports))}",
                    contents,
                )
            else:
                contents = (
                    f"from qdrant_client import {', '.join(sorted(need_imports))}  # @hide\n\n"
                    + contents.lstrip()
                )

        return contents
