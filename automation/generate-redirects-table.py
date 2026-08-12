#!/usr/bin/env python3
"""Merge every redirect table qdrant.tech has into one publicly fetchable file.

Netlify applies three separate redirect tables for qdrant.tech:

  1. qdrant-landing/static/_redirects  -- hand-written, order-sensitive
  2. netlify.toml [[redirects]]        -- hand-written
  3. Hugo `aliases:` front matter      -- built into meta-refresh HTML stubs

Only the first is a file, none of the three is served over HTTP (both
/_redirects and /netlify.toml return 404), and the third only ever produces
HTML -- Hugo writes an alias as index.html with no index.md beside it. So
anything that mirrors the site without going through the CDN -- the /md/ route
on search.qdrant.tech -- has no way to learn that a path moved, and 404s old
paths that qdrant.tech redirects correctly.

This script merges all three into one file in _redirects syntax and writes it
into the built site as redirects.txt, where it is publicly fetchable. Run it
after `hugo`, from the repository root.

Alias targets are read back out of the built HTML rather than the front matter
on purpose: 75 of the 259 alias entries are relative (`../tutorials/x`, `how-to`,
`aws-marketplace`), and only Hugo knows what those resolve to.

The output is *not* read by Netlify -- redirects.txt is an inert static file.
Pass --augment-netlify-redirects to additionally append the derived rules to
public/_redirects, which makes qdrant.tech itself honour alias paths for .md
requests. That changes live CDN behaviour, so it is off by default; test it on
a deploy preview first.
"""

import argparse
import os
import re
import sys
from urllib.parse import urlsplit

DEFAULT_STATUS = "301"  # Netlify's default when a _redirects line omits it

# A Hugo alias stub is a ~300 byte document whose entire body is a meta refresh.
# Cap the size and require both marker tags so a real page that happens to use
# a refresh header can never be mistaken for one.
ALIAS_STUB_MAX_BYTES = 2048

# Hugo emits /page/1/ -> section root for every paginated list. Those are
# pagination plumbing, not content that moved, and no markdown document ever
# lived at them.
PAGINATION_ALIAS = re.compile(r"/page/\d+/$")


class Rule:
    """One redirect rule, normalised out of whichever table it came from."""

    def __init__(self, frm, to, status=DEFAULT_STATUS, force=False, source="", origin=""):
        self.frm = frm
        self.to = to
        self.status = status
        self.force = force
        self.source = source  # human-readable provenance, e.g. "_redirects:44"
        self.origin = origin  # one of: redirects, netlify.toml, alias

    @property
    def external(self):
        return self.to.startswith("http://") or self.to.startswith("https://")

    def line(self):
        status = self.status + ("!" if self.force else "")
        return "%-70s %-70s %s" % (self.frm, self.to, status)

    def __repr__(self):
        return "Rule(%r -> %r, %s)" % (self.frm, self.to, self.source)


# --------------------------------------------------------------------------
# Parsing
# --------------------------------------------------------------------------


