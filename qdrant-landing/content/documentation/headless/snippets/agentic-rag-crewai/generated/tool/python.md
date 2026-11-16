```python
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
```
