```rust
let (changed, added, re_embedded, deleted) = sync(&client, &latest_source).await?;
println!("changed_buckets: {changed:?}, added: {added}, re_embedded: {re_embedded}, deleted: {deleted}");
```
