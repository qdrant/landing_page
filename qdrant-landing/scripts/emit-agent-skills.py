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
Each request is tried three times. If a request still fails, or the catalog
lists nothing:

- On a production deploy (Netlify sets CONTEXT=production) the build fails.
  Netlify then keeps the last good deploy live, skills included, where a
  deploy without them would take /.well-known/agent-skills/ down.
- Anywhere else this prints a warning and publishes nothing, so an outage of
  skills.qdrant.tech does not block a deploy preview.

    scripts/emit-agent-skills.py public
"""

import hashlib
import json
import os
import re
import shutil
import sys
import time
import urllib.request
from pathlib import Path

CATALOG = "https://skills.qdrant.tech/llms.txt"
SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"
# `- [name](https://skills.qdrant.tech/.../SKILL.md): description`, at any indent.
ENTRY = re.compile(r"^\s*- \[([a-z0-9-]+)\]\((https://skills\.qdrant\.tech/[^)]+/SKILL\.md)\):\s*(.*)$")
NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def fetch(url, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                return response.read()
        except OSError as error:
            if attempt == attempts:
                raise
            print(f"agent-skills: retrying {url} after: {error}", file=sys.stderr)
            time.sleep(2 * attempt)


def give_up(reason):
    if os.environ.get("CONTEXT") == "production":
        print(f"agent-skills: ERROR: {reason}; failing the production build so the last deploy stays live", file=sys.stderr)
        return 1
    print(f"agent-skills: WARNING: {reason}; publishing nothing", file=sys.stderr)
    return 0


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
        return give_up(f"could not fetch the skills: {error}")

    if not skills:
        return give_up(f"{CATALOG} lists no skills")

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
