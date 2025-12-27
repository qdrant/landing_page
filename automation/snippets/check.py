#!/usr/bin/env python3

import argparse
import importlib.util
import shutil
import subprocess
import sys
import traceback
import types
import typing
from pathlib import Path

from lib import SNIPPETS_DIR, CollectedSnippetsType, collect_snippets, log
from lib.languages import ALL_LANGUAGES, CompileResult, Language, parse_languages


def main() -> None:
    parser = argparse.ArgumentParser()
    default_langs = ",".join([lang.NAME for lang in ALL_LANGUAGES])

    parser.add_argument(
        "-l",
        "--langs",
        help=f"comma-separated list of languages, default is {default_langs}",
        default=default_langs,
    )
    parser.add_argument(
        "command",
        help="command to execute",
        choices=["build", "run", "test"],
    )
    parser.add_argument(
        "snippets",
        nargs="*",
        help=f"Snippet filenames/directories to process, default: {SNIPPETS_DIR}",
        default=[SNIPPETS_DIR],
        type=Path,
        metavar="SNIPPET_PATH",
    )

    args = parser.parse_args()

    languages = parse_languages(args.langs)
    snippets = collect_snippets(args.snippets, languages)
    assert args.command in ("build", "run", "test")

    # Q: Why not `tempfile.TemporaryDirectory()`?
    # A: Harder to debug/inspect generated files.
    tmpdir = Path(__file__).parent / "tmp"
    shutil.rmtree(tmpdir, ignore_errors=True)
    tmpdir.mkdir(parents=True)
    build_and_run(tmpdir=tmpdir, snippets=snippets, mode=args.command)


def build_and_run(
    tmpdir: Path,
    snippets: CollectedSnippetsType,
    mode: typing.Literal[
        "build",  # just build
        "run",  # build and run each snippet
        "test",  # build, then run/test all snippets that have a test.py file
    ],
) -> None:
    snippets_by_lang: dict[type[Language], list[Path]] = {}

    for snippets2 in snippets.values():
        for lang, fname in snippets2.items():
            snippets_by_lang.setdefault(lang, []).append(fname)

    compile_results: dict[type[Language], CompileResult] = {}
    errors: list[str] = []

    # Load test modules before compilation.
    # We want them to crash early.
    test_modules: dict[Path, types.ModuleType] = {}
    if mode == "test":
        for snippet_dir in snippets:
            test_file = snippet_dir / "test.py"
            if not test_file.exists():
                continue
            spec = importlib.util.spec_from_file_location("test_module", test_file)
            assert spec is not None
            mod = importlib.util.module_from_spec(spec)
            assert spec.loader is not None
            spec.loader.exec_module(mod)
            test_modules[snippet_dir] = mod

    log("Compile stage")
    for lang, fnames in snippets_by_lang.items():
        log(f"· Compiling {lang.NAME} snippets")
        try:
            res = lang.compile(tmpdir / lang.NAME, fnames)
            if res.has_issues:
                log(f"· · Compilation had issues for {lang.NAME}")
                errors.append(f"Compilation had issues for {lang.NAME}")
            compile_results[lang] = res
        except Exception as e:
            log(f"· · Compilation failed for {lang.NAME}")
            errors.append(f"Compilation failed for {lang.NAME}")
            if not isinstance(e, subprocess.CalledProcessError):
                traceback.print_exc()

    if mode in ("run", "test"):
        log("Run stage")
        for snippet_dir, snippets2 in snippets.items():
            if mode == "run":
                for lang, snippet_fname in snippets2.items():
                    if (compile_result := compile_results.get(lang)) is None:
                        continue

                    log(f"· Running {snippet_fname}")
                    p = subprocess.run(
                        compile_result.run_args[snippet_fname],
                        text=True,
                    )
                    if p.returncode != 0:
                        log(f"· · Exit code {p.returncode}")

            if mode == "test" and snippet_dir in test_modules:
                log(f"· Testing snippets in {snippet_dir}")
                mod = test_modules[snippet_dir]

                for lang, snippet_fname in snippets2.items():
                    compile_result = compile_results.get(lang)
                    if compile_result is None:
                        continue

                    log(f"· · Testing {snippet_fname}")

                    output = None
                    try:
                        if hasattr(mod, "prepare"):
                            mod.prepare()

                        p = subprocess.run(
                            compile_result.run_args[snippet_fname],
                            stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            text=True,
                        )

                        output = p.stdout
                        if p.returncode != 0:
                            msg = f"Process exited with code {p.returncode}"
                            raise RuntimeError(msg)

                        if hasattr(mod, "check"):
                            mod.check()
                    except Exception:
                        log(f"· · · Testing {snippet_fname} failed")
                        if output:
                            print(output.rstrip())
                        traceback.print_exc()
                        errors.append(f"Testing {snippet_fname} failed")
                    finally:
                        try:
                            if hasattr(mod, "cleanup"):
                                mod.cleanup()
                        except Exception:
                            log(f"· · · Teardown for {snippet_fname} failed")
                            errors.append(f"Teardown for {snippet_fname} failed")
                            traceback.print_exc()

    if errors:
        log("Errors encountered:")
        for err in errors:
            log(f"· {err}")
        sys.exit(1)
    else:
        log("All done without errors.")


if __name__ == "__main__":
    main()
