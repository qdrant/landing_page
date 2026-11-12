```python
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
```
