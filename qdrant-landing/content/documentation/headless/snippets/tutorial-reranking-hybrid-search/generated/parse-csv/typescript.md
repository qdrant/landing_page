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

async function* parseCSV(url: string): AsyncGenerator<{ title: string; author: string; description: string }> {
    const response = await fetch(url);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let remainder = "";
    let headers: string[] | null = null;
    let titleIdx = -1;
    let authorIdx = -1;
    let descriptionIdx = -1;

    while (true) {
        const { done, value } = await reader.read();
        const chunk = done ? "" : decoder.decode(value, { stream: true });
        const lines = (remainder + chunk).split("\n");
        remainder = done ? "" : lines.pop()!;

        for (const line of lines) {
            if (!line.trim()) continue;
            if (headers === null) {
                headers = parseCsvLine(line);
                titleIdx = headers.indexOf("Title");
                authorIdx = headers.indexOf("Author");
                descriptionIdx = headers.indexOf("Description");
                continue;
            }
            const fields = parseCsvLine(line);
            yield { title: fields[titleIdx], author: fields[authorIdx], description: fields[descriptionIdx] };
        }

        if (done) break;
    }
}
```
