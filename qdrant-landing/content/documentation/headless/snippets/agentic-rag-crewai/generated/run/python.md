```python
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
