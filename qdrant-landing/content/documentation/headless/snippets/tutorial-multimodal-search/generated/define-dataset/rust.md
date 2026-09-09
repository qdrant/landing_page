```rust
fn image_to_base64_url(image_path: &str) -> anyhow::Result<String> {
    let prefix = "data:image/png;base64";
    let bytes = std::fs::read(image_path)?;
    Ok(format!("{prefix},{}", BASE64_STANDARD.encode(bytes)))
}

struct Doc {
    caption: &'static str,
    image: &'static str,
}

let documents = vec![
    Doc { caption: "An image about plane emergency safety.", image: "images/image-1.png" },
    Doc { caption: "An image about airplane components.", image: "images/image-2.png" },
    Doc { caption: "An image about COVID safety restrictions.", image: "images/image-3.png" },
    Doc { caption: "A confidential image about UFO sightings.", image: "images/image-4.png" },
    Doc { caption: "An image about unusual footprints on Aralar 2011.", image: "images/image-5.png" },
];
```
