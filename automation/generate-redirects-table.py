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
        # Protocol-relative targets are off-site too; without the // case
        # resolve() would try to follow one as a site path.
        return self.to.startswith(("http://", "https://", "//"))

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
        if len(parts) > 3:
            # Netlify allows conditions and query params after the status
            # (Country=us, Language=en, role=admin). Emitting the rule without
            # them would turn a scoped redirect into an unconditional one.
            warn(
                "%s:%d: ignoring trailing condition(s) %r -- rule will be emitted "
                "unconditionally" % (path, lineno, " ".join(parts[3:]))
            )
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
            if block is not None and stripped.startswith("[redirects."):
                # [redirects.conditions] / [redirects.headers] scope a rule to a
                # country, language or role. We emit the rule without them, which
                # would widen it, so this must not pass silently.
                warn(
                    "%s:%d: %s is not carried into the merged table -- the rule "
                    "from line %d will be emitted unconditionally"
                    % (path, lineno, stripped, start)
                )
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


def locate_case_insensitively(public_dir, path):
    """Find the built directory for path, ignoring case as the CDN does.

    Netlify serves assets case-insensitively: a request for
    /documentation/operations/running-with-GPU/index.md is answered by the
    built running-with-gpu/index.md. Matching exactly would make this script
    disagree with production, and disagree with itself across platforms -- the
    macOS filesystem hides the mismatch, Linux CI does not, so _redirects:50
    (which targets running-with-GPU while the build writes running-with-gpu)
    would fail --strict on CI alone.

    Returns the real directory path, or None.
    """
    current = public_dir
    for segment in [s for s in path.strip("/").split("/") if s]:
        candidate = os.path.join(current, segment)
        if os.path.isdir(candidate):
            current = candidate
            continue
        try:
            entries = os.listdir(current)
        except OSError:
            return None
        lowered = segment.lower()
        match = next((e for e in entries if e.lower() == lowered), None)
        if match is None:
            return None
        current = os.path.join(current, match)
    return current


def built_variants(public_dir, path):
    """Does the built site have (html, md) at this path?"""
    directory = locate_case_insensitively(public_dir, path)
    if directory is None:
        return (False, False)
    return (
        os.path.isfile(os.path.join(directory, "index.html")),
        os.path.isfile(os.path.join(directory, "index.md")),
    )


def validate(rules, public_dir, observed_paths=()):
    """Walk known old paths through the table and check where they land.

    Coverage here is honestly partial, and it is worth being precise about the
    gap. Every rule with a concrete source is resolved and checked. A *wildcard*
    rule has no single source path to test, so all we can probe is its target
    with the splat stripped -- and that target is usually alive even when the
    paths routed through it are not:

        /documentation/operations/*  ->  /documentation/deploy-intro/:splat

    probes as /documentation/deploy-intro/, which exists, and passes. But
    /documentation/operations/running-with-gpu/ lands on
    /documentation/deploy-intro/running-with-gpu/, which does not exist. (The
    rule spells it running-with-GPU; real traffic arrives lowercase and falls
    through to the catch-all.) Nothing in the rule sources reveals that path.

    So pass --observed-paths with real request paths from the access log. That
    corpus is what closes the gap; the rule-derived checks below cannot.
    """
    problems = []
    unrouted = []
    # Deliberately separate from the rule loop's set below: sharing one would
    # let an observed path suppress a wildcard rule's own probe.
    seen_observed = set()

    for path in observed_paths:
        key = path.rstrip("/") or "/"
        if key in seen_observed:
            continue
        seen_observed.add(key)
        final, hops, error = resolve(rules, path)
        if error:
            problems.append((Rule(path, path, source="observed"), error))
            continue
        if final.startswith(("http", "//")):
            continue

        html, md = built_variants(public_dir, final)
        if hops == 0:
            # No rule fired. If the path is also not in the build it is an
            # ordinary 404 -- a candidate for a new rule, but not a broken one,
            # so it is reported separately and never fails --strict.
            if not html and not md:
                unrouted.append(path)
            continue
        if not html and not md:
            problems.append(
                (Rule(path, final, source="observed"),
                 "requested path %s is redirected to %s, which is not in the build" % (path, final))
            )
        elif not md:
            problems.append(
                (Rule(path, final, source="observed"),
                 "requested path %s is redirected to %s, which has no index.md" % (path, final))
            )

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
        if final.startswith(("http", "//")):
            continue

        html, md = built_variants(public_dir, final)
        if not html and not md:
            problems.append((rule, "%s %s lands on %s, which is not in the build" % (label, probe, final)))
        elif not md:
            problems.append((rule, "%s %s lands on %s, which has no index.md" % (label, probe, final)))

    return problems, unrouted


