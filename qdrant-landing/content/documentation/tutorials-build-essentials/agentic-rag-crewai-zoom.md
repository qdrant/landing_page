---
title: Agentic RAG with CrewAI
short_description: "Build a two-agent CrewAI flow that answers questions about meeting notes from Qdrant with FastEmbed and Claude."
description: "Tutorial: store meeting transcripts in Qdrant with FastEmbed, retrieve them with the Query API, and let two CrewAI agents on Claude turn the results into a grounded answer."
weight: 5
partition: ecosystem
social_preview_image: /documentation/examples/agentic-rag-crewai-zoom/social_preview.jpg
aliases:
  - /documentation/agentic-rag-crewai-zoom/
goal: RAG & Agents
stack:
  - Python
  - Qdrant
  - CrewAI
  - FastEmbed
  - Claude
---

# Agentic RAG with CrewAI

| Time: 30 min | Level: Beginner | Stack: Python, Qdrant, CrewAI, FastEmbed, Claude |
| --- | ----------- | ----------- |

Build a small system that answers questions about meeting notes. Qdrant is the vector search engine that stores each meeting with its transcript and metadata. [FastEmbed](https://github.com/qdrant/fastembed) turns text into vectors on your machine, for both the stored meetings and the questions. [CrewAI](https://www.crewai.com/) runs two agents on Claude: a researcher that searches Qdrant and quotes what it finds, and a writer that turns the findings into a short answer with citations.

The whole tutorial is one script and six sample meetings. You run it twice: once to load the meetings, once to ask a question. Nothing needs to be cloned.

By the end, you can ask what the marketing team decided about the Q4 campaign and how long those meetings ran. The agents find the right meetings, quote who said what, work out the average, and tell you what the notes do not cover.

## Prerequisites

You need Python 3.12 and:

- [uv](https://docs.astral.sh/uv/getting-started/installation/) to create the environment and install the packages.
- A [Qdrant Cloud cluster](https://cloud.qdrant.io/) with its HTTPS endpoint and an API key, or Qdrant running locally with `docker run -p 6333:6333 qdrant/qdrant`.
- An [Anthropic API key](https://console.anthropic.com/) with credit.

## How the Flow Works

Ingestion runs once. The script embeds each meeting with FastEmbed and stores the vector together with the meeting's topic, date, duration, attendees, and transcript as the point's [payload](/documentation/manage-data/payload/).

Answering runs for each question. CrewAI gives the question to the researcher agent, whose only tool is a semantic search over the collection. The tool embeds the query with the same FastEmbed model, calls Qdrant's Query API, and returns the closest meetings as text. The researcher writes a list of evidence. The writer agent receives that list and the question, and is instructed to answer from those findings. The writer has no retrieval tool of its own.

## Step 1: Install the Dependencies

Create a local environment with uv:

```bash
uv venv --python 3.12
source .venv/bin/activate
```

On Windows PowerShell, activate the environment with `.venv\Scripts\Activate.ps1`.

Install the three packages this tutorial uses, with the versions it was tested against:

```bash
uv pip install "crewai[anthropic]==1.15.28" "qdrant-client[fastembed]==1.20.0" "python-dotenv==1.2.4"
```

The `anthropic` extra gives CrewAI its native Claude provider. The `fastembed` extra lets the Qdrant client embed text locally. CrewAI has a large dependency tree, so allow a few minutes for installation.

## Step 2: Configure the Connections

Create a `.env` file beside your script:

```ini
ANTHROPIC_API_KEY=your-anthropic-api-key
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
```

For a local Qdrant, set `QDRANT_URL=http://localhost:6333` and leave `QDRANT_API_KEY` out.

Create `meeting_crew.py` and start with the imports and three constants:

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="imports" >}}

`EMBEDDING_MODEL` determines the collection's vector size and supplies the model for both ingestion and search. This keeps stored vectors and query vectors compatible. `CLAUDE_MODEL` uses CrewAI's provider prefix to select Claude Opus 5.5.

## Step 3: Add the Sample Meetings

Six short meetings are enough to see the agents work. Each one has a topic, a date, a duration in minutes, attendees, and a transcript. Three are marketing meetings, which is what the sample question is about.

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="data" >}}

To use your own notes later, replace this list with whatever loads them. Keep the same keys, since the search tool and the citations read them from the payload.

## Step 4: Create the Collection

The collection's vector size has to match the embedding model. Rather than hard-coding 384, ask the client for the model's size:

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="collection" >}}

Cosine distance suits this embedding model. The function reuses an existing collection; use a new `COLLECTION` name if you change the embedding model. Ingestion uses stable point IDs, so rerunning it with the same sample data updates the same six points.

## Step 5: Ingest the Meetings

Each meeting becomes one point. The text that gets embedded is the topic, the date, and the transcript. The full meeting stays in the payload so the search tool can return dates and durations without a second lookup.

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="ingest" >}}

