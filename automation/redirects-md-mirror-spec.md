# Spec: honour qdrant.tech redirects in the `/md/` mirror

Implementation spec for the search service behind `search.qdrant.tech` (the
`/md/` route). Written to be pasted into an issue on that repo. The producing
half lives in `landing_page` as `automation/generate-redirects-table.py`.

## The bug

`qdrant.tech` redirects moved documentation paths. The `/md/` mirror does not,
because every redirect table lives in CDN configuration the mirror never sees:

| Table | Rules | Applied by |
| --- | --- | --- |
| `qdrant-landing/static/_redirects` | 61 | Netlify CDN |
| `netlify.toml` `[[redirects]]` | 9 | Netlify CDN |
| Hugo `aliases:` front matter | 284 built stubs | Hugo, as meta-refresh HTML |

So `/md/<old-path>` 404s where `qdrant.tech/<old-path>` 301s to a live page.
Agents that discover URLs from `llms.txt` or from older documentation hit the
404 and have no way to find where the page went.

Neither `/_redirects` nor `/netlify.toml` is fetchable — both return 404 from
the CDN — so the mirror cannot simply read the existing files.

## What the landing page now publishes

`https://qdrant.tech/redirects.txt` — generated at build time, publicly
fetchable, in `_redirects` syntax. It merges all three tables in
first-match-wins order, with the aliases resolved out of the built HTML (75 of
the 259 alias entries are relative, so only Hugo knows their real targets).

329 active rules, ~55 KB. Comment lines start with `#`. Rules are
whitespace-separated: `from  to  status`.

## What to implement

On a `/md/` request that would return 404, consult the table before answering.

1. **Load** `https://qdrant.tech/redirects.txt` at startup. Parse into an
   ordered list. Persist the parsed table (or the raw file) to disk and fall
   back to that copy if the fetch fails, so a fetch error degrades to
   yesterday's redirects rather than to no redirects.
2. **Refresh** periodically — hourly is ample. A landing-page deploy does not
   restart this service, so a startup-only load goes stale the first time
   someone moves a page. A Netlify deploy webhook would be tighter if it is
   cheap to add.
3. **Normalise** the requested path: strip the `/md/` prefix, strip a trailing
   `index.md`, keep a leading slash. Compare ignoring trailing slashes.
4. **Match** first-match-wins, in file order. Order is load-bearing — the table
   deliberately places specific rules above catch-alls.
5. **Answer** with a 301 to the `/md/`-prefixed target. Unmatched paths 404
   exactly as they do today.

### Matching rules

Four forms, in the order to test them:

| Form | Example | Behaviour |
| --- | --- | --- |
| Trailing `/*` | `/documentation/guides/*` | Prefix match. `:splat` in the target is the remainder. Also matches the bare prefix with an empty splat. |
| Trailing `*` | `/documentation/x*` | Same, without the slash boundary. |
| `:name` segment | `/documentation/platforms/:slug/` | Matches exactly one non-empty segment. Substitute into the target if `:name` appears there. |
| Exact | `/documentation/scroll/` | Trailing-slash-insensitive equality. |

`match_rule` and `match_placeholders` in the generator are the reference
implementation, and are used by its own validation pass — port those two
functions and the behaviour is guaranteed to agree.

### Details that matter

- **Status codes.** Use the status in the table; everything is currently `301`.
- **Fragments.** One target has one (`/documentation/manage-data/points/#scroll-points`).
  Strip it — it is meaningless for a markdown fetch.
- **External targets.** A few rules point at `https://hybrid-cloud.qdrant.tech/`,
  `https://qdrant.to/...`. Either 301 off-host or 404; do not try to mirror them.
- **Forced rules (`301!`).** Three rules carry `!`, meaning Netlify applies them
  even when a file exists. All three are external, so consulting the table only
  on a miss is currently equivalent. If a forced rule ever points at an internal
  path, it would need checking *before* serving a document. Not worth handling
  until it happens — but worth a comment where the check goes.
- **Chains.** Ten rules point at a path that is itself a redirect source.
  Netlify does not chain internally; it answers one 301 and the client
  re-requests. Either behave the same way, or flatten to a fixed point at load
  time — `resolve()` in the generator does this, with cycle detection and a
  10-hop cap. Flattening is friendlier to agent HTTP clients that do not follow
  redirects.
- **Why "on 404" is the right hook.** Netlify skips a non-forced rule when a
  real file exists at that path. Consulting the table only when you have no
  document reproduces that semantic exactly, with no `force` handling.

## Testing

The regression to guard against is the two tables drifting apart again, so test
them against each other rather than against a fixture:

- For a sample of `from` paths in the table, assert that
  `search.qdrant.tech/md/<from>` and `qdrant.tech/<from>/index.md` resolve to
  the same final path. Cross-host agreement is the invariant that actually
  matters.
- Assert the table parses to a non-empty ordered list at startup, and that a
  fetch failure leaves the previous table in place.
- Unit-test the four match forms, including the empty-splat case
  (`/documentation/guides/` against `/documentation/guides/*`) and the
  trailing-slash variants.

## Known divergences this does not fix

`.md` requests to alias paths still 404 **on qdrant.tech itself**, because Hugo
writes an alias as `index.html` with no `index.md`, and Netlify has no rule for
those paths. Confirmed live examples — HTML 200, markdown 404:

    /documentation/concepts/payload/
    /documentation/concepts/points/
    /documentation/concepts/search/
    /documentation/concepts/search-relevance/
    /documentation/guides/low-latency-search/
    /documentation/guides/running-with-GPU/
    /documentation/guides/usage-statistics/

The first three are worse than a plain 404: a catch-all sends them to a
*different* destination than the alias does, so `/documentation/concepts/payload/index.md`
301s to `/documentation/payload/index.md`, which does not exist, while the HTML
at the same path correctly reaches `/documentation/manage-data/payload/`.

That is the CDN's half of the problem. The generator can fix it in the same run
with `--augment-netlify-redirects`, which prepends the specific alias rules to
`public/_redirects` so they outrank the catch-alls. It changes live CDN
behaviour, so it is off by default and wants a deploy-preview check first.
