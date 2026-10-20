```python
class DiscordRAGBot(discord.Client):
    def __init__(self, retriever: VectorRetriever) -> None:
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(
            intents=intents, allowed_mentions=discord.AllowedMentions.none()
        )
        self.retriever = retriever
        self.answer_lock = asyncio.Lock()

    async def on_ready(self) -> None:
        print(f"Connected as {self.user}. Send !ask followed by a Qdrant question.")

    async def on_message(self, message: discord.Message) -> None:
        is_command = message.content == "!ask" or message.content.startswith("!ask ")
        if message.author.bot or not is_command:
            return
        question = message.content[len("!ask") :].strip()
        if not question:
            await message.channel.send("Usage: !ask <your Qdrant question>")
            return
        async with self.answer_lock, message.channel.typing():
            try:
                answer = await asyncio.to_thread(
                    answer_question, self.retriever, question
                )
            except Exception:
                logger.exception("Could not answer the Discord question")
                await message.channel.send(
                    "I couldn't answer that request. Check the bot's terminal log."
                )
                return
        for start in range(0, len(answer), 1900):
            await message.channel.send(answer[start : start + 1900])

def create_discord_client(retriever: VectorRetriever) -> DiscordRAGBot:
    if not retriever.storage.status().vector_count:
        raise ValueError("The collection is empty. Run ingestion first.")
    return DiscordRAGBot(retriever)

async def run_bot(retriever: VectorRetriever) -> None:
    client = create_discord_client(retriever)
    async with client:
        await client.start(required_env("DISCORD_BOT_TOKEN"))
```
