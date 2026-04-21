```typescript
function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
        if (line[i] === '"') {
            i++;
            let field = "";
            while (i < line.length) {
                if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
                else if (line[i] === '"') { i++; break; }
                else { field += line[i++]; }
            }
            fields.push(field);
            if (line[i] === ",") i++;
        } else {
            const start = i;
            while (i < line.length && line[i] !== ",") i++;
            fields.push(line.slice(start, i));
            if (i < line.length) i++;
        }
    }
    return fields;
}

async function* parseCSV(url: string): AsyncGenerator<{ text: string; datetime: string }> {
    const response = await fetch(url);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let remainder = "";
    let headers: string[] | null = null;
    let textIdx = -1;
    let datetimeIdx = -1;

    while (true) {
        const { done, value } = await reader.read();
        const chunk = done ? "" : decoder.decode(value, { stream: true });
        const lines = (remainder + chunk).split("\n");
        remainder = done ? "" : lines.pop()!;

        for (const line of lines) {
            if (!line.trim()) continue;
            if (headers === null) {
                headers = line.split(",");
                textIdx = headers.indexOf("text");
                datetimeIdx = headers.indexOf("datetime");
                continue;
            }
            const fields = parseCsvLine(line);
            yield { text: fields[textIdx], datetime: fields[datetimeIdx] };
        }

        if (done) break;
    }
}
```