Passing `models.Document` as the vector tells the client to run FastEmbed locally and send the resulting vector to Qdrant. The first run downloads and caches the model. The point IDs are derived from topic and date, so rerunning ingestion updates the same points instead of adding duplicates.

## Step 6: Retrieve With the Query API

Search embeds the question with the same `models.Document` call and uses `query_points`, the [Query API](https://api.qdrant.tech/api-reference/search/query-points). The function returns plain dictionaries so the tool and the question trace can print them.

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="search" >}}

For the sample question, the three closest meetings and their cosine scores are:

```text
0.739  Marketing Strategy Review (2026-09-02, 45 min)
0.632  Marketing Weekly Sync (2026-09-09, 30 min)
0.613  Marketing and Sales Alignment (2026-09-16, 50 min)
```

All three marketing meetings come back ahead of the product, engineering, and support meetings, with the one that records the Q4 decision on top.

## Step 7: Wrap Retrieval as a CrewAI Tool

CrewAI agents call tools that subclass `BaseTool`. The input schema tells the model what argument to pass. The tool formats each result as one line with the topic, date, duration, score, and transcript, because the researcher agent reads this text and quotes from it.

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="tool" >}}

## Step 8: Define the Agents and Tasks

Two agents, two tasks, run in order. The researcher has the search tool and is told to quote evidence and to say when the transcripts do not answer something. The writer has no tools and receives the researcher's output as context. These instructions encourage grounded answers, but they do not enforce factual correctness. Check the answer's citations and calculations against the retrieved notes.

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="agents" >}}

Both agents share one `LLM` object. `Process.sequential` runs the tasks in list order, and `context=[research]` is what hands the researcher's findings to the writer.

## Step 9: Run One Question

The entry point takes two flags. `--ingest` creates the collection and loads the meetings. `--ask` prints what retrieval returns for the question, runs the crew, and prints the answer.

{{< code-snippet path="/documentation/headless/snippets/agentic-rag-crewai/" block="run" >}}

Load the meetings:

```bash
python meeting_crew.py --ingest
```

```text
Loaded 6 meetings into 'meeting-notes'
```

Ask the question:

```bash
python meeting_crew.py --ask "What did the marketing meetings decide about the Q4 campaign, and how long did they run on average?"
```

The script prints the retrieval result first, then the crew log, then the answer. The output and trace record a run from 22 October 2026 with the pinned versions. Agent-chosen queries and answer wording can vary between runs. Trimmed to the first and last part:

```text
Retrieved for the question:
  0.739  Marketing Strategy Review (2026-09-02, 45 min)
  0.632  Marketing Weekly Sync (2026-09-09, 30 min)
  0.613  Marketing and Sales Alignment (2026-09-16, 50 min)

...

Answer:
Only the Marketing Strategy Review (2026-09-02) formally decided anything about the Q4 campaign: it approved 100k of the 120k requested, with Michael proposing to hold the remaining 20k until the October numbers are in, and it focused wave one on the developer newsletter and two conference sponsorships, with a review on 15 October. The Marketing and Sales Alignment meeting (2026-09-16) also agreed, though not as a formal decision, that the Q4 campaign landing pages will carry a use-case field so sales can route leads to different reps. The Marketing Weekly Sync (2026-09-09) never mentions the Q4 campaign and only planned to propose Lisbon at the strategy review, so neither conference is confirmed. The three marketing meetings averaged (45 + 30 + 50) / 3 = 41.7 minutes (Strategy Review 2026-09-02, Weekly Sync 2026-09-09, Sales Alignment 2026-09-16), or (45 + 50) / 2 = 47.5 minutes counting only the two that name the Q4 campaign. The transcripts do not show the outcome of the 15 October review, whether the 20k was released, or any meetings after 2026-09-16.
```

## Trace the Question Through the System

With `verbose=True` on both agents, CrewAI prints each step. Here is what moved between the parts for the sample question, trimmed to the lines that matter.

**1. The researcher turns the question into a search.** It called `search_meetings` twice, with these queries:

```text
marketing meeting Q4 campaign decision
Q4 campaign budget review October marketing
```

**2. Qdrant returns the three closest meetings.** This is the exact text the tool handed back for the first query. The second query returned the same three meetings with slightly different scores, so this is the only meeting data either agent ever sees:

```text
- Marketing Strategy Review on 2026-09-02, 45 min, score 0.811: Emily: The Q4 campaign budget request is 120k. Michael: Approve 100k now and hold 20k until the October numbers are in. Sarah: Agreed. We focus the first wave on the developer newsletter and two conference sponsorships. Emily: Decision recorded: 100k approved, developer newsletter and two conferences for wave one, review on 15 October.
- Marketing Weekly Sync on 2026-09-09, 30 min, score 0.694: Sarah: Newsletter open rate went from 31 to 38 percent after the redesign. Emily: Good. The conference shortlist is down to Berlin and Lisbon. Sarah: Lisbon has the better developer audience. Emily: Let's propose Lisbon at the strategy review. Social video is paused until we hire.
- Marketing and Sales Alignment on 2026-09-16, 50 min, score 0.694: Daniel: Sales needs leads tagged by use case, not just by source. Emily: We can add a use-case field to the newsletter signup. Sarah: The Q4 campaign landing pages will carry the same field. Daniel: Then sales can route retrieval and recommendation leads to different reps.
```

