```rust
struct CsvRow {
    title: String,
    author: String,
    description: String,
}

fn parse_csv(url: &str) -> anyhow::Result<impl Iterator<Item = anyhow::Result<CsvRow>>> {
    let reader = ureq::get(url).call()?.into_body().into_reader();
    let mut rdr = csv::Reader::from_reader(reader);
    let headers = rdr.headers()?.clone();
    let title_idx = headers.iter().position(|h| h == "Title").unwrap();
    let author_idx = headers.iter().position(|h| h == "Author").unwrap();
    let description_idx = headers.iter().position(|h| h == "Description").unwrap();
    let iter = rdr.into_records().map(move |result| {
        let record = result?;
        Ok(CsvRow {
            title: record[title_idx].to_string(),
            author: record[author_idx].to_string(),
            description: record[description_idx].to_string(),
        })
    });
    Ok(iter)
}
```
