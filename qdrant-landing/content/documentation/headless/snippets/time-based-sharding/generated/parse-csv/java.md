```java
static class CsvRow {
    final String text;
    final String datetime;
    CsvRow(String text, String datetime) { this.text = text; this.datetime = datetime; }
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
    List<String> headers = List.of(headerLine.split(","));
    int textIdx = headers.indexOf("text");
    int datetimeIdx = headers.indexOf("datetime");

    return reader.lines()
        .map(line -> {
            List<String> fields = parseCsvLine.apply(line);
            return new CsvRow(fields.get(textIdx), fields.get(datetimeIdx));
        })
        .onClose(() -> { try { reader.close(); } catch (Exception ignored) {} });
}
```
