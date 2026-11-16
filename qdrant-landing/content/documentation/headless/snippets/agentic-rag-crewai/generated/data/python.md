```python
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
```
