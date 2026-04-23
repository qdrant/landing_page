```python
import csv
import urllib.request

def parse_csv(url):
    with urllib.request.urlopen(url) as response:
        reader = csv.DictReader(line.decode('utf-8') for line in response)
        yield from reader
```
