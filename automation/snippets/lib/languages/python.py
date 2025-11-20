import subprocess
from pathlib import Path

from .base import CompileResult, Language, copy_template, trim_commonpath


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

        p = subprocess.run(["uv", "--project=templates/python", "run", "mypy", tmpdir])
        result.has_issues = p.returncode != 0

        return result
