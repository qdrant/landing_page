```rust
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
```
