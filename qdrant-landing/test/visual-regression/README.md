# Visual regression tests

These tests check that a change did not alter how the site looks by accident.
They take full-page screenshots of a set of pages, at desktop and mobile
widths, and compare them with screenshots taken before the change. They use
[Playwright](https://playwright.dev/) with Chromium.

They are for local use by developers and agents:

- **They do not run in CI.**
- **Screenshots are never committed.** The snapshot directory, reports, and
  results are listed in this directory's `.gitignore`. Each person creates a
  baseline locally, from the commit their change starts from.

## When to use them

This approach is expensive. A run needs a baseline taken at the merge-base and
then a comparison run, each of which builds the site and captures about 190
full-page screenshots, so the whole check takes several minutes of machine time
plus the time to review every difference it reports. Do not run it as a routine
step for every change.

Run it only when there is a strong suspicion that a change might break pages it
was not meant to touch, for example a change to shared templates, partials,
global SCSS, the header or footer, or a shortcode used across many pages. For a
change confined to one page or one section, look at the affected pages in
`hugo serve` instead.

## Setup

Playwright is a dev dependency in `qdrant-landing/package.json`, so the
regular `npm install` in `qdrant-landing/` (which `run.sh` runs) installs it.
Then download the Chromium build that matches the installed Playwright
version, once and again after each Playwright upgrade:

```bash
cd qdrant-landing
npm install
npx playwright install chromium
```

Commands in this README run from `qdrant-landing/test/visual-regression/`,
where `npx playwright` picks up `playwright.config.ts` on its own. From
`qdrant-landing/`, the same runs are available as npm scripts:

```bash
npm run visual:baseline    # npx playwright test --update-snapshots
npm run visual:test        # npx playwright test
npm run visual:test -- --project=mobile   # extra arguments go after --
```

Either way, the run output (`test-results/`, `playwright-report/`, and
`results.json`) is written to this directory, so open the report from here.

The tests start their own `hugo serve` on port 1314, so the usual build
requirements apply (Hugo 0.160.1 and Dart Sass, see `AGENTS.md` at the
repository root). An already running server on port 1314 is reused.

## Workflow

### 1. Create the baseline from the commit your branch starts from

Take the baseline from the merge-base of your branch, not from the latest
`master`. If `master` moved on since you branched, a newer global element (a
top banner, a navigation change) shifts every full-page screenshot, and nearly
every page fails although your change did not touch it. A typical sign is
`Expected an image 1280px by Npx, received 1280px by (N-36)px`.

```bash
# from the repository root, with your changes committed or stashed
git stash -u                            # only if you have uncommitted changes
git checkout "$(git merge-base HEAD master)"

cd qdrant-landing/test/visual-regression
npx playwright test --update-snapshots
cd -

git checkout -                          # back to your branch
git stash pop                           # only if you stashed
```

Stash with `-u`, so new files that are not committed yet, such as a new page
or partial, leave the working tree too. Hugo would otherwise render them into
the baseline. The screenshots are git-ignored, so `-u` leaves them in place,
and they stay put when you switch commits.

The baseline run uses `routes.ts` as it is at the merge-base. A route that your
branch adds gets no baseline here; see [Which pages are covered](#which-pages-are-covered).

If your branch has no commits of its own yet, skip the checkout: stash your
changes, update the snapshots, and pop the stash.

### 2. Compare your change against the baseline

```bash
cd qdrant-landing/test/visual-regression
npx playwright test
```

A page that differs by more than 1% of its pixels fails. To see the expected,
actual, and diff images side by side:

```bash
npx playwright show-report
```

### 3. Review the failures

For each failing page, decide whether the difference is intended:

- **Intended**, for example the page you redesigned: nothing to do. You can
  update the snapshots with `--update-snapshots` to use the new state as the
  baseline for further work on the same branch.
- **Not intended**: your change leaks into a page it should not affect. Fix it
  and run the comparison again.

Report what changed and why when you open the pull request, since reviewers do
not have the screenshots.

## Which pages are covered

`routes.ts` lists them:

- `ROUTES`: every marketing page and section index, including all `/lp/` pages.
  Individual posts under `/blog/` and `/articles/` are excluded by
  `EXCLUDE_PREFIXES`.
- `SAMPLED_ROUTES`: a fixed sample of documentation, course, article, and blog
  pages.
- `SHORTCODE_ROUTES`: one page for each shortcode that has its own assets in
  `assets/shortcodes/`. Keep it in step with the table in
  `assets/shortcodes/README.md`.

When you add a page or a shortcode with its own styles, add a route for it, so
later changes are checked against it too. A new route has no baseline yet:
create one as described in the workflow, or the first run writes it and
reports the test as failed.

Screenshots are saved in `pages.spec.ts-snapshots/`, named after the route,
the width, and the platform: `/lp/ai/` becomes `lp-ai-desktop-darwin.png` and
`lp-ai-mobile-darwin.png` on macOS. Because the platform is part of the name,
a baseline made on macOS does not serve a run on Linux.

## Speed and stability

A full run takes 3 to 4 minutes. These settings keep it that way:

- `playwright.config.ts` runs 4 workers against one `hugo serve`.
- `pages.spec.ts` blocks every request except `localhost` and
  `cdn.jsdelivr.net` (MathJax, Popper, Chart.js). HubSpot forms, YouTube
  embeds, analytics, and consent load late and change on their own, so they
  made runs slow and flaky. They do not appear in screenshots.
- Animations and transitions are disabled before each capture.
- Pages get up to 5 seconds to reach network idle, then the test moves on.
- `expect.timeout` is 15 seconds, because a long desktop page needs a few
  seconds per capture while four workers run.
- The JSON reporter writes per-test durations to `results.json`. Passing
  `--reporter` on the command line replaces the configured reporters, so leave
  it off when you want the timings.

To run a subset, pass a pattern or a project:

```bash
npx playwright test -g "lp/ai"          # pages whose name matches
npx playwright test --project=mobile    # mobile width only
```

## Notes for agents

- Do not run this suite by default or as a final check on every task. Run it
  only when the change touches something shared and a regression elsewhere is
  a real risk, as described in [When to use them](#when-to-use-them), or when
  you are asked to.
- `hugo serve` cannot bind a port inside a sandbox that blocks local binding.
  Run the tests outside it, or allow local binding.
- Do not edit site files during a run. `hugo serve` rebuilds, and screenshots
  taken mid-rebuild fail.
- Never commit anything from `*-snapshots/`, `test-results/`, or
  `playwright-report/`.
