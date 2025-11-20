import json
import shutil
import subprocess
from pathlib import Path

from .base import CompileResult, Language, copy_template, trim_commonpath


class LanguageTypescript(Language):
    NAME = "typescript"
    SNIPPET_FILENAME = "typescript.ts"

    @classmethod
    def compile(cls, tmpdir: Path, fnames: list[Path]) -> CompileResult:
        tmpdir.mkdir()

        package_data = json.loads(Path("templates/typescript/package.json").read_text())

        package_data["dependencies"]["@qdrant/js-client-rest"] = "file:" + str(
            Path("clients/typescript/packages/js-client-rest").resolve().absolute()
        )
        (tmpdir / "package.json").write_text(json.dumps(package_data, indent=2))

        shutil.copyfile(
            "templates/typescript/package-lock.json", f"{tmpdir}/package-lock.json"
        )

        trimmed_fnames = trim_commonpath(fnames)
        result = CompileResult()

        for snippet_fname, trimmed_fname in trimmed_fnames.items():
            dest_path = tmpdir / "s" / trimmed_fname
            copy_template(snippet_fname, dest_path)
            result.run_args[snippet_fname] = ["node", dest_path.with_suffix(".js")]

        p = subprocess.run(["npm", "install"], cwd=tmpdir)
        if p.returncode != 0:
            result.has_issues = True
            return result

        p = subprocess.run(
            ["node_modules/.bin/tsc"]
            + ["s" / trimmed_fname for trimmed_fname in trimmed_fnames.values()],
            cwd=tmpdir,
        )
        result.has_issues = p.returncode != 0

        return result

    @classmethod
    def format(cls, fnames: list[str]) -> None:
        # subprocess.run(["npx", "prettier", "--write", *fnames], check=True)
        pass
