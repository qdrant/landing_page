# Snippet tools

This is a tool to work with code snippets.

1. Automated CI type checking of snippets.
2. Writing new snippets and checking/running/testing them locally.
   This tool hides the complexity of setting up every build system/dev env for each client.
   Also, it supports testing snippets against unreleased versions of clients (from git branches/PRs).


## Dependencies

To convert runnable snippets into markdown ([`generate-md.py`](./generate-md.py)) you need only python with no extra dependencies.

To typecheck/build snippets, you need a bunch of tools installed.
The all-in-one [`Dockerfile`](./docker/Dockerfile) and [`shell.nix`](./shell.nix) are provided.
Run [`./docker.sh`](./docker.sh) to start a shell in the docker container.

On ARM-based macOS, ensure that the Docker Desktop setting "General" > "Virtual Machine Options" > "Use Rosetta for x86\_64/amd64 emulation on Apple Silicon" is selected.
Note: on macOS, if you see Java compile failures related to `protobuf`, re-running the test will often solve those.


## Workflow: typechecking and running

Clone and build clients (latest git versions).
```bash
./sync-clients.py fetch --csharp --java --typescript
```

(optional) You might specify particular tags/branches/commits instead.
```bash
./sync-clients.py fetch --csharp=1.16.0 --java=b290b14892534fc0d76893d41b8f656855cd589b --typescript=main
```

(optional) Update the lockfiles for templates (see ./sync-clients.py lock --help for syntax).
```bash
./sync-clients.py lock --go=v1.16.0 --rust=branch=master --python=tag=v1.16.0
```

Typecheck/build all snippets or a particular language/snippet.
```bash
./check.py build
./check.py build -l csharp,java
./check.py build ./snippets/create-collection/simple
./check.py build ./snippets/create-collection/simple/go.go
```

Test all testable snippets against localhost Qdrant instance. (you start it yourself).
Testable snippets are the ones that have `test.py` file in the same directory.
```bash
./check.py test
```

Run a particular snippet without running a test.
```bash
./check.py run ./snippets/create-collection/simple/go.go
```


## Workflow: writing new snippets/converting old ones

Convert existing old markdown snippets.
```bash
./migrate-snippet.py ./snippets/create-collection/simple/go.md
```
Or create new snippets from scratch.

To reduce noise, you can hide boilerplate code using special comment:
```go
if err != nil { panic(err) } // @hide
```
The usual wrapping boileplate like `public static void run() throws Exception {` is already hidden by default.

Typecheck/build the snippet.
```bash
 ./check.py build ./snippets/create-collection/simple
```

(Optional) Start Qdrant and run the snippet.
```bash
./check.py run ./snippets/create-collection/simple/go.go
```

(Optional) Write `test.py` and test it.
```bash
./check.py test ./snippets/create-collection/simple
```

Before committing, regenerate markdown files.
If migrated, also delete old markdown files.
```bash
./generate-md.py
git rm ./snippets/create-collection/simple/go.md # if migrated
git add ./snippets/create-collection/simple/generated/go.md # made by generate-md.py
git add ./snippets/create-collection/simple/go.go
```


## Architecture

For each language, the snippet tester collects all code snippets from the [`snippets/`](../../qdrant-landing/content/documentation/headless/snippets) directory and puts them in a single scratch project in a temporary directory.
Then those projects are compiled/typechecked.
Putting all snippets in a single project rather than compiling them one by one saves time: some build systems like `gradle` take a lot of time to spin up.

Each supported language has:
- A template project in [`templates/`](./templates) directory.
- A Python subclass of `Language` in [`lib/languages/`](./lib/languages). It is responsible for:
  - Creating the scratch project from snippets and the template.
  - Building/typechecking the project.
  - Running a particular snippet for testing.
- A list of build dependencies in [`docker/Dockerfile`](./docker/Dockerfile) and [`shell.nix`](./shell.nix).
- A handler in [`sync-clients.py`](./sync-clients.py) to fetch the particular git revision of the client.
  - For Java, C#, Typescript it fetches the client sources to the `clients/` directory, and builds them.
    This directory is gitignored.
  - For Go, Rust, Python it updates the lockfile in the [`templates/`](./templates) directory.
    These lockfiles are checked in this repo.


## Quirks

Sometimes `mypy` (python typechecker) complains at valid code.
Place this comment at the top of the file to silence it:
```python
# mypy: disable-error-code="arg-type"
```
