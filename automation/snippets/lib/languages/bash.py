import os
from pathlib import Path

from .base import CompileResult, Language, copy_template


class LanguageBash(Language):
    NAME = "bash"
    SNIPPET_FILENAME = "bash.sh"

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        os.makedirs(tmpdir)
        result = CompileResult()
        for no, fname in enumerate(fnames):
            copy_template(fname, tmpdir / f"snippet{no}.sh")
            result.run_args[fname] = ["bash", "-ex", f"{tmpdir}/snippet{no}.sh"]
        return result
