```rust
for field in ["content_hash", "url", "section_url"] {
    client
        .create_field_index(CreateFieldIndexCollectionBuilder::new(
            COLLECTION,
            field,
            FieldType::Keyword,
        ))
        .await?;
}
```