def parse_redirects_file(path):
    """Parse a _redirects file. Returns (raw_text, rules) with order preserved."""
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()

    rules = []
    for lineno, line in enumerate(raw.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        parts = stripped.split()
        if len(parts) < 2:
            warn("%s:%d: cannot parse, skipping: %s" % (path, lineno, stripped))
            continue
        frm, to = parts[0], parts[1]
        status, force = DEFAULT_STATUS, False
        if len(parts) > 2:
            token = parts[2]
            force = token.endswith("!")
            status = token.rstrip("!")
        rules.append(
            Rule(frm, to, status, force, source="_redirects:%d" % lineno, origin="redirects")
        )
    return raw, rules


def parse_netlify_toml(path):
    """Pull [[redirects]] blocks out of netlify.toml.

    Deliberately not using tomllib: it only landed in Python 3.11 and the
    Netlify build image's default interpreter is older on some image versions.
    The blocks we care about are flat key = value pairs.
    """
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()

    rules = []
    block = None
    start = 0

    def flush():
        if not block or "from" not in block or "to" not in block:
            return
        rules.append(
            Rule(
                block["from"],
                block["to"],
                block.get("status", DEFAULT_STATUS),
                block.get("force", "false").lower() == "true",
                source="netlify.toml:%d" % start,
                origin="netlify.toml",
            )
        )

    for lineno, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("[["):
            flush()
            block = {} if stripped.startswith("[[redirects]]") else None
            start = lineno
            continue
        if stripped.startswith("["):
            # Any other table header ends the block ([headers.values] etc).
            flush()
            block = None
            continue
        if block is None or "=" not in stripped or stripped.startswith("#"):
            continue
        key, _, value = stripped.partition("=")
        block[key.strip()] = value.strip().strip('"').strip("'")
    flush()
    return rules


def collect_alias_rules(public_dir, include_pagination=False):
    """Recover Hugo's alias redirects from the meta-refresh stubs it built."""
    refresh = re.compile(r'http-equiv=["\']?refresh["\']?[^>]*url=([^"\'>\s]+)', re.I)
    rules = []

    for root, _dirs, files in os.walk(public_dir):
        if "index.html" not in files:
            continue
        stub = os.path.join(root, "index.html")
        try:
            if os.path.getsize(stub) > ALIAS_STUB_MAX_BYTES:
                continue
            with open(stub, encoding="utf-8", errors="replace") as fh:
                text = fh.read()
        except OSError as exc:
            warn("cannot read %s: %s" % (stub, exc))
            continue

        lowered = text.lower()
        if "http-equiv" not in lowered or "<body" in lowered or "canonical" not in lowered:
            continue
        found = refresh.search(text)
        if not found:
            continue

        frm = "/" + os.path.relpath(root, public_dir).replace(os.sep, "/").strip("/") + "/"
        to = urlsplit(found.group(1)).path or "/"
        if frm == "//":  # the site root is never an alias
            continue
        if frm.rstrip("/") == to.rstrip("/"):
            continue
        if not include_pagination and PAGINATION_ALIAS.search(frm):
            continue
        rules.append(Rule(frm, to, "301", False, source=os.path.relpath(stub, public_dir), origin="alias"))

    rules.sort(key=lambda r: r.frm)
    return rules


# --------------------------------------------------------------------------
# Matching -- this is the behaviour the /md/ loader has to reproduce
# --------------------------------------------------------------------------


def match_rule(rule, path):
    """Return rule's target for path, or None. Trailing slashes are ignored."""
    frm = rule.frm

    if frm.endswith("/*"):
        prefix = frm[:-1]  # "/a/b/*" -> "/a/b/"
        if path.startswith(prefix):
            return rule.to.replace(":splat", path[len(prefix):])
        if path.rstrip("/") == prefix.rstrip("/"):
            return rule.to.replace(":splat", "")
        return None

    if frm.endswith("*"):
        prefix = frm[:-1]
        if path.startswith(prefix):
            return rule.to.replace(":splat", path[len(prefix):])
        return None

    if ":" in frm:
        return match_placeholders(rule, path)

    if path.rstrip("/") == frm.rstrip("/"):
        return rule.to
    return None


def match_placeholders(rule, path):
    """Match a rule with :named segments. Each matches exactly one segment."""
    want = [s for s in rule.frm.split("/") if s != ""]
    got = [s for s in path.split("/") if s != ""]
    if len(want) != len(got):
        return None

    captures = {}
    for w, g in zip(want, got):
        if w.startswith(":"):
            captures[w[1:]] = g
        elif w != g:
            return None

    to = rule.to
    for name, value in captures.items():
        to = to.replace(":" + name, value)
    return to


def first_match(rules, path):
    """First-match-wins, in table order. Returns (rule, target) or (None, None)."""
    for rule in rules:
        target = match_rule(rule, path)
        if target is not None:
            return rule, target
    return None, None


def resolve(rules, path, max_hops=10):
    """Follow the table to a fixed point.

    Netlify does not chain internally -- it answers with one 301 and the client
    re-requests -- but a consumer holding the whole table can flatten the chain.
    Returns (final_path, hops, error).
    """
    seen = [path.rstrip("/") or "/"]
    current = path

    for _ in range(max_hops):
        rule, target = first_match(rules, current)
        if target is None:
            return current, len(seen) - 1, None
        if rule.external:
            return target, len(seen) - 1, None

        target = target.split("#")[0].split("?")[0] or current
        key = target.rstrip("/") or "/"
        if key in seen:
            return target, len(seen) - 1, "cycle: %s" % " -> ".join(seen + [key])
        seen.append(key)
        current = target

    return current, len(seen) - 1, "exceeded %d hops: %s" % (max_hops, " -> ".join(seen))


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def built_variants(public_dir, path):
    """Does the built site have (html, md) at this path?"""
    directory = os.path.join(public_dir, path.strip("/"))
    return (
        os.path.isfile(os.path.join(directory, "index.html")),
        os.path.isfile(os.path.join(directory, "index.md")),
    )


def validate(rules, public_dir):
    """Walk every old path we know of through the table and check where it lands.

    Resolving the *source* paths, not just the targets, is what catches a rule
    whose target only looks alive: /documentation/concepts/payload/ resolves
    through the /documentation/concepts/* catch-all to /documentation/payload/,
    which does not exist, even though the catch-all's own target does.
    """
    problems = []
    seen = set()

    for rule in rules:
        # Concrete sources resolve directly. For a wildcard source there is no
        # single path to test, so fall back to probing the target's section root.
        if rule.frm.endswith("*") or ":" in rule.frm:
            if rule.external:
                continue
            probe = rule.to.replace(":splat", "").split("#")[0]
            probe = re.sub(r"/:[A-Za-z_][A-Za-z0-9_]*", "", probe)
            label = "target of wildcard rule"
        else:
            probe = rule.frm
            label = "old path"

        key = probe.rstrip("/") or "/"
        if key in seen:
            continue
        seen.add(key)

        final, _hops, error = resolve(rules, probe)
        if error:
            problems.append((rule, error))
            continue
        if final.startswith("http"):
            continue

        html, md = built_variants(public_dir, final)
        if not html and not md:
            problems.append((rule, "%s %s lands on %s, which is not in the build" % (label, probe, final)))
        elif not md:
            problems.append((rule, "%s %s lands on %s, which has no index.md" % (label, probe, final)))

    return problems


def classify_aliases(hand_rules, alias_rules):
    """Decide where each alias rule has to sit relative to the hand-written table.

    An alias and a hand-written rule can both match the same old path and
    disagree about the destination. On qdrant.tech the alias wins for HTML --
    the stub is a real file at that path, and a non-forced _redirects rule is
    skipped when a file exists -- but it loses for .md, where there is no file
    to shadow the rule. That is how /documentation/concepts/payload/ ends up
    serving HTML correctly while its .md variant 301s to a dead path.

    So an alias that collides with a *wildcard* rule has to be emitted ahead of
    it: it is the more specific rule, and putting it first is what makes the
    table agree with what the CDN already does for HTML. An alias that collides
    with an *exact* rule is a deliberate override and stays suppressed.

    Returns (precede, append, suppressed).
    """
    precede, append, suppressed = [], [], []

    for rule in alias_rules:
        if rule.frm.endswith("*") or ":" in rule.frm:
            append.append(rule)
            continue
        winner, target = first_match(hand_rules, rule.frm)
        if winner is None:
            append.append(rule)
        elif target.rstrip("/") == rule.to.rstrip("/"):
            suppressed.append((rule, winner, target, "agrees"))
        elif winner.frm.endswith("*") or ":" in winner.frm:
            precede.append((rule, winner, target))
        else:
            suppressed.append((rule, winner, target, "overridden"))

    return precede, append, suppressed


# --------------------------------------------------------------------------
# Emission
# --------------------------------------------------------------------------

HEADER = """\
# GENERATED FILE -- DO NOT EDIT.
#
# Produced by automation/generate-redirects-table.py during the site build.
# It merges the three redirect tables Netlify applies for qdrant.tech into one
# table in _redirects syntax, for consumers that do not sit behind the CDN --
# principally the /md/ mirror on search.qdrant.tech, which has its own path
# lookup and would otherwise 404 paths that qdrant.tech redirects.
#
# Semantics, in the order they matter:
#   * First match wins, in the order rules appear below. Hand-written rules
#     come first so this file cannot change existing precedence.
#   * A trailing /* is a prefix match; :splat in the target is the remainder.
#   * A :name segment matches exactly one path segment.
#   * Trailing slashes are not significant on either side.
#   * A rule marked ! is forced. Consult this table only when you have no
#     document at the requested path and non-forced behaviour comes for free.
#
# To edit a rule, edit its source: qdrant-landing/static/_redirects, the
# [[redirects]] blocks in netlify.toml, or the page's `aliases:` front matter.
"""


def emit(raw_redirects, toml_rules, precede, append, suppressed):
    out = [HEADER]

    out.append("\n# ---- 1. Hugo aliases that outrank a wildcard rule " + "-" * 26 + "\n")
    out.append("# Each of these is an exact path that a catch-all further down also")
    out.append("# matches, with a different destination. The alias is the correct one:")
    out.append("# qdrant.tech already resolves these paths this way for HTML, because")
    out.append("# Hugo's alias stub is a real file and shadows the non-forced rule.")
    out.append("# Ordering them first is what makes .md agree with HTML.\n")
    if precede:
        for rule, winner, target in precede:
            out.append("# instead of %s -> %s" % (winner.source, target))
            out.append(rule.line())
    else:
        out.append("# (none)")

    out.append("\n\n# ---- 2. qdrant-landing/static/_redirects (verbatim) " + "-" * 24 + "\n")
    out.append(raw_redirects.rstrip("\n"))

    out.append("\n\n# ---- 3. netlify.toml [[redirects]] " + "-" * 41 + "\n")
    if toml_rules:
        for rule in toml_rules:
            out.append(rule.line())
    else:
        out.append("# (none)")

    out.append("\n\n# ---- 4. Remaining Hugo aliases " + "-" * 45 + "\n")
    out.append("# Hugo emits these as meta-refresh HTML with no index.md beside them,")
    out.append("# which is why a markdown mirror cannot see them without this file.\n")
    for rule in append:
        out.append(rule.line())

    if suppressed:
        out.append("\n\n# ---- Aliases deliberately not emitted " + "-" * 38 + "\n")
        for rule, winner, target, why in suppressed:
            note = "already handled by" if why == "agrees" else "overridden by"
            out.append("# %s %s (-> %s): %s" % (note, winner.source, target, rule.line().strip()))

    out.append("")
    return "\n".join(out) + "\n"


def warn(message):
    sys.stderr.write("warning: %s\n" % message)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--public", default="qdrant-landing/public", help="built site directory")
    parser.add_argument("--redirects", default="qdrant-landing/static/_redirects")
    parser.add_argument("--netlify", default="netlify.toml")
    parser.add_argument("--out", default=None, help="default: <public>/redirects.txt")
    parser.add_argument(
        "--augment-netlify-redirects",
        action="store_true",
        help="also append derived rules to <public>/_redirects, so qdrant.tech "
        "honours alias paths for .md requests (changes live CDN behaviour)",
    )
    parser.add_argument(
        "--include-pagination",
        action="store_true",
        help="keep Hugo's /page/N/ pagination aliases (excluded by default)",
    )
    parser.add_argument("--strict", action="store_true", help="exit 1 if validation finds problems")
    parser.add_argument("--quiet", action="store_true", help="suppress the validation report")
    args = parser.parse_args()

    for path in (args.public, args.redirects, args.netlify):
        if not os.path.exists(path):
            sys.exit("error: %s not found (run from the repository root, after hugo)" % path)

    raw_redirects, hand_rules = parse_redirects_file(args.redirects)
    toml_rules = parse_netlify_toml(args.netlify)
    alias_rules = collect_alias_rules(args.public, args.include_pagination)

    precede, append_, suppressed = classify_aliases(hand_rules + toml_rules, alias_rules)

    # First-match-wins order: specific aliases, then the hand-written tables,
    # then the aliases nothing else touches.
    ordered = [r for r, _w, _t in precede] + hand_rules + toml_rules + append_

    text = emit(raw_redirects, toml_rules, precede, append_, suppressed)
    out_path = args.out or os.path.join(args.public, "redirects.txt")
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(text)

    if args.augment_netlify_redirects:
        # Netlify reads _redirects top to bottom, so the specific aliases have
        # to be prepended, not appended, or the catch-alls keep winning for .md.
        target = os.path.join(args.public, "_redirects")
        with open(target, encoding="utf-8") as fh:
            existing = fh.read()
        head = [
            "# Prepended by automation/generate-redirects-table.py: exact alias paths",
            "# that a catch-all below would otherwise send to a dead .md target.",
        ]
        head += [r.line() for r, _w, _t in precede]
        tail = [
            "",
            "# Appended by automation/generate-redirects-table.py: netlify.toml rules",
            "# and Hugo aliases, so .md requests to old paths redirect too.",
        ]
        tail += [r.line() for r in append_]
        with open(target, "w", encoding="utf-8") as fh:
            fh.write("\n".join(head) + "\n\n" + existing.rstrip("\n") + "\n\n" + "\n".join(tail) + "\n")
        print("rewrote %s: %d rules prepended, %d appended" % (target, len(precede), len(append_)))

    problems = validate(ordered, args.public)

    if not args.quiet:
        print("wrote %s" % out_path)
        print(
            "  %d hand-written + %d netlify.toml + %d alias rules"
            % (len(hand_rules), len(toml_rules), len(alias_rules))
        )
        print(
            "  aliases: %d ordered ahead of a wildcard, %d appended, %d suppressed"
            % (len(precede), len(append_), len(suppressed))
        )
        if problems:
            print("\n%d path(s) need attention:" % len(problems))
            for rule, reason in problems:
                print("  %-26s %s" % (rule.source, reason))
        else:
            print("  every known old path lands on a page with both index.html and index.md")

    if problems and args.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
