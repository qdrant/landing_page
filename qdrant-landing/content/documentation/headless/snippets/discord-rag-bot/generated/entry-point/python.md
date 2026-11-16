```python
def main() -> None:
    parser = argparse.ArgumentParser(description="A fixed-flow Qdrant RAG Discord bot")
    parser.add_argument("command", choices=["ingest", "bot"])
    args = parser.parse_args()
    retriever = build_retriever()
    if args.command == "ingest":
        ingest(retriever)
    else:
        asyncio.run(run_bot(retriever))

if __name__ == "__main__":
    main()
```