def classify_aliases(hand_rules, alias_rules):
    """Decide where each alias rule has to sit relative to the hand-written table.

    An alias and a hand-written rule can both match the same old path and
    disagree about the destination. On qdrant.tech the alias wins for HTML --
    the stub is a real file at that path, and a non-forced _redirects rule is
    skipped when a file exists -- but it loses for .md, where there is no file
    to shadow the rule. That is how /documentation/concepts/payload/ ends up
    serving HTML correctly while its .md variant 301s to a dead path.

    What decides the winner on the live site is `force`, not how specific the
    rule looks: a forced rule is applied even when a file exists, a non-forced
    one is not. So an alias that collides with any non-forced rule -- wildcard
    or exact -- has to be emitted ahead of it, because that is what the CDN
    already does for HTML at that path. Only a forced rule genuinely beats the
    alias stub and keeps it suppressed.

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
            # Same destination either way, so ordering cannot diverge.
            suppressed.append((rule, winner, target, "agrees"))
        elif winner.force:
            suppressed.append((rule, winner, target, "overridden"))
        else:
            precede.append((rule, winner, target))

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
#   * The third column is the status, and it is not always a redirect. 200 is
#     a rewrite: Netlify proxies the target and the URL does not change, so a
#     consumer that answers 301 for it would diverge from the live site. Every
#     rule here is currently 301, but check the column rather than assuming.
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


GENERATED_MARKER = "# --- generated by automation/generate-redirects-table.py:"


def strip_generated_blocks(text):
    """Remove blocks a previous --augment-netlify-redirects run inserted.

    Without this the prepended rules duplicate every time the build runs twice
    against the same public/ (a rebuild without a clean, or a local re-run).
    A block runs from its marker to the next blank line that is not followed by
    another rule of the same block.
    """
    out, skipping = [], False
    for line in text.splitlines():
        if line.startswith(GENERATED_MARKER):
            skipping = True
            continue
        if skipping:
            # Comments and rules belong to the block; a blank line ends it.
            if line.strip() == "":
                skipping = False
            continue
        out.append(line)
    return "\n".join(out).strip("\n") + "\n"


def looks_like_a_probe(path):
    """Is this path a scanner probe rather than a real documentation request?

    Open-redirect and file-inclusion scanners ride the wildcard rules, so a raw
    access log is full of paths like these:

        /documentation/distributed_deployment/https://example.com
        /documentation/distributed_deployment/logout.php
        /documentation/operations/monitoring/).

    They resolve through a catch-all to something nonexistent and will never be
    fixed, so left in they would fail --strict on every PR until someone deletes
    the step. This catches the URL-shaped, script-extension and stray-punctuation
    families. It cannot catch a probe that is merely a plausible-looking path
    (/documentation/.../setLocale); filtering by user agent and request count
    when extracting the corpus is what removes those.
    """
    if "://" in path:
        return True
    if re.search(r"\.(php|asp|aspx|jsp|cgi|env|git|sql|bak)(/|$)", path, re.I):
        return True
    return bool(re.search(r"[()<>\"'\\;`|]", path))


def load_observed_paths(path):
    """Read request paths from an access-log extract, one per line.

    Returns (paths, skipped_probes).
    """
    paths, skipped = [], 0
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            entry = line.strip()
            if not entry or entry.startswith("#"):
                continue
            entry = urlsplit(entry).path or "/"
            entry = entry.split("?")[0]
            if not entry.startswith("/"):
                entry = "/" + entry
            # Access-log paths from the mirror carry the /md/ prefix. Left on,
            # every path matches nothing, everything is reported as unrouted,
            # and --strict passes -- the corpus silently does nothing.
            if entry == "/md" or entry.startswith("/md/"):
                entry = entry[len("/md"):] or "/"
            if entry.endswith("index.md"):
                entry = entry[: -len("index.md")]
            if looks_like_a_probe(entry):
                skipped += 1
                continue
            paths.append(entry)
    return paths, skipped


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
        "--observed-paths",
        metavar="FILE",
        help="file of real request paths, one per line, to resolve through the "
        "table. Catches dead landings that no rule source reveals -- see "
        "validate(). Lines may be bare paths or full URLs; blanks and # ignored. "
        "A leading /md is stripped, so mirror access-log paths can be used as-is. "
        "Scanner probes are skipped and counted; extract with a user-agent and "
        "request-count filter, or the report fills with paths nobody will fix.",
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
        existing = strip_generated_blocks(existing)
        head = [
            GENERATED_MARKER + " exact alias paths",
            "# that a catch-all below would otherwise send to a dead .md target.",
        ]
        head += [r.line() for r, _w, _t in precede]
        tail = [
            "",
            GENERATED_MARKER + " netlify.toml rules",
            "# and Hugo aliases, so .md requests to old paths redirect too.",
        ]
        tail += [r.line() for r in append_]
        with open(target, "w", encoding="utf-8") as fh:
            fh.write("\n".join(head) + "\n\n" + existing.rstrip("\n") + "\n\n" + "\n".join(tail) + "\n")
        print("rewrote %s: %d rules prepended, %d appended" % (target, len(precede), len(append_)))

    observed, skipped_probes = ([], 0)
    if args.observed_paths:
        if not os.path.isfile(args.observed_paths):
            sys.exit("error: --observed-paths file not found: %s" % args.observed_paths)
        observed, skipped_probes = load_observed_paths(args.observed_paths)
        if not observed:
            sys.exit("error: %s yielded no usable paths" % args.observed_paths)

    problems, unrouted = validate(ordered, args.public, observed)

    if observed and len(unrouted) > len(set(observed)) / 2:
        # A corpus where most paths match no rule is usually mis-shaped rather
        # than informative -- wrong prefix, or extracted from the wrong host.
        # Left unsaid this passes --strict while checking nothing.
        warn(
            "%d of %d observed paths match no rule at all; the corpus may be "
            "mis-shaped and is checking little" % (len(unrouted), len(set(observed)))
        )

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
        if observed:
            print(
                "  checked %d observed request path(s), skipped %d scanner probe(s)"
                % (len(set(observed)), skipped_probes)
            )
        else:
            print("  no --observed-paths given: dead landings under a catch-all go unchecked")
        if problems:
            print("\n%d path(s) need attention:" % len(problems))
            for rule, reason in problems:
                print("  %-26s %s" % (rule.source, reason))
        else:
            print("  every checked path lands on a page with both index.html and index.md")

        if unrouted:
            print(
                "\n%d observed path(s) match no rule and are not in the build "
                "(candidates for new rules, not failures):" % len(unrouted)
            )
            for path in unrouted[:20]:
                print("  %s" % path)
            if len(unrouted) > 20:
                print("  ... and %d more" % (len(unrouted) - 20))

    if problems and args.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
