```rust
struct CsvRow {
    text: String,
    datetime: String,
}

fn parse_csv(url: &str) -> anyhow::Result<impl Iterator<Item = anyhow::Result<CsvRow>>> {
    let reader = ureq::get(url).call()?.into_body().into_reader();
    let mut rdr = csv::Reader::from_reader(reader);
    let headers = rdr.headers()?.clone();
    let text_idx = headers.iter().position(|h| h == "text").unwrap();
    let datetime_idx = headers.iter().position(|h| h == "datetime").unwrap();
    let iter = rdr.into_records().map(move |result| {
        let record = result?;
        Ok(CsvRow {
            text: record[text_idx].to_string(),
            datetime: record[datetime_idx].to_string(),
        })
    });
    Ok(iter)
}
```
