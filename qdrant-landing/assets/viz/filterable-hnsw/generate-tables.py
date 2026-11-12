"""Generate article data tables from the preserved historical CSV observations."""
import csv
from pathlib import Path

source = Path(__file__).resolve().parent
project = source.parents[2]
for name in ('edge-count', 'point-count', 'category-count'):
    with (source / f'{name}.csv').open(newline='') as file:
        rows = list(csv.reader(file))
    header, *observations = rows
    lines = [
        '<details>', '<summary>Historical source data</summary>', '',
        '| ' + ' | '.join(header) + ' |',
        '| ' + ' | '.join('---' for _ in header) + ' |',
        *('| ' + ' | '.join(row) + ' |' for row in observations),
        '', '</details>', '',
    ]
    (project / 'content/headless/filterable-hnsw' / f'{name}.md').write_text('\n'.join(lines))
