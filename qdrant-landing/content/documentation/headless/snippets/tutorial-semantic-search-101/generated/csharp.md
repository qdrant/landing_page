```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

		var client = new QdrantClient(
			host: QDRANT_URL,
			port: 6334,
			https: true,
			apiKey: QDRANT_API_KEY
		);

		string COLLECTION_NAME = "my_books";

		await client.CreateCollectionAsync(
			collectionName: COLLECTION_NAME,
			vectorsConfig: new VectorParams { Size = 384, Distance = Distance.Cosine }
		);

		var payloads = new List<Dictionary<string, Value>>
		{
			new() { ["name"] = "The Time Machine", ["description"] = "A man travels through time and witnesses the evolution of humanity.", ["author"] = "H.G. Wells", ["year"] = 1895 },
			new() { ["name"] = "Ender's Game", ["description"] = "A young boy is trained to become a military leader in a war against an alien race.", ["author"] = "Orson Scott Card", ["year"] = 1985 },
			new() { ["name"] = "Brave New World", ["description"] = "A dystopian society where people are genetically engineered and conditioned to conform to a strict social hierarchy.", ["author"] = "Aldous Huxley", ["year"] = 1932 },
			new() { ["name"] = "The Hitchhiker's Guide to the Galaxy", ["description"] = "A comedic science fiction series following the misadventures of an unwitting human and his alien friend.", ["author"] = "Douglas Adams", ["year"] = 1979 },
			new() { ["name"] = "Dune", ["description"] = "A desert planet is the site of political intrigue and power struggles.", ["author"] = "Frank Herbert", ["year"] = 1965 },
			new() { ["name"] = "Foundation", ["description"] = "A mathematician develops a science to predict the future of humanity and works to save civilization from collapse.", ["author"] = "Isaac Asimov", ["year"] = 1951 },
			new() { ["name"] = "Snow Crash", ["description"] = "A futuristic world where the internet has evolved into a virtual reality metaverse.", ["author"] = "Neal Stephenson", ["year"] = 1992 },
			new() { ["name"] = "Neuromancer", ["description"] = "A hacker is hired to pull off a near-impossible hack and gets pulled into a web of intrigue.", ["author"] = "William Gibson", ["year"] = 1984 },
			new() { ["name"] = "The War of the Worlds", ["description"] = "A Martian invasion of Earth throws humanity into chaos.", ["author"] = "H.G. Wells", ["year"] = 1898 },
			new() { ["name"] = "The Hunger Games", ["description"] = "A dystopian society where teenagers are forced to fight to the death in a televised spectacle.", ["author"] = "Suzanne Collins", ["year"] = 2008 },
			new() { ["name"] = "The Andromeda Strain", ["description"] = "A deadly virus from outer space threatens to wipe out humanity.", ["author"] = "Michael Crichton", ["year"] = 1969 },
			new() { ["name"] = "The Left Hand of Darkness", ["description"] = "A human ambassador is sent to a planet where the inhabitants are genderless and can change gender at will.", ["author"] = "Ursula K. Le Guin", ["year"] = 1969 },
			new() { ["name"] = "The Three-Body Problem", ["description"] = "Humans encounter an alien civilization that lives in a dying system.", ["author"] = "Liu Cixin", ["year"] = 2008 }
		};

		string EMBEDDING_MODEL = "sentence-transformers/all-minilm-l6-v2";

		var points = new List<PointStruct>();

		for (ulong idx = 0; idx < (ulong)payloads.Count; idx++)
		{
			var payload = payloads[(int)idx];
			string description = payload["description"].StringValue;

			var point = new PointStruct
			{
				Id = idx,
				Vectors = new Document
				{
					Text = description,
					Model = EMBEDDING_MODEL
				},
				Payload = { payload }
			};

			points.Add(point);
		}

		await client.UpsertAsync(
			collectionName: COLLECTION_NAME,
			points: points
		);

		var hits = await client.QueryAsync(
			collectionName: COLLECTION_NAME,
			query: new Document
			{
				Text = "alien invasion",
				Model = EMBEDDING_MODEL
			},
			limit: 3
		);

		foreach (var hit in hits)
		{
			Console.WriteLine($"{hit.Payload} score: {hit.Score}");
		}

		await client.CreatePayloadIndexAsync(
			collectionName: COLLECTION_NAME,
			fieldName: "year",
			schemaType: PayloadSchemaType.Integer
		);

		var filteredHits = await client.QueryAsync(
			collectionName: COLLECTION_NAME,
			query: new Document
			{
				Text = "alien invasion",
				Model = EMBEDDING_MODEL
			},
			filter: new Filter
			{
				Must = { Range("year", new Qdrant.Client.Grpc.Range { Gte = 2000.0 }) }
			},
			limit: 1
		);

		foreach (var hit in filteredHits)
		{
			Console.WriteLine($"{hit.Payload} score: {hit.Score}");
		}
```