**3. The researcher writes its findings.** This is the full output of the research task, which becomes the writer's context:

```text
I found three marketing meetings. Only one recorded a formal decision on the Q4 campaign. The three meetings ran 41.7 minutes on average.

**Relevant meetings**

- **Marketing Strategy Review, 2026-09-02, 45 min.** This is the only meeting that formally decided anything about the Q4 campaign.
  - "Emily: The Q4 campaign budget request is 120k."
  - "Michael: Approve 100k now and hold 20k until the October numbers are in."
  - "Sarah: Agreed. We focus the first wave on the developer newsletter and two conference sponsorships."
  - "Emily: Decision recorded: 100k approved, developer newsletter and two conferences for wave one, review on 15 October."

- **Marketing and Sales Alignment, 2026-09-16, 50 min.** This meeting set a detail of the Q4 campaign pages, though nobody called it a formal decision.
  - "Daniel: Sales needs leads tagged by use case, not just by source."
  - "Emily: We can add a use-case field to the newsletter signup."
  - "Sarah: The Q4 campaign landing pages will carry the same field."
  - "Daniel: Then sales can route retrieval and recommendation leads to different reps."

- **Marketing Weekly Sync, 2026-09-09, 30 min.** This meeting never says "Q4 campaign." It's only loosely related because it discusses conferences and the newsletter, the two channels chosen for wave one. Even so, the transcript doesn't link these lines to the campaign, and it only plans to propose Lisbon rather than deciding on it.
  - "Sarah: Newsletter open rate went from 31 to 38 percent after the redesign."
  - "Emily: Good. The conference shortlist is down to Berlin and Lisbon."
  - "Sarah: Lisbon has the better developer audience."
  - "Emily: Let's propose Lisbon at the strategy review. Social video is paused until we hire."

**What was decided:** The team approved 100k of the 120k requested and held back 20k until the October numbers come in. Wave one will focus on the developer newsletter and two conference sponsorships, with a review on 15 October. The campaign landing pages will also include a use-case field so sales can route leads.

**Average length:**
- All three marketing meetings: (45 + 30 + 50) / 3 = **41.7 minutes**.
- Only the two that mention the Q4 campaign by name: (45 + 50) / 2 = **47.5 minutes**.

**Not in the transcripts:**
- What happened at the 15 October review.
- Whether the held-back 20k was released.
- Which two conferences were finally chosen. Lisbon was only planned as a proposal.
- Any meetings after 2026-09-16.
```

**4. The writer receives the question and the researcher's findings as task context.** Its output is the answer printed at the end of Step 9. Compare the two: every meeting, date, quote, and number in the answer appears in the researcher's findings, and the last sentence carries over what the researcher marked as not in the transcripts.

The useful boundary here is the handoff between retrieval and writing: you can inspect the researcher's evidence before checking the final answer. Separating the roles does not prevent either agent from inventing a claim. In this run, the cited meetings and durations match the retrieved payloads, and the two averages can be checked directly.

All three marketing meetings in this sample were retrieved. In a larger archive, the three closest matches are not necessarily all relevant meetings, so their average describes only that retrieved set. For an archive-wide statistic, define the matching set with payload filters, retrieve every matching point with [paginated scroll](https://api.qdrant.tech/api-reference/points/scroll-points), and calculate the result in code.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `Vector dimension error` on upsert or query | Use a new `COLLECTION` name for the new embedding model and run `--ingest`, or restore the model used to create the existing collection. |
| `KeyError: 'QDRANT_URL'` | The `.env` file is not beside the script or the variable name differs. |
| `credit balance is too low` or `authentication_error` from Anthropic | The key has no credit or is wrong. Check the Anthropic console. |
| The researcher answers without calling the tool | Check the verbose log for a `search_meetings` call and keep the task's instruction to use it. Treat an answer without retrieved evidence as unverified; the prompt alone does not guarantee tool use. |
| Answers mention meetings that are not in the sample | Compare the tool output, research findings, and final answer to locate the unsupported claim. Verify each citation against the returned notes. Reducing the retrieval limit does not prevent hallucinations and may discard relevant evidence. |

## Adapt the Flow

To use your own transcripts, set `COLLECTION` to a new name, replace `MEETINGS` with your loader, keep the same payload keys, and run `--ingest`. Upsert updates points with matching IDs; it does not remove the sample meetings when you replace the list.

Add a [payload filter](/documentation/search/filtering/) when a question has an explicit constraint, such as a named attendee. For date ranges, store RFC 3339 timestamps and use a [datetime range filter](/documentation/search/filtering/#datetime-range). Semantic similarity alone does not enforce those constraints. Choose any additional tool or agent around a specific missing capability: fetching a known meeting by ID needs a retrieval tool, while a separate review task may justify another agent.
