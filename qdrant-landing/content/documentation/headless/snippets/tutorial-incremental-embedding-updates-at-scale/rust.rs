use serde_json::{json, Value};
use std::collections::HashMap;

use qdrant_client::qdrant::{
    point_id::PointIdOptions, Condition, CreateCollectionBuilder,
    CreateFieldIndexCollectionBuilder, DeletePointsBuilder, Distance, Document, FieldType, Filter,
    GetPointsBuilder, PayloadIncludeSelector, PointId, PointStruct, PointsIdsList,
    ScrollPointsBuilder, UpsertPointsBuilder, VectorParamsBuilder,
};
use qdrant_client::{Payload, Qdrant};
use sha2::{Digest, Sha256};

pub async fn main() -> anyhow::Result<()> {
    // @block-start client-connection
    let client = Qdrant::from_url(&std::env::var("QDRANT_URL")?)
        .api_key(std::env::var("QDRANT_API_KEY")?)
        .build()?;
    // @block-end client-connection

    // @block-start chunks
    #[derive(Clone, Default)]
    struct Chunk {
        url: String,
        anchor: String,
        chunk_num: u32,
        text: String,
        section_url: String,  // derived in prepare
        content_hash: String, // derived in prepare
        point_id: String,     // derived in prepare
    }

    let chunks: Vec<Chunk> = vec![
        Chunk {
            url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
            anchor: "prerequisites".into(),
            chunk_num: 0,
            text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...".into(),
            ..Default::default()
        },
        Chunk {
            url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
            anchor: "step-2-enable-tls".into(),
            chunk_num: 0,
            text: "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ...".into(),
            ..Default::default()
        },
        Chunk {
            url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
            anchor: "step-3-enable-an-admin-api-key".into(),
            chunk_num: 0,
            text: "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ...".into(),
            ..Default::default()
        },
    ];
    // @block-end chunks

    // @block-start identity-and-fingerprint
    fn content_hash(text: &str) -> String {
        Sha256::digest(text.as_bytes())
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect()
    }

    fn point_id(url: &str, anchor: &str, num: u32) -> String {
        // NAMESPACE_URL is a fixed constant uuid5 requires; it marks the input as a URL-like name
        uuid::Uuid::new_v5(
            &uuid::Uuid::NAMESPACE_URL,
            format!("{url}#{anchor}::{num}").as_bytes(),
        )
        .to_string()
    }

    /// Attach the derived values every later step depends on.
    fn prepare(chunks: &[Chunk]) -> Vec<Chunk> {
        chunks
            .iter()
            .map(|c| {
                // Run c.text through your normalization pass before hashing it.
                Chunk {
                    section_url: if c.anchor.is_empty() {
                        c.url.clone()
                    } else {
                        format!("{}#{}", c.url, c.anchor)
                    },
                    content_hash: content_hash(&c.text),
                    point_id: point_id(&c.url, &c.anchor, c.chunk_num),
                    ..c.clone()
                }
            })
            .collect()
    }
    // @block-end identity-and-fingerprint

    // @block-start buckets
    const N_BUCKETS: usize = 16; // use something much larger in production
    const GROUP_SIZE: usize = 4; // bucket digests packed per summary point; 16 / 4 = 4 groups

    fn bucket(pid: &str) -> usize {
        // reduce the whole 256-bit hash modulo N_BUCKETS, one byte at a time
        Sha256::digest(pid.as_bytes())
            .iter()
            .fold(0usize, |acc, byte| (acc * 256 + *byte as usize) % N_BUCKETS)
    }

    for c in prepare(&chunks) {
        println!("{} {} {}", bucket(&c.point_id), c.point_id, c.section_url);
    }
    // @block-end buckets

    // @block-start digests
    fn chunk_digest(pid: &str, chash: &str) -> u64 {
        // First 15 hex digits of the combined hash = a 60-bit number.
        // 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
        let combined: String = Sha256::digest(format!("{pid}{chash}").as_bytes())
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect();
        u64::from_str_radix(&combined[..15], 16).unwrap_or(0)
    }

    fn compute_digests(chunks: &[Chunk]) -> Vec<u64> {
        let mut digests = vec![0u64; N_BUCKETS];
        for c in chunks {
            let b = bucket(&c.point_id);
            digests[b] ^= chunk_digest(&c.point_id, &c.content_hash);
        }
        digests
    }

    compute_digests(&prepare(&chunks));
    // @block-end digests

    // @block-start create-collection
    const MAIN: &str = "docs-sync-scale";
    const MODEL: &str = "sentence-transformers/all-MiniLM-L6-v2";

    if !client.collection_exists(MAIN).await? {
        let mut metadata: HashMap<String, Value> = HashMap::new();
        metadata.insert("embedding_model".to_string(), json!(MODEL));
        metadata.insert("pipeline_version".to_string(), json!("1"));

        client
            .create_collection(
                CreateCollectionBuilder::new(MAIN)
                    .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine))
                    .metadata(metadata),
            )
            .await?;
        client
            .create_field_index(CreateFieldIndexCollectionBuilder::new(
                MAIN,
                "sync_bucket",
                FieldType::Integer,
            ))
            .await?;
    }
    // @block-end create-collection

    // @block-start payload
    fn payload(c: &Chunk) -> anyhow::Result<Payload> {
        Ok(Payload::try_from(json!({
            "url": c.url,
            "anchor": c.anchor,
            "chunk_num": c.chunk_num,
            "section_url": c.section_url,
            "text": c.text,
            "content_hash": c.content_hash,
            "sync_bucket": bucket(&c.point_id),
        }))?)
    }
    // @block-end payload

    // @block-start populate
    fn as_points(chunks: &[Chunk]) -> anyhow::Result<Vec<PointStruct>> {
        chunks
            .iter()
            .map(|c| {
                Ok(PointStruct::new(
                    c.point_id.clone(),
                    Document::new(&c.text, MODEL), // embedded by Qdrant Cloud Inference
                    payload(c)?,
                ))
            })
            .collect()
    }

    client
        .upsert_points(UpsertPointsBuilder::new(MAIN, as_points(&prepare(&chunks))?).wait(true))
        .await?;
    // @block-end populate

    // @block-start summary-collection
    const META: &str = "docs-sync-digests";
    const N_META: usize = N_BUCKETS / GROUP_SIZE;

    if !client.collection_exists(META).await? {
        client
            .create_collection(
                CreateCollectionBuilder::new(META)
                    .vectors_config(VectorParamsBuilder::new(1, Distance::Cosine)),
            )
            .await?;
    }
    // @block-end summary-collection

    // @block-start summary-read-write
    /// Store bucket digests in the summary collection, one point per group.
    ///
    /// digests: the full list of N_BUCKETS digests.
    /// groups:  which group points to rewrite; None rewrites all of them.
    async fn write_meta(
        client: &Qdrant,
        digests: &[u64],
        groups: Option<&[usize]>,
    ) -> anyhow::Result<()> {
        let all: Vec<usize> = (0..N_META).collect();
        let groups = groups.unwrap_or(&all);

        let mut points = Vec::new();
        for &g in groups {
            // group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
            let start = g * GROUP_SIZE;
            let group_digests = &digests[start..start + GROUP_SIZE];
            points.push(PointStruct::new(
                g as u64,
                vec![1.0f32], // dummy: this collection is never searched
                Payload::try_from(json!({"group": g, "digests": group_digests}))?,
            ));
        }
        client
            .upsert_points(UpsertPointsBuilder::new(META, points).wait(true))
            .await?;
        Ok(())
    }

    /// Read the summary back as a flat list of N_BUCKETS digests.
    async fn read_meta(client: &Qdrant) -> anyhow::Result<Vec<u64>> {
        let mut digests = vec![0u64; N_BUCKETS];
        let ids: Vec<PointId> = (0..N_META as u64).map(PointId::from).collect();

        let points = client
            .get_points(GetPointsBuilder::new(META, ids).with_payload(true))
            .await?;

        for point in points.result {
            let g = point.get("group").as_integer().unwrap_or(0) as usize;
            for (slot, digest) in point
                .get("digests")
                .as_list()
                .unwrap_or_default()
                .iter()
                .enumerate()
            {
                digests[g * GROUP_SIZE + slot] = digest.as_integer().unwrap_or(0) as u64;
            }
        }
        Ok(digests)
    }

    write_meta(&client, &compute_digests(&prepare(&chunks)), None).await?;
    read_meta(&client).await?;
    // @block-end summary-read-write

    // @block-start latest-chunks
    let latest_source: Vec<Chunk> = vec![
        // unchanged
        Chunk {
            url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
            anchor: "prerequisites".into(),
            chunk_num: 0,
            text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...".into(),
            ..Default::default()
        },
        // edited text
        Chunk {
            url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
            anchor: "step-2-enable-tls".into(),
            chunk_num: 0,
            text: "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ...".into(),
            ..Default::default()
        },
        // step-3 removed; new step-4 added
        Chunk {
            url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
            anchor: "step-4-restrict-access".into(),
            chunk_num: 0,
            text: "Step 4: Restrict access with read-only API keys for untrusted clients ...".into(),
            ..Default::default()
        },
    ];
    // @block-end latest-chunks

    // @block-start changed-buckets
    let latest = prepare(&latest_source);
    let source = compute_digests(&latest); // digests of the edited source
    let stored = read_meta(&client).await?; // digests Qdrant currently holds

    let mut changed_buckets = Vec::new();
    for b in 0..N_BUCKETS {
        if source[b] != stored[b] {
            changed_buckets.push(b);
        }
    }

    println!("{changed_buckets:?}");
    // @block-end changed-buckets

    // @block-start read-bucket
    /// Return a map of point ID to content hash for every chunk stored in bucket b.
    ///
    /// Pages through the results so nothing is missed in a large bucket.
    async fn read_bucket(client: &Qdrant, b: usize) -> anyhow::Result<HashMap<String, String>> {
        let mut stored = HashMap::new();
        let mut offset: Option<PointId> = None;
        loop {
            let mut request = ScrollPointsBuilder::new(MAIN)
                .filter(Filter::must([Condition::matches(
                    "sync_bucket",
                    b as i64,
                )]))
                .with_payload(PayloadIncludeSelector::new(vec![
                    "content_hash".to_string()
                ]))
                .with_vectors(false)
                .limit(1000);
            if let Some(offset) = offset {
                request = request.offset(offset);
            }

            let response = client.scroll(request).await?;
            for point in response.result {
                let hash = point.get("content_hash").as_str().cloned();
                if let (Some(PointIdOptions::Uuid(id)), Some(hash)) =
                    (point.id.and_then(|i| i.point_id_options), hash)
                {
                    stored.insert(id, hash);
                }
            }

            offset = response.next_page_offset;
            if offset.is_none() {
                return Ok(stored);
            }
        }
    }
    // @block-end read-bucket

    // @block-start reconcile-bucket
    /// Make bucket b in Qdrant match source_chunks. Returns (added, re_embedded, deleted).
    async fn reconcile_bucket(
        client: &Qdrant,
        b: usize,
        source_chunks: &HashMap<String, Chunk>,
    ) -> anyhow::Result<(usize, usize, usize)> {
        let stored = read_bucket(client, b).await?; // point ID -> content hash currently in Qdrant

        let mut to_write = Vec::new(); // new or content-changed chunks: embed and upsert
        let (mut added, mut re_embedded) = (0, 0);
        for (pid, chunk) in source_chunks {
            match stored.get(pid) {
                None => {
                    to_write.push(chunk.clone()); // new chunk in this bucket
                    added += 1;
                }
                Some(hash) if hash != &chunk.content_hash => {
                    to_write.push(chunk.clone()); // same chunk, changed text
                    re_embedded += 1;
                }
                Some(_) => {}
            }
        }

        // chunks Qdrant has but the source no longer does
        let to_delete: Vec<PointId> = stored
            .keys()
            .filter(|pid| !source_chunks.contains_key(*pid))
            .map(|pid| PointId::from(pid.as_str()))
            .collect();
        let deleted = to_delete.len();

        if !to_write.is_empty() {
            client
                .upsert_points(UpsertPointsBuilder::new(MAIN, as_points(&to_write)?).wait(true))
                .await?;
        }
        if deleted > 0 {
            client
                .delete_points(
                    DeletePointsBuilder::new(MAIN)
                        .points(PointsIdsList { ids: to_delete })
                        .wait(true),
                )
                .await?;
        }

        Ok((added, re_embedded, deleted))
    }
    // @block-end reconcile-bucket

    // @block-start sync
    async fn sync(
        client: &Qdrant,
        latest_chunks: &[Chunk],
    ) -> anyhow::Result<(Vec<usize>, usize, usize, usize)> {
        let latest = prepare(latest_chunks);

        // group the source chunks by bucket once
        let mut source_by_bucket: HashMap<usize, HashMap<String, Chunk>> = HashMap::new();
        for c in &latest {
            let b = bucket(&c.point_id);
            source_by_bucket
                .entry(b)
                .or_default()
                .insert(c.point_id.clone(), c.clone());
        }

        // steps 1-3: which buckets changed
        let source = compute_digests(&latest);
        let stored = read_meta(client).await?;
        let mut changed = Vec::new();
        for b in 0..N_BUCKETS {
            if source[b] != stored[b] {
                changed.push(b);
            }
        }

        // step 4: reconcile each changed bucket
        let (mut added, mut re_embedded, mut deleted) = (0, 0, 0);
        let empty = HashMap::new();
        for &b in &changed {
            let counts =
                reconcile_bucket(client, b, source_by_bucket.get(&b).unwrap_or(&empty)).await?;
            added += counts.0;
            re_embedded += counts.1;
            deleted += counts.2;
        }

        // step 5: rewrite only the changed groups of the summary, after the data writes
        let mut changed_groups: Vec<usize> = changed.iter().map(|b| b / GROUP_SIZE).collect();
        changed_groups.dedup(); // changed is ascending, so equal group numbers are adjacent
        write_meta(client, &source, Some(&changed_groups)).await?;

        Ok((changed, added, re_embedded, deleted))
    }
    // @block-end sync

    // @block-start run-sync
    let (changed, added, re_embedded, deleted) = sync(&client, &latest_source).await?;
    println!("changed_buckets: {changed:?}, added: {added}, re_embedded: {re_embedded}, deleted: {deleted}");
    // @block-end run-sync

    Ok(())
}
