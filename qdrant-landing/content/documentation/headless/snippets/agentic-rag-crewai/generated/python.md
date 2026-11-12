```python
#!/usr/bin/env -S uv run --script

import argparse
import os
import uuid
from typing import Any

from crewai import LLM, Agent, Crew, Process, Task
from crewai.tools import BaseTool
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient, models

load_dotenv()

COLLECTION = "meeting-notes"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
CLAUDE_MODEL = "anthropic/claude-opus-5-5"

MEETINGS: list[dict[str, Any]] = [
    {
        "topic": "Marketing Strategy Review",
        "date": "2026-09-02",
        "duration_minutes": 45,
        "attendees": ["Emily", "Michael", "Sarah"],
        "transcript": (
            "Emily: The Q4 campaign budget request is 120k. Michael: Approve 100k now "
            "and hold 20k until the October numbers are in. Sarah: Agreed. We focus "
            "the first wave on the developer newsletter and two conference sponsorships. "
            "Emily: Decision recorded: 100k approved, developer newsletter and two "
            "conferences for wave one, review on 15 October."
        ),
    },
    {
        "topic": "Marketing Weekly Sync",
        "date": "2026-09-09",
        "duration_minutes": 30,
        "attendees": ["Emily", "Sarah"],
        "transcript": (
            "Sarah: Newsletter open rate went from 31 to 38 percent after the redesign. "
            "Emily: Good. The conference shortlist is down to Berlin and Lisbon. "
            "Sarah: Lisbon has the better developer audience. Emily: Let's propose "
            "Lisbon at the strategy review. Social video is paused until we hire."
        ),
    },
    {
        "topic": "Product Roadmap Planning",
        "date": "2026-09-04",
        "duration_minutes": 60,
        "attendees": ["Michael", "Priya", "Tom"],
        "transcript": (
            "Priya: The hybrid search feature ships in October. Tom: We need the "
            "filtering docs updated before launch. Michael: Marketing wants a launch "
            "post for the same week. Priya: Fine, but no date promises in public "
            "before QA signs off."
        ),
    },
    {
        "topic": "Engineering Standup",
        "date": "2026-09-05",
        "duration_minutes": 15,
        "attendees": ["Priya", "Tom", "Lena"],
        "transcript": (
            "Tom: Finished the payload index migration. Lena: Reviewing the ingestion "
            "retry logic today. Priya: Blocker is the staging cluster being out of disk."
        ),
    },
    {
        "topic": "Marketing and Sales Alignment",
        "date": "2026-09-16",
        "duration_minutes": 50,
        "attendees": ["Emily", "Sarah", "Daniel"],
        "transcript": (
            "Daniel: Sales needs leads tagged by use case, not just by source. "
            "Emily: We can add a use-case field to the newsletter signup. Sarah: The "
            "Q4 campaign landing pages will carry the same field. Daniel: Then sales "
            "can route retrieval and recommendation leads to different reps."
        ),
    },
    {
        "topic": "Customer Support Retrospective",
        "date": "2026-09-11",
        "duration_minutes": 40,
        "attendees": ["Lena", "Daniel", "Noor"],
        "transcript": (
            "Noor: Ticket volume dropped 20 percent after the filtering docs rewrite. "
            "Lena: Most remaining tickets are about collection sizing. Daniel: Let's "
            "ask marketing for a sizing guide in the next newsletter."
        ),
    },
]

def get_client() -> QdrantClient:
    return QdrantClient(
        url=os.environ["QDRANT_URL"],
        api_key=os.environ.get("QDRANT_API_KEY"),
    )

def create_collection(client: QdrantClient) -> None:
    if client.collection_exists(COLLECTION):
        return
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(
            size=client.get_embedding_size(EMBEDDING_MODEL),
            distance=models.Distance.COSINE,
        ),
    )

def ingest(client: QdrantClient) -> None:
    points = []
    for meeting in MEETINGS:
        text = f"{meeting['topic']} ({meeting['date']}): {meeting['transcript']}"
        points.append(
            models.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, meeting["topic"] + meeting["date"])),
                vector=models.Document(text=text, model=EMBEDDING_MODEL),
                payload=meeting,
            )
        )
    client.upsert(collection_name=COLLECTION, points=points)

def search_meetings(client: QdrantClient, query: str, limit: int = 3) -> list[dict[str, Any]]:
    response = client.query_points(
        collection_name=COLLECTION,
        query=models.Document(text=query, model=EMBEDDING_MODEL),
        limit=limit,
        with_payload=True,
    )
    results = []
    for point in response.points:
        payload = point.payload or {}
        results.append(
            {
                "topic": payload["topic"],
                "date": payload["date"],
                "duration_minutes": payload["duration_minutes"],
                "score": round(point.score, 3),
                "transcript": payload["transcript"],
            }
        )
    return results

class SearchInput(BaseModel):
    query: str = Field(description="What to look for in the meeting notes")

class SearchMeetingsTool(BaseTool):
    name: str = "search_meetings"
    description: str = (
        "Semantic search over meeting transcripts. Returns the closest meetings "
        "with topic, date, duration in minutes, similarity score and transcript."
    )
    args_schema: type[BaseModel] = SearchInput

    def _run(self, query: str) -> str:
        results = search_meetings(get_client(), query)
        lines = []
        for r in results:
            lines.append(
                f"- {r['topic']} on {r['date']}, {r['duration_minutes']} min, "
                f"score {r['score']}: {r['transcript']}"
            )
        return "\n".join(lines) or "No matching meetings."

def build_crew(question: str) -> Crew:
    llm = LLM(model=CLAUDE_MODEL, max_tokens=4096)

    researcher = Agent(
        role="Meeting Researcher",
        goal="Find every meeting relevant to the question and report only what the transcripts say",
        backstory="You search the meeting archive and quote evidence. You never guess.",
        tools=[SearchMeetingsTool()],
        llm=llm,
        verbose=True,
    )
    writer = Agent(
        role="Answer Writer",
        goal="Turn the researcher's findings into a short, grounded answer",
        backstory="You write for a busy manager. Every claim cites a meeting and date.",
        llm=llm,
        verbose=True,
    )

    research = Task(
        description=(
            f"Question: {question}\n"
            "Use the search_meetings tool, at least once, with a query that matches the question. "
            "List each relevant meeting with its date, duration and the exact lines that answer the question. "
            "If the transcripts do not answer part of the question, say so."
        ),
        expected_output="A bullet list of relevant meetings with dates, durations and quoted evidence.",
        agent=researcher,
    )
    answer = Task(
        description=(
            f"Question: {question}\n"
            "Write the answer in at most five sentences using only the researcher's findings. "
            "Cite the meeting topic and date for each fact. If a number is asked for, show the calculation."
        ),
        expected_output="A short grounded answer with citations.",
        agent=writer,
        context=[research],
    )
    return Crew(agents=[researcher, writer], tasks=[research, answer], process=Process.sequential)

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ingest", action="store_true", help="Create the collection and load the sample meetings")
    parser.add_argument("--ask", help="Question to answer from the meeting notes")
    args = parser.parse_args()

    client = get_client()
    if args.ingest:
        create_collection(client)
        ingest(client)
        print(f"Loaded {client.count(COLLECTION).count} meetings into '{COLLECTION}'")
    if args.ask:
        print("Retrieved for the question:")
        for r in search_meetings(client, args.ask):
            print(f"  {r['score']}  {r['topic']} ({r['date']}, {r['duration_minutes']} min)")
        result = build_crew(args.ask).kickoff()
        print("\nAnswer:\n" + str(result))

if __name__ == "__main__":
    main()
```
