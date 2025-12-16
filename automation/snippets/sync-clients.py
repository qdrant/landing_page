#!/usr/bin/env python3

import argparse
import re
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Change these to use different revisions by default/on CI
CSHARP_CLIENT_REVISION = "main"
JAVA_CLIENT_REVISION = "master"
TYPESCRIPT_CLIENT_REVISION = "master"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch and prepare Qdrant client libraries."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    fetch_parser = subparsers.add_parser(
        "fetch",
        help="""Fetch client libraries and put them in the clients/ directory.
             This is for java and C# clients.""",
    )
    fetch_parser.add_argument(
        "--csharp",
        help="Fetch and build the C# client.",
        nargs="?",
        const=CSHARP_CLIENT_REVISION,
        metavar="GIT_REV",
    )
    fetch_parser.add_argument(
        "--java",
        help="Fetch the Java client.",
        nargs="?",
        const=JAVA_CLIENT_REVISION,
        metavar="GIT_REV",
    )
    fetch_parser.add_argument(
        "--typescript",
        help="Fetch the TypeScript client.",
        nargs="?",
        const=TYPESCRIPT_CLIENT_REVISION,
        metavar="GIT_REV",
    )

    lock_parser = subparsers.add_parser(
        "lock",
        help="Update lockfiles for templates/ directories.",
    )
    lock_parser.add_argument(
        "--go",
        help="Set Go client version",
        nargs="?",
        const="master",
        metavar="GIT_REV",
    )
    lock_parser.add_argument(
        "--rust",
        help="""Set Rust client version.
             Format: branch=BRANCH_NAME or tag=TAG_NAME or rev=COMMIT_HASH""",
        nargs="?",
        const="branch=master",
        metavar="KIND=REV",
    )
    lock_parser.add_argument(
        "--python",
        help="""Set Python client version.
             Format: branch=BRANCH_NAME or tag=TAG_NAME or rev=COMMIT_HASH""",
        nargs="?",
        const="branch=master",
        metavar="KIND=REV",
    )

    args = parser.parse_args()

    ok = False
    if args.command == "fetch":
        if args.csharp is not None:
            url = "https://github.com/qdrant/qdrant-dotnet"
            dir = BASE_DIR / "clients" / "csharp"
            checkout_repo(url, dir, args.csharp)
            prepare_csharp(dir)
            ok = True
        if args.java is not None:
            url = "https://github.com/qdrant/java-client"
            dir = BASE_DIR / "clients" / "java"
            checkout_repo(url, dir, "master")
            ok = True
        if args.typescript is not None:
            url = "https://github.com/qdrant/qdrant-js"
            dir = BASE_DIR / "clients" / "typescript"
            checkout_repo(url, dir, args.typescript)
            prepare_typescript(dir)
            ok = True
        if not ok:
            print("Specify at least one of --csharp, --java, --typescript to fetch.")
    elif args.command == "lock":
        if args.go is not None:
            lock_go(args.go)
            ok = True
        if args.rust is not None:
            lock_rust(args.rust)
            ok = True
        if args.python is not None:
            lock_python(args.python)
            ok = True
        if not ok:
            print("Specify at least one of --go, --rust to lock.")


def prepare_csharp(dir: Path) -> None:
    subprocess.run(["git", "-C", dir, "clean", "-fxd"], check=True)
    subprocess.run(
        ["dotnet", "run", "--project", "build", "--", "download-protos", "restore"],
        check=True,
        cwd=dir,
    )
    subprocess.run(
        ["dotnet", "build", "-c", "Release", "--nologo"],
        check=True,
        cwd=dir,
    )


def prepare_typescript(dir: Path) -> None:
    subprocess.run(["pnpm", "install"], cwd=dir, check=True)
    subprocess.run(["pnpm", "-r", "build"], cwd=dir, check=True)


def lock_go(rev: str) -> None:
    dir = BASE_DIR / "templates" / "go"
    subprocess.run(
        ["go", "get", f"github.com/qdrant/go-client@{rev}"], cwd=dir, check=True
    )
    subprocess.run(["go", "mod", "tidy"], cwd=dir, check=True)


def lock_rust(spec: str) -> None:
    dir = BASE_DIR / "templates" / "rust"
    update_toml_spec(dir / "Cargo.toml", spec)
    subprocess.run(["cargo", "update", "-p", "qdrant-client"], cwd=dir, check=True)


def lock_python(spec: str) -> None:
    dir = BASE_DIR / "templates" / "python"
    update_toml_spec(dir / "pyproject.toml", spec)
    subprocess.run(["uv", "lock"], cwd=dir, check=True)


def update_toml_spec(path: Path, spec: str) -> None:
    try:
        kind, rev = spec.split("=", 1)
        if kind not in ("branch", "tag", "rev"):
            raise ValueError
    except ValueError:
        print("Invalid format for --rust/--python.")
        print("Use branch=BRANCH_NAME or tag=TAG_NAME or rev=COMMIT_HASH.")
        sys.exit(1)

    toml_content = path.read_text().splitlines()
    re_line = re.compile(r'^(qdrant-client = \{ git = "[^"]+").*$')
    idx, m = next(
        (i, m)
        for i, line in enumerate(toml_content)
        if (m := re_line.match(line)) is not None
    )

    toml_content[idx] = f'{m[1]}, {kind} = "{rev}" }}'
    path.write_text("\n".join(toml_content) + "\n")


def checkout_repo(
    repo_url: str,
    dest_dir: Path,
    rev: str,
) -> None:
    if not dest_dir.exists():
        print(f"Cloning repository from {repo_url} to {dest_dir}...")
        subprocess.run(["git", "clone", repo_url, dest_dir], check=True)
    else:
        print(f"Repository already exists at {dest_dir}. Fetching latest changes...")
        subprocess.run(["git", "-C", dest_dir, "fetch", "-p", "origin"], check=True)

    # Try remote branch first (ignore local branches)
    # If this check fails, it's either a commit hash, local branch, or tag
    p = subprocess.run(
        ["git", "-C", dest_dir, "rev-parse", "--verify", f"refs/remotes/origin/{rev}"],
        stdout=subprocess.PIPE,
        text=True,
    )
    if p.returncode == 0:
        rev = p.stdout.strip()

    subprocess.run(["git", "-C", dest_dir, "checkout", "--detach", rev], check=True)


if __name__ == "__main__":
    main()
