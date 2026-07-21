using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;
using Chunk = (string Url, string Anchor, int ChunkNum, string Text, string SectionUrl, string ContentHash, string PointId);

public class Snippet
{
	public static async Task Run()
	{
		// @block-start client-connection
		// Replace the host and API key with your own from https://cloud.qdrant.io
		var client = new QdrantClient(
			host: "xyz-example.qdrant.io",
			https: true,
			apiKey: "<your-api-key>"
		);
		// @block-end client-connection

		// @hide-start
		// data and text normalization are not the lesson of this tutorial:
		// the full CHUNKS list and Normalize() live in the tutorial notebook
		var CHUNKS = new List<Chunk>
		{
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "prerequisites",
				ChunkNum: 0,
				Text: "Prerequisites - Docker and Docker Compose installed - `curl` available in your terminal ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "step-3-enable-an-admin-api-key",
				ChunkNum: 0,
				Text: "Step 3: Enable an Admin API Key Without enabling authentication, anyone with network access ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
		};

		string Normalize(string text) => Regex.Replace(text, @"\s+", " ").Trim();
		// @hide-end

		// @block-start create-collection
		var MODEL = "sentence-transformers/all-MiniLM-L6-v2";
		var PIPELINE = "docs-prep-pipeline-v1";
		var COLLECTION = "docs-sync-tutorial";

		await client.CreateCollectionAsync(
			collectionName: COLLECTION,
			vectorsConfig: new VectorParams
			{
				Size = 384, // all-MiniLM-L6-v2 output dimension
				Distance = Distance.Cosine
			},
			metadata: new()
			{
				["embedding_model"] = MODEL,
				["pipeline_version"] = PIPELINE
			}
		);
		// @block-end create-collection

		// @block-start check-gate
		async Task CheckGate()
		{
			// compare this pipeline's constants against what the collection records about itself
			var meta = (await client.GetCollectionInfoAsync(COLLECTION)).Config.Metadata;
			var model = meta.GetValueOrDefault("embedding_model")?.StringValue;
			var pipeline = meta.GetValueOrDefault("pipeline_version")?.StringValue;

			if (model != MODEL || pipeline != PIPELINE)
				throw new InvalidOperationException(
					$"collection was built by {model}/{pipeline}: full re-embed into a fresh collection required");
		}
		// @block-end check-gate

		// @block-start identity-and-fingerprint
		string ContentHash(string text) =>
			Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))).ToLowerInvariant();

		// Qdrant accepts any well-formed UUID as a point ID:
		// a Guid built from the first 16 bytes of the address hash, so the same address always yields the same ID
		string PointIdFor(string url, string anchor, int num) =>
			new Guid(SHA256.HashData(Encoding.UTF8.GetBytes($"{url}#{anchor}::{num}")).AsSpan(0, 16)).ToString();

		// Derive both values (and the section address) for every raw chunk.
		List<Chunk> PrepareChunksForSync(List<Chunk> chunks)
		{
			var prepared = new List<Chunk>();
			foreach (var c in chunks)
			{
				var text = Normalize(c.Text);
				prepared.Add(c with
				{
					Text = text,
					SectionUrl = c.Anchor != "" ? $"{c.Url}#{c.Anchor}" : c.Url,
					ContentHash = ContentHash(text),
					PointId = PointIdFor(c.Url, c.Anchor, c.ChunkNum),
				});
			}
			return prepared;
		}
		// @block-end identity-and-fingerprint

		// @block-start payload
		Dictionary<string, Value> Payload(Chunk chunk, string? lastUpdated = null) => new()
		{
			["url"] = chunk.Url,
			["anchor"] = chunk.Anchor,
			["chunk_num"] = chunk.ChunkNum,
			["section_url"] = chunk.SectionUrl,
			["text"] = chunk.Text,
			["content_hash"] = chunk.ContentHash,
			["last_updated"] = lastUpdated ?? DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssK"),
		};
		// @block-end payload

		// @block-start payload-indexes
		foreach (var field in new[] { "content_hash", "url", "section_url" })
			await client.CreatePayloadIndexAsync(COLLECTION, field, PayloadSchemaType.Keyword);
		// @block-end payload-indexes

		// @block-start populate
		await client.UpsertAsync(
			collectionName: COLLECTION,
			points: PrepareChunksForSync(CHUNKS).Select(c => new PointStruct
			{
				Id = new PointId { Uuid = c.PointId },
				Vectors = new Document { Text = c.Text, Model = MODEL },
				Payload = { Payload(c) },
			}).ToList(),
			wait: true
		);
		// @block-end populate

		// @block-start search
		var QUERY = "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?";

		await client.QueryAsync(
			collectionName: COLLECTION,
			query: new Document { Text = QUERY, Model = MODEL },
			limit: 3,
			payloadSelector: new[] { "section_url", "text" }
		);
		// @block-end search

		// @hide-start
		// the simulated month of edits (LATEST_CHUNKS) is spelled out in the tutorial and the notebook
		var LATEST_CHUNKS = PrepareChunksForSync(CHUNKS);
		// @hide-end

		// @block-start split-by-state
		// Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
		async Task<(Dictionary<string, Chunk> incomingIds, List<Chunk> unchanged, List<Chunk> contentChanged, List<Chunk> unknownIds)>
			SplitByState(List<Chunk> latestChunks)
		{
			var incoming = latestChunks.ToDictionary(c => c.PointId);

			var stored = new Dictionary<string, string>();
			var points = await client.RetrieveAsync(
				COLLECTION,
				ids: incoming.Keys.Select(pid => new PointId { Uuid = pid }).ToList(),
				payloadSelector: new[] { "content_hash" },
				vectorSelector: false
			);
			foreach (var p in points)
				stored[p.Id.Uuid] = p.Payload["content_hash"].StringValue;

			var unchanged = new List<Chunk>();
			var contentChanged = new List<Chunk>();
			var unknownIds = new List<Chunk>();
			foreach (var (pid, c) in incoming)
			{
				if (stored.TryGetValue(pid, out var hash) && hash == c.ContentHash)
					unchanged.Add(c);
				else if (stored.ContainsKey(pid))
					contentChanged.Add(c);
				else
					unknownIds.Add(c);
			}

			return (incoming, unchanged, contentChanged, unknownIds);
		}

		var splitState = await SplitByState(LATEST_CHUNKS);
		// @block-end split-by-state

		// @block-start re-embed-changed
		async Task ReEmbedChanged(List<Chunk> contentChanged)
		{
			if (contentChanged.Count == 0)
				return;
			await client.UpsertAsync(
				collectionName: COLLECTION,
				points: contentChanged.Select(c => new PointStruct
				{
					Id = new PointId { Uuid = c.PointId },
					Vectors = new Document { Text = c.Text, Model = MODEL },
					Payload = { Payload(c) },
				}).ToList(),
				wait: true
			);
		}
		// @block-end re-embed-changed

		// @block-start reuse-or-add
		// Reuse an existing embedding when the same text is already stored; embed only what is new.
		async Task<(int reused, int added)> ReuseOrAdd(List<Chunk> unknownIds)
		{
			int reused = 0, added = 0;

			foreach (var c in unknownIds)
			{
				var sameText = new Filter
				{
					Must = { MatchKeyword("content_hash", c.ContentHash) }
				};
				var hits = (await client.ScrollAsync(
					COLLECTION,
					filter: sameText,
					limit: 1,
					payloadSelector: new[] { "last_updated" },
					vectorsSelector: true
				)).Result;

				PointStruct point;
				if (hits.Count > 0) // same text, new address: copy the vector, keep its last_updated
				{
					point = new PointStruct
					{
						Id = new PointId { Uuid = c.PointId },
						Vectors = hits[0].Vectors.Vector.GetDenseVector()!.Data.ToArray(),
						Payload = { Payload(c, hits[0].Payload["last_updated"].StringValue) },
					};
					reused++;
				}
				else // genuinely new content: embed and insert
				{
					point = new PointStruct
					{
						Id = new PointId { Uuid = c.PointId },
						Vectors = new Document { Text = c.Text, Model = MODEL },
						Payload = { Payload(c) },
					};
					added++;
				}

				await client.UpsertAsync(COLLECTION, points: new List<PointStruct> { point }, wait: true);
			}

			return (reused, added);
		}
		// @block-end reuse-or-add

		// @block-start delete-gone
		// Remove every point the current crawl no longer contains. Returns how many.
		async Task<ulong> DeleteGone(Dictionary<string, Chunk> incomingIds)
		{
			if (incomingIds.Count == 0)
				throw new ArgumentException("Refusing to delete from an empty source snapshot.");

			var stale = new Filter
			{
				MustNot = { HasId(incomingIds.Keys.Select(Guid.Parse).ToList()) }
			};

			var toDelete = await client.CountAsync(COLLECTION, filter: stale);

			// potential check against a threshold to avoid accidental mass deletion could be added here
			await client.DeleteAsync(COLLECTION, filter: stale, wait: true);
			return toDelete;
		}
		// @block-end delete-gone

		// @block-start sync
		async Task<Dictionary<string, long>> Sync(List<Chunk> latestChunks)
		{
			await CheckGate(); // refuse to mix embedding models or pipeline versions

			var chunks = PrepareChunksForSync(latestChunks);
			var (incomingIds, unchanged, contentChanged, unknownIds) = await SplitByState(chunks);

			await ReEmbedChanged(contentChanged);
			var (reused, added) = await ReuseOrAdd(unknownIds);
			var deleted = await DeleteGone(incomingIds);

			return new Dictionary<string, long>
			{
				["unchanged"] = unchanged.Count,
				["re-embedded"] = contentChanged.Count,
				["reused_embedding"] = reused,
				["added"] = added,
				["deleted"] = (long)deleted,
			};
		}
		// @block-end sync

		// @block-start run-sync
		var run = await Sync(LATEST_CHUNKS);
		foreach (var (op, count) in run)
			Console.WriteLine($"{op}: {count}");
		// @block-end run-sync
	}

}
