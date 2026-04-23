```java
static class CsvRow {
    final String title;
    final String author;
    final String description;
    CsvRow(String title, String author, String description) {
        this.title = title; this.author = author; this.description = description;
    }
}

static Stream<CsvRow> parseCSV(String url) throws Exception {
    Function<String, List<String>> parseCsvLine = line -> {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        var sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        fields.add(sb.toString());
        return fields;
    };

    var reader = new BufferedReader(new InputStreamReader(new URL(url).openStream()));
    String headerLine = reader.readLine();
    List<String> headers = parseCsvLine.apply(headerLine);
    int titleIdx = headers.indexOf("Title");
    int authorIdx = headers.indexOf("Author");
    int descriptionIdx = headers.indexOf("Description");

    return reader.lines()
        .map(line -> {
            List<String> fields = parseCsvLine.apply(line);
            return new CsvRow(fields.get(titleIdx), fields.get(authorIdx), fields.get(descriptionIdx));
        })
        .onClose(() -> { try { reader.close(); } catch (Exception ignored) {} });
}
```
