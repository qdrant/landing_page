```rust
let base_ef = client
  .collection_info("{collection_name}")              
  .await?                                                                                                                                                   
  .result                                            
  .and_then(|info| info.config)
  .and_then(|config| config.hnsw_config)                                                                                                                    
  .and_then(|hnsw| hnsw.ef_construct);
```
