using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;
using Chunk = (string Url, string Anchor, int ChunkNum, string Text, string SectionUrl, string ContentHash, string PointId);

public class Snippet
{
	public static async Task Run()
	{
		// @block-start client-connection
		// The .NET client takes a host and port rather than a URL, so only the API key is read
		// from the environment. Replace the host with your own from https://cloud.qdrant.io
		var client = new QdrantClient(
			host: "xyz-example.qdrant.io",
			https: true,
			apiKey: Environment.GetEnvironmentVariable("QDRANT_API_KEY")
		);
		// @block-end client-connection

		// @block-start chunks
		var CHUNKS = new List<Chunk>
		{
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "prerequisites",
				ChunkNum: 0,
				Text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "step-2-enable-tls",
				ChunkNum: 0,
				Text: "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "step-3-enable-an-admin-api-key",
				ChunkNum: 0,
				Text: "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
		};
		// @block-end chunks

		// @block-start identity-and-fingerprint
		string Sha256Hex(string text) =>
			Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))).ToLowerInvariant();

		string ContentHash(string text) => Sha256Hex(text);

		// .NET has no UUIDv5, so the point ID is a Guid built from the first 16 bytes of the
		// address hash. Just as stable and deterministic, but it does not match the Python tab's
		// uuid5 values, so every ID, bucket, and digest printed in this tutorial is Python's.
		string PointIdFor(string url, string anchor, int num) =>
			new Guid(SHA256.HashData(Encoding.UTF8.GetBytes($"{url}#{anchor}::{num}")).AsSpan(0, 16)).ToString();

		// Attach the derived values every later step depends on.
		List<Chunk> Prepare(List<Chunk> chunks)
		{
			var prepared = new List<Chunk>();
			foreach (var c in chunks)
			{
				// Run c.Text through your normalization pass before hashing it.
				prepared.Add(c with
				{
					SectionUrl = c.Anchor != "" ? $"{c.Url}#{c.Anchor}" : c.Url,
					ContentHash = ContentHash(c.Text),
					PointId = PointIdFor(c.Url, c.Anchor, c.ChunkNum),
				});
			}
			return prepared;
		}
		// @block-end identity-and-fingerprint

		// @block-start buckets
		const int N_BUCKETS = 16; // use something much larger in production
		const int GROUP_SIZE = 4; // bucket digests packed per summary point; 16 / 4 = 4 groups

		int Bucket(string pid)
		{
			// the whole 256-bit hash as one number, then modulo N_BUCKETS
			var full = new BigInteger(SHA256.HashData(Encoding.UTF8.GetBytes(pid)), isUnsigned: true, isBigEndian: true);
			return (int)(full % N_BUCKETS);
		}

		// The buckets printed in the tutorial come from the Python point IDs; this file derives its own.
		foreach (var c in Prepare(CHUNKS))
			Console.WriteLine($"{Bucket(c.PointId)} {c.PointId} {c.SectionUrl}");
		// @block-end buckets

		// @block-start digests
		long ChunkDigest(string pid, string chash)
		{
			// First 15 hex digits of the combined hash = a 60-bit number.
			// 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
			var combined = Sha256Hex(pid + chash);
			return Convert.ToInt64(combined[..15], 16);
		}

		long[] ComputeDigests(List<Chunk> chunks)
		{
			var digests = new long[N_BUCKETS];
			foreach (var c in chunks)
			{
				var b = Bucket(c.PointId);
				digests[b] ^= ChunkDigest(c.PointId, c.ContentHash);
			}
			return digests;
		}

		ComputeDigests(Prepare(CHUNKS));
		// @block-end digests

		// @block-start create-collection
		var MAIN = "docs-sync-scale";
		var MODEL = "sentence-transformers/all-MiniLM-L6-v2";

		if (!await client.CollectionExistsAsync(MAIN))
		{
			await client.CreateCollectionAsync(
				collectionName: MAIN,
				vectorsConfig: new VectorParams
				{
					Size = 384,
					Distance = Distance.Cosine
				},
				metadata: new()
				{
					["embedding_model"] = MODEL,
					["pipeline_version"] = "1"
				}
			);
			await client.CreatePayloadIndexAsync(MAIN, "sync_bucket", PayloadSchemaType.Integer);
		}
		// @block-end create-collection

		// @block-start payload
		Dictionary<string, Value> Payload(Chunk c) => new()
		{
			["url"] = c.Url,
			["anchor"] = c.Anchor,
			["chunk_num"] = c.ChunkNum,
			["section_url"] = c.SectionUrl,
			["text"] = c.Text,
			["content_hash"] = c.ContentHash,
			["sync_bucket"] = Bucket(c.PointId),
		};
		// @block-end payload

		// @block-start populate
		List<PointStruct> AsPoints(List<Chunk> chunks) =>
			chunks.Select(c => new PointStruct
			{
				Id = new PointId { Uuid = c.PointId },
				Vectors = new Document { Text = c.Text, Model = MODEL }, // embedded by Qdrant Cloud Inference
				Payload = { Payload(c) },
			}).ToList();

		await client.UpsertAsync(MAIN, points: AsPoints(Prepare(CHUNKS)), wait: true);
		// @block-end populate

		// @block-start summary-collection
		var META = "docs-sync-digests";
		const int N_META = N_BUCKETS / GROUP_SIZE;

		if (!await client.CollectionExistsAsync(META))
		{
			await client.CreateCollectionAsync(
				collectionName: META,
				vectorsConfig: new VectorParams
				{
					Size = 1,
					Distance = Distance.Cosine
				}
			);
		}
		// @block-end summary-collection

		// @block-start summary-read-write
		// Store bucket digests in the summary collection, one point per group.
		// digests: the full list of N_BUCKETS digests.
		// groups:  which group points to rewrite; null rewrites all of them.
		async Task WriteMeta(long[] digests, IEnumerable<int>? groups = null)
		{
			groups ??= Enumerable.Range(0, N_META);

			var points = new List<PointStruct>();
			foreach (var g in groups)
			{
				// group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
				var start = g * GROUP_SIZE;
				var groupDigests = digests[start..(start + GROUP_SIZE)].Select(d => (Value)d).ToArray();
				points.Add(new PointStruct
				{
					Id = new PointId { Num = (ulong)g },
					Vectors = new float[] { 1.0f }, // dummy: this collection is never searched
					Payload = { ["group"] = g, ["digests"] = groupDigests },
				});
			}
			await client.UpsertAsync(META, points: points, wait: true);
		}

		// Read the summary back as a flat list of N_BUCKETS digests.
		async Task<long[]> ReadMeta()
		{
			var digests = new long[N_BUCKETS];
			var points = await client.RetrieveAsync(
				META,
				ids: Enumerable.Range(0, N_META).Select(g => new PointId { Num = (ulong)g }).ToList(),
				payloadSelector: true,
				vectorSelector: false
			);

			foreach (var point in points)
			{
				var g = (int)point.Payload["group"].IntegerValue;
				var groupDigests = point.Payload["digests"].ListValue.Values;
				for (var slot = 0; slot < groupDigests.Count; slot++)
					digests[g * GROUP_SIZE + slot] = groupDigests[slot].IntegerValue;
			}
			return digests;
		}

		await WriteMeta(ComputeDigests(Prepare(CHUNKS)));
		await ReadMeta();
		// @block-end summary-read-write

		// @block-start latest-chunks
		var LATEST = new List<Chunk>
		{
			// unchanged
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "prerequisites",
				ChunkNum: 0,
				Text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
			// edited text
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "step-2-enable-tls",
				ChunkNum: 0,
				Text: "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
			// step-3 removed; new step-4 added
			(
				Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
				Anchor: "step-4-restrict-access",
				ChunkNum: 0,
				Text: "Step 4: Restrict access with read-only API keys for untrusted clients ...",
				SectionUrl: "", ContentHash: "", PointId: ""
			),
		};
		// @block-end latest-chunks

		// @block-start changed-buckets
		var latest = Prepare(LATEST);
		var source = ComputeDigests(latest); // digests of the edited source
		var stored = await ReadMeta();       // digests Qdrant currently holds

		var changedBuckets = new List<int>();
		for (var b = 0; b < N_BUCKETS; b++)
			if (source[b] != stored[b])
				changedBuckets.Add(b);

		Console.WriteLine(string.Join(", ", changedBuckets));
		// @block-end changed-buckets

		// @block-start read-bucket
		// Return a map of point ID to content hash for every chunk stored in bucket b.
		// Pages through the results so nothing is missed in a large bucket.
		async Task<Dictionary<string, string>> ReadBucket(int b)
		{
			var stored = new Dictionary<string, string>();
			PointId? offset = null;

			while (true)
			{
				var response = await client.ScrollAsync(
					MAIN,
					filter: new Filter { Must = { Match("sync_bucket", b) } },
					limit: 1000,
					offset: offset,
					payloadSelector: new[] { "content_hash" },
					vectorsSelector: false
				);

				foreach (var point in response.Result)
					stored[point.Id.Uuid] = point.Payload["content_hash"].StringValue;

				offset = response.NextPageOffset;
				if (offset is null)
					return stored;
			}
		}
		// @block-end read-bucket

		// @block-start reconcile-bucket
		// Make bucket b in Qdrant match sourceChunks. Returns the counts of what it did.
		async Task<(int added, int reEmbedded, int deleted)> ReconcileBucket(int b, Dictionary<string, Chunk> sourceChunks)
		{
			var stored = await ReadBucket(b); // point ID -> content hash currently in Qdrant

			var toWrite = new List<Chunk>();  // new or content-changed chunks: embed and upsert
			int added = 0, reEmbedded = 0;
			foreach (var (pid, chunk) in sourceChunks)
			{
				if (!stored.TryGetValue(pid, out var storedHash))
				{
					toWrite.Add(chunk);       // new chunk in this bucket
					added++;
				}
				else if (storedHash != chunk.ContentHash)
				{
					toWrite.Add(chunk);       // same chunk, changed text
					reEmbedded++;
				}
			}

			// chunks Qdrant has but the source no longer does
			var toDelete = stored.Keys.Where(pid => !sourceChunks.ContainsKey(pid)).Select(Guid.Parse).ToList();

			if (toWrite.Count > 0)
				await client.UpsertAsync(MAIN, points: AsPoints(toWrite), wait: true);
			if (toDelete.Count > 0)
				await client.DeleteAsync(MAIN, ids: toDelete, wait: true);

			return (added, reEmbedded, toDelete.Count);
		}
		// @block-end reconcile-bucket

		// @block-start sync
		async Task<(List<int> changedBuckets, int added, int reEmbedded, int deleted)> Sync(List<Chunk> latestChunks)
		{
			var latest = Prepare(latestChunks);

			// group the source chunks by bucket once
			var sourceByBucket = new Dictionary<int, Dictionary<string, Chunk>>();
			foreach (var c in latest)
			{
				if (!sourceByBucket.TryGetValue(Bucket(c.PointId), out var inBucket))
					sourceByBucket[Bucket(c.PointId)] = inBucket = new Dictionary<string, Chunk>();
				inBucket[c.PointId] = c;
			}

			// steps 1-3: which buckets changed
			var source = ComputeDigests(latest);
			var stored = await ReadMeta();
			var changed = new List<int>();
			for (var b = 0; b < N_BUCKETS; b++)
				if (source[b] != stored[b])
					changed.Add(b);

			// step 4: reconcile each changed bucket
			int added = 0, reEmbedded = 0, deleted = 0;
			foreach (var b in changed)
			{
				var counts = await ReconcileBucket(b, sourceByBucket.GetValueOrDefault(b, new Dictionary<string, Chunk>()));
				added += counts.added;
				reEmbedded += counts.reEmbedded;
				deleted += counts.deleted;
			}

			// step 5: rewrite only the changed groups of the summary, after the data writes
			var changedGroups = changed.Select(b => b / GROUP_SIZE).Distinct().ToList();
			await WriteMeta(source, changedGroups);

			return (changed, added, reEmbedded, deleted);
		}
		// @block-end sync

		// @block-start run-sync
		var run = await Sync(LATEST);
		Console.WriteLine(
			$"changed_buckets: [{string.Join(", ", run.changedBuckets)}], added: {run.added}, " +
			$"re_embedded: {run.reEmbedded}, deleted: {run.deleted}");
		// @block-end run-sync
	}

}
