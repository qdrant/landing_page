# Documentation prompts

A prompt is a short, ready-to-paste instruction that gets a coding agent moving
on the task a documentation page is about. Prompts live in one folder,
`qdrant-landing/content/documentation/headless/prompts/`, one file each, and
pages include them by id.

## Adding one

1. Create `content/documentation/headless/prompts/<id>.md`:

   ```yaml
   ---
   title: "Set up monitoring with an AI agent"
   skill: qdrant-monitoring/setup
   page: /documentation/ops-monitoring/monitoring/
   ---
   Help me set up monitoring for my Qdrant deployment. Read
   https://skills.qdrant.tech/qdrant-monitoring/setup/SKILL.md first, then ask
   me whether I am self-hosted, on Qdrant Cloud, or on Hybrid Cloud.
   ```

   - `title` is a plain task name: "Set up monitoring", not "Set up monitoring
     with an AI agent". The collapsed element already carries a `Prompt` marker
     placed by the shortcode, so working the word into the title says the same
     thing twice. Write it as the task, starting with a verb.
   - `skill` is a path under `skills.qdrant.tech`, without the `/SKILL.md`
     suffix. Omit it when no skill applies. Check the path resolves before
     using it: `curl -I https://skills.qdrant.tech/<path>/SKILL.md`. The
     published paths are listed in `https://skills.qdrant.tech/llms.txt`, and a
     path in the `qdrant/skills` repo is not automatically published, so the
     repo is not a reliable source for this value. Note the meta skills sit
     under `meta/`, as in `meta/qdrant-advisor`.
   - `page` is where the prompt is included. CI checks that page really
     includes it.
   - `open: true` renders the element expanded. **In-page prompts are always
     collapsed**, so leave this unset. It exists for a page whose whole purpose
     is the prompt, which today means only the Agentic Tools hub. A prompt
     feeling important is not a reason to set it: every prompt feels important
     to its author, and the collapsed state is what keeps a docs page readable.

2. Add `{{< prompt "<id>" >}}` to that page, near the top of the section it
   relates to rather than at the bottom.

3. Run both checks:

   ```bash
   automation/prompts/check-prompts.sh       # source rules, no build, seconds
   automation/prompts/check-skill-links.sh   # skill links resolve, needs network
   ```

   `check-prompts.sh` also accepts a built site directory, to verify the real
   output as well: `automation/prompts/check-prompts.sh qdrant-landing/public`.

## Writing one

**A few sentences.** Enough to get someone moving, not a specification.

**Name the skill inside the body,** with its full `SKILL.md` URL, so the agent
loads it rather than guessing. Prompts exist partly to surface skills.

**No variables.** Never ask the reader to fill something in before pasting. If
the task needs their configuration, tell the agent to ask for it.

**Do not restate the page.** The reader is already on it. A prompt that
re-explains the feature earns nothing.

**Ask for what the docs cannot give.** The useful instructions are the ones
that make an agent commit to a judgment call: which setup applies to the
reader's deployment, what to check first, what to ignore.

**Title it as the task.** The collapsed line reads `PROMPT | Set up
monitoring`: the marker says what kind of thing it is, the title says what it
does. That split is why titles stay short, and why the type signal is
consistent across every prompt rather than depending on each author phrasing it
the same way.

## Formatting a prompt body

**Do not hard-wrap prose.** Write each paragraph as one long line and let the
page wrap it. The element renders the body with `white-space: pre-wrap`, so any
line breaks you type are preserved, and a body wrapped at 80 columns keeps those
breaks in a content column that is narrower than that. `start-building` is the
exception: its numbered steps and indented commands are structure, so its line
breaks are content.

**A body can contain anything, including fenced blocks.** The shortcode passes
it to Chroma as a value rather than re-parsing it as markdown, so a prompt that
includes a YAML or JSON snippet renders correctly.

## Two rules that break silently

**Prompt bodies must never reach a built `index.md`.** Those files are consumed
by agents. A prompt is an instruction written in the imperative first person,
so an agent reading it inside a page it was told to fetch can follow the prompt
instead of answering the question it was actually asked. The shortcode's
Markdown variant drops the body and keeps the skill pointer. This is also why a
prompt is never written as a plain fenced block on the page.

**The `page:` declaration is what the index trusts.** Prompt files cannot know
who includes them, so a stale declaration would put a wrong link in the index,
and a prompt that is never included would still be listed.

`check-prompts.sh` guards both, plus a third rule that keeps them equivalent:
the Markdown variant of the shortcode must never render the body. Rule one is
checked in the source rather than in the built output, because pasting a body
inline is a source-level mistake and catching it there means CI needs no site
build.

## The third rule, which breaks without a commit

**A skill link rots on its own.** A skill renamed or unpublished in
`qdrant/skills` breaks every reference to it here without anything in this
repository changing, so no pull request run would ever notice.
`check-skill-links.sh` covers that. It checks both places a skill path appears,
the `skill:` front matter and the `SKILL.md` URLs written inside prompt bodies
and documentation prose, against the catalog at
`https://skills.qdrant.tech/llms.txt`, and it also runs weekly on a schedule.

It reaches the network, which is why it is a separate script and a separate CI
job. An unreachable catalog skips the run rather than failing it, so a docs pull
request never goes red because skills.qdrant.tech was down. A path missing from
the catalog is confirmed with a request before it is reported, since the catalog
can lag a freshly published skill.
