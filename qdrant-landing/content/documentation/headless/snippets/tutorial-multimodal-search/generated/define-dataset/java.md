```java
static class Doc {
    final String caption;
    final String image;
    Doc(String caption, String image) {
        this.caption = caption;
        this.image = image;
    }
}

static String imageToBase64Url(String imagePath) throws Exception {
    String prefix = "data:image/png;base64";
    byte[] bytes = Files.readAllBytes(Path.of(imagePath));
    return prefix + "," + Base64.getEncoder().encodeToString(bytes);
}

static List<Doc> documents = List.of(
    new Doc("An image about plane emergency safety.", "images/image-1.png"),
    new Doc("An image about airplane components.", "images/image-2.png"),
    new Doc("An image about COVID safety restrictions.", "images/image-3.png"),
    new Doc("A confidential image about UFO sightings.", "images/image-4.png"),
    new Doc("An image about unusual footprints on Aralar 2011.", "images/image-5.png")
);
```
