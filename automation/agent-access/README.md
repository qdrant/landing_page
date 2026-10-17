# Agent access check

`check.sh` tests the entry points an agent uses to find its way around a
deployed site:

- `robots.txt` carries a `Sitemap:` line.
- `/llms.txt` returns 200, and `/.well-known/llms.txt` serves the same file.
- Every link in `llms.txt` returns 200.
- Where a page sends a Markdown `Link` header, the file it names exists.

Run it against production, or against a deploy preview before merging a change
to `netlify.toml`, `config.toml` output formats, or `index.llms.txt`:

```bash
automation/agent-access/check.sh
automation/agent-access/check.sh https://deploy-preview-123--<site>.netlify.app
```

It needs the network and exits non-zero on any failure.

The `Link` headers themselves are written at build time by
`qdrant-landing/scripts/emit-md-link-headers.sh`, which appends one rule per
page to `public/_headers`, naming the page's `/path.md` alias. It runs after
`emit-md-aliases.sh`, which writes those aliases.
