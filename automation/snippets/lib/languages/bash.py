import subprocess
from pathlib import Path

from .base import CompileResult, Language, copy_template


class LanguageBash(Language):
    NAME = "bash"
    SNIPPET_FILENAME = "bash.sh"
    SUPPORTS_SYNTAX_CHECK = True

    @classmethod
    def check_syntax(cls, code: str) -> None:
        subprocess.run(["bash", "-n"], input=code, text=True, check=True)

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        tmpdir.mkdir(parents=True)
        result = CompileResult()
        for no, fname in enumerate(fnames):
            copy_template(fname, tmpdir / f"snippet{no}.sh")
            result.run_args[fname] = ["bash", "-ex", f"{tmpdir}/snippet{no}.sh"]
        return result
