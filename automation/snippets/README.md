# Snippet tools

This is a tool to work with code snippets.

1. Automated CI type checking of snippets.
2. Writing new snippets and checking/running/testing them locally.
   This tool hides the complexity of setting up every build system/dev env for each client.
   Also, it supports testing snippets against unreleased versions of clients (from git branches/PRs).


## TL;DR

```bash
cd automation/snippets

# Fetch the latest clients
./docker.sh ./sync-clients.py fetch --csharp --java --typescript

# Test whether the snippets compile
./docker.sh ./check.py build

# Generate the Markdown files
./docker.sh ./generate-md.py
```

## Usage

Use this tooling to write snippets as runnable code, test their validity, and generate Markdown files from them.

Place your snippets as code files (for example, `python.py`) in the `qdrant-landing/content/documentation/headless/snippets/` directory. You can organize them in subdirectories. Some languages (like Java) require boilerplate code. This boilerplate code is automatically hidden in the generated Markdown files. Refer to existing snippets for examples.

After running `generate-md.py`, the generated Markdown files will be placed in the `generated/` subdirectory next to the code files. You can then include these generated Markdown files in your documentation using the `code-snippet` shortcode:

```
{{< code-snippet path="/documentation/headless/snippets/example/" >}}
```

The shortcode parameters (`path`, `order`, `block`) are described in the [Code Snippets Widget](../../README.md#-code-snippets-widget) section of the root README.

On rendered Markdown pages (the `index.md` docs mirror consumed by LLMs), the shortcode shows only the first language and links to a standalone all-languages page under `/documentation/snippets/...`. For snippets with [deployment variants](#deployment-variants-_server-_edge-_serverless), it shows the first language of the first variant, labeled with the variant name, and adds "Not supported on <variant>." for variants that have no snippet at all. The standalone pages are built on the fly from the `generated/` files by [`content/documentation/snippets/_content.gotmpl`](../../qdrant-landing/content/documentation/snippets/_content.gotmpl) and are not committed. A standalone page uses the snippet's `_description.md` as its description.

Your code may need some boilerplate code that you don't want to show in the generated Markdown files. You can hide such code by placing `// @hide` (or `# @hide` for Python) at the end of the line. Entire blocks of code can be hidden by placing `// @hide-start` and `// @hide-end` around the block.

You can generate multiple code snippets from one source file by defining "blocks" inside the code. This is useful for tutorials, where later code depends on classes and variables defined in earlier code. Each block becomes its own Markdown snippet, and a Markdown snippet is also generated for the entire file. Use `// @block-start block-name` and `// @block-end block-name` to define a block.

Include a block in your documentation using the `code-snippet` shortcode with the `block` parameter:

```
{{< code-snippet path="/documentation/headless/snippets/example/" block="block-name" >}}
```

# Example

The following Python code:

```python
some_boilerplate_initialization_code() # @hide

print("Hello")

# @block-start world
print("World")
# @block-end world

# @hide-start
some_boilerplate_cleanup_code()
# @hide-end
```

Results in the following directory structure:

```.
├── generated
│   └── python.md
│   └── world
│       └── python.md
├── python.py
```

with `generated/python.md` containing:

````
```python
print("Hello")

print("World")
```
````

and `generated/world/python.md` containing:

````
```python
print("World")
```
````

## Snippet directory layout

Each snippet directory holds one snippet in several languages:

| File | Language | Source |
|---|---|---|
| `python.py` | Python | Compiled, generates `generated/python.md` |
| `typescript.ts` | TypeScript | Compiled, generates `generated/typescript.md` |
| `rust.rs` | Rust | Compiled, generates `generated/rust.md` |
| `go.go` | Go | Compiled, generates `generated/go.md` |
| `java.java` | Java | Compiled, generates `generated/java.md` |
| `csharp.cs` | C# | Compiled, generates `generated/csharp.md` |
| `bash.sh` | Bash | Syntax-checked, generates `generated/bash.md` |
| `http.md` | HTTP | Hand-written |
| `json.md` | JSON | Hand-written |
| `_description.md` | | Description of the standalone snippet page |

- Never edit files in `generated/`. `generate-md.py` deletes and recreates every `generated/` directory.
- A hand-written `<lang>.md` must not sit next to a source file for the same language. `generate-md.py` reports this as an error.
- The shortcode ignores files whose names start with `_`.
- Hand-written snippets are a single fenced code block with no front matter.

## Deployment variants (`_server`, `_edge`, `_serverless`)

When a snippet differs per deployment type, put each version in its own subdirectory:

```
query-points/hybrid-rrf/
├── _description.md
├── _server/
│   ├── generated/
│   ├── http.md
│   ├── python.py
│   ├── rust.rs
│   └── ...
└── _edge/
    ├── generated/
    ├── python.py
    └── rust.rs
```

Each variant directory is a snippet directory of its own, with its own `generated/` directory. The shortcode call doesn't change; it still points at the parent directory.

How the shortcode renders variants:

- It shows the variants in the fixed order Qdrant Server, Qdrant Edge, Qdrant Serverless. A variant is shown when its directory contains `.md` files, either hand-written or in `generated/`.
- With two or more variants, it shows a "Deployment type" switcher. Qdrant Server is the default. The reader's choice is stored in the browser and applies to all snippets on the site.
- Once any variant directory exists, the shortcode ignores the files at the top level of the snippet directory. Move the existing files into `_server/` when you add `_edge/`, and don't leave copies behind.

Qdrant Edge snippets exist for Python and Rust, the languages that have an Edge SDK. An Edge snippet does the same thing as the matching server snippet.

When a feature has no direct Edge API, implement it with the APIs that exist instead of saying it's not supported. For example, search by ID becomes a `retrieve` followed by a `query`, and a lookup in another collection loads a second shard. Keep the main shard load hidden and the second shard load visible. Start the snippet with a comment like "Qdrant Edge doesn't support <feature>, but it can be implemented as follows.", followed by a short reason.

Only when the SDK lacks the API entirely, or it isn't released yet, add a `<lang>.md` file to the variant directory that contains plain text instead of a code block, for example `_edge/python.md` with:

```
Not supported for Python on Qdrant Edge
```

The shortcode renders such a file as a "not supported" message in that language's tab. This only works inside a variant directory.

## Snippet conventions

- Hide the client or shard initialization, unless the snippet is about initialization itself, such as connecting to Qdrant or loading a shard.
  - Use an inline `@hide` for a single line and `@hide-start`/`@hide-end` for several lines.
  - In Go, put `client, err := qdrant.NewClient(...)` and the `if err != nil { panic(err) }` that follows in one hidden block. Don't put an inline `@hide` inside a hidden block: `generate-md.py` rejects nested hides.
- Never hide imports, including client-only imports such as `from qdrant_client import QdrantClient`. Imports tell readers where names come from. When you edit a snippet that hides an import, remove the hide. The one exception is the `EdgeShard` import in Qdrant Edge snippets, which is hidden together with the shard load.
- For Qdrant Cloud connection examples, use `https://xyz-example.qdrant.io:6333` as the URL and `<your-api-key>` as the API key.
- Rust snippets must use the `pub async fn main() -> anyhow::Result<()>` signature, optionally preceded by `use` statements, and end with `Ok(())`.

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
`-l` accepts language names or file extensions, for example `-l py,ts`.
```bash
./check.py build
./check.py build -l csharp,java
./check.py build ./snippets/create-collection/simple
./check.py build ./snippets/create-collection/simple/go.go
```

Before building, `check.py` checks the syntax of the generated Markdown for Python, Rust, Go, and Bash. This catches problems that hiding lines can introduce.

Each language compiles all snippets as one project, so building everything costs little more than building a few snippets. Prefer a plain `./check.py build`. If you pass paths, check the log for "Warning: No snippets found": the checker still exits with success when a path matches nothing.

Test all testable snippets against localhost Qdrant instance. (you start it yourself).
Testable snippets are the ones that have `test.py` file in the same directory. Few snippets have one. A `test.py` can define `prepare()`, which runs before each language's snippet, `check()`, which runs after the snippet succeeds, and `cleanup()`, which always runs last.
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


## Workflow: snippets for an unreleased Qdrant version

Docs for the next Qdrant release live on a `version-X.Y` branch of this repository. The clients for that release aren't published yet, so write and test the snippets against their development branches.

1. Write the HTTP snippet first. It only depends on the REST API, so you can add it as soon as the feature is merged in Qdrant.
2. Write the client snippets once the clients have their release branches, usually about a week before the release. Branch names change from release to release and differ per client, so look them up, for example with `gh api repos/qdrant/<repo>/branches --paginate`. The Rust client has no version branch and uses `dev`. If a client has no release branch yet, derive the snippet from the gRPC definitions in the `dev` branch of [qdrant/qdrant](https://github.com/qdrant/qdrant/tree/dev/lib/api/src/grpc/proto). Most of each client is generated from those `.proto` files.
3. Test against the release branches locally. From `automation/snippets`, clear the cached Java build, then fetch and lock the clients at their release branches:
   ```bash
   rm -rf cache/.gradle clients/java/build clients/java/protos tmp
   ./docker.sh ./sync-clients.py fetch --java=<branch> --csharp=<branch> --typescript=<branch>
   ./docker.sh ./sync-clients.py lock --go=<branch> --rust=branch=<branch> --python=branch=<branch>
   ./docker.sh ./check.py build
   ```
4. After the clients are released, fetch the Java, C#, and TypeScript clients again at their default revisions, which CI also uses, lock the templates to the released versions, and build all snippets again:
   ```bash
   rm -rf cache/.gradle clients/java/build clients/java/protos tmp
   ./docker.sh ./sync-clients.py fetch --java --csharp --typescript
   ./docker.sh ./sync-clients.py lock --go=vX.Y.0 --python=tag=vX.Y.0 --rust=branch=master
   ./docker.sh ./check.py build
   ```
   Commit the updated lockfiles in `templates/`.


## Workflow: updating the Qdrant Edge version

Qdrant Edge isn't managed by `sync-clients.py`. To move the Edge snippets to a new Edge release, update the pinned version in both templates and refresh only that package in the lockfile:

- Python: set `qdrant-edge-py==X.Y.Z` in [`templates/python/pyproject.toml`](./templates/python/pyproject.toml), then run `uv lock --upgrade-package qdrant-edge-py` in `templates/python`.
- Rust: set `qdrant-edge = "X.Y.Z"` in [`templates/rust/Cargo.toml`](./templates/rust/Cargo.toml), then run `cargo update -p qdrant-edge --precise X.Y.Z` in `templates/rust`.


## CI

The [`snippets.yml`](../../.github/workflows/snippets.yml) workflow runs on pull requests that change files in `automation/snippets/` or in the snippets directory. It has two jobs:

- `convert-snippets` runs `generate-md.py` and fails if that changes any file. Run `generate-md.py` and commit the result before you push.
- `typecheck-snippets` runs `check.py build` against the default client revisions in `sync-clients.py` and the lockfiles in `templates/`.

Changes to `.md` files alone, such as `http.md`, don't trigger the workflow.

The `skip snippet check` label skips the `typecheck-snippets` job on pull requests that don't target `master`. It never skips `convert-snippets`.


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

- Sometimes `mypy` (python typechecker) complains at valid code.
  Place this comment at the top of the file to silence it:
  ```python
  # mypy: disable-error-code="arg-type"
  ```
  Qdrant Edge snippets use `# mypy: ignore-errors`. Lines starting with `# mypy:` are removed from the generated Markdown.
- On MacOS, if you see Java compile errors like this:
  ```
  > java.io.IOException: Cannot run program "/workspace/automation/snippets/cache/.gradle/caches/modules-2/files-2.1/com.google.protobuf/protoc/3.25.5/601137f5367caaf202a28e3844dd6dbbc77b19af/protoc-3.25.5-linux-x86_64.exe": Exec failed, error: 13 (Permission denied)
  ```
  Explicitly set the executable bit on the reported file, for example (from `automation/snippets`):
  ```bash
  chmod a+x ./cache/.gradle/caches/modules-2/files-2.1/com.google.protobuf/protoc/3.25.5/601137f5367caaf202a28e3844dd6dbbc77b19af/protoc-3.25.5-linux-x86_64.exe
  ```
