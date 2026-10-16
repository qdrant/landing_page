#!/usr/bin/env python3
"""Publish the Qdrant agent skills on qdrant.tech for Agent Skills discovery.

Copies every skill listed in https://skills.qdrant.tech/llms.txt to
public/.well-known/agent-skills/<name>/SKILL.md and writes the index an agent
looks for at /.well-known/agent-skills/index.json, in the format of the Agent
Skills Discovery draft (https://github.com/cloudflare/agent-skills-discovery-rfc,
schema 0.2.0).

The files are copied rather than linked because each index entry carries the
SHA-256 of the file it points at. A digest of a file on another host goes stale
the moment that host updates, while a copy served next to the index matches it
for the life of the deploy.

skills.qdrant.tech stays the source of truth, as it is for check-skill-links.sh.
If it cannot be reached, or lists nothing, this prints a warning and publishes
nothing, so the site still deploys.

    scripts/emit-agent-skills.py public
"""

import hashlib
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path

CATALOG = "https://skills.qdrant.tech/llms.txt"
SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"
# `- [name](https://skills.qdrant.tech/.../SKILL.md): description`, at any indent.
ENTRY = re.compile(r"^\s*- \[([a-z0-9-]+)\]\((https://skills\.qdrant\.tech/[^)]+/SKILL\.md)\):\s*(.*)$")
NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read()


def main(public):
    out = Path(public) / ".well-known" / "agent-skills"
    try:
        catalog = fetch(CATALOG).decode("utf-8")
        skills = []
        files = {}
        for line in catalog.splitlines():
            match = ENTRY.match(line)
            if not match:
                continue
            name, url, description = match.groups()
            if not NAME.match(name) or len(name) > 64 or name in files:
                print(f"agent-skills: skipping {name!r}, not a valid or unique skill name", file=sys.stderr)
                continue
            body = fetch(url)
            files[name] = body
            skills.append({
                "name": name,
                "type": "skill-md",
                "description": description.strip()[:1024],
                "url": f"/.well-known/agent-skills/{name}/SKILL.md",
                "digest": "sha256:" + hashlib.sha256(body).hexdigest(),
            })
    except OSError as error:
        print(f"agent-skills: WARNING: could not read the catalog, publishing nothing: {error}", file=sys.stderr)
        return 0

    if not skills:
        print(f"agent-skills: WARNING: {CATALOG} lists no skills, publishing nothing", file=sys.stderr)
        return 0

    shutil.rmtree(out, ignore_errors=True)
    for name, body in files.items():
        (out / name).mkdir(parents=True)
        (out / name / "SKILL.md").write_bytes(body)
    index = {"$schema": SCHEMA, "skills": skills}
    (out / "index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"agent-skills: published {len(skills)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_dir():
        sys.exit("usage: emit-agent-skills.py <public dir>")
    sys.exit(main(sys.argv[1]))
