#!/usr/bin/env python3
"""Check a Hugo build of Learn: python3 automation/check-learn.py --public PATH."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, unquote

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links, self.ids, self.guides = set(), set(), set()
        self.examples, self.neighbors, self.redirect = 0, {}, None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if attr.get('id'):
            self.ids.add(attr['id'])
        if 'data-example' in attr:
            self.examples += 1
        if tag == 'a' and attr.get('href'):
            href = attr['href']
            self.links.add(href)
            if 'data-guide-link' in attr:
                self.guides.add(urlsplit(href).path)
            if attr.get('rel') in ('prev', 'next'):
                self.neighbors[attr['rel']] = urlsplit(href).path
        if tag == 'meta' and attr.get('http-equiv', '').lower() == 'refresh':
            self.redirect = urlsplit(attr.get('content', '').split('url=', 1)[-1]).path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--public', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'contributing/guide-sources.json').read_text())
errors, cache = [], {}

def page(route):
    route = urlsplit(route).path
    if route not in cache:
        path = args.public / route.strip('/') / 'index.html'
        if not path.exists():
            errors.append(f'Missing page: {route}')
        cache[route] = Page(path.read_text() if path.exists() else '')
    return cache[route]

# Compare preserved guide text with the original source hash, allowing routing and presentation changes.
for entry in manifest['guides']:
    source = root / entry['guide']
    body = source.read_text().split('---', 2)[2]
    original_title = '# ' + entry['title']
    # Source documentation already contains its H1; migrated articles receive one for the docs layout.
    if entry['added_title']:
        body = body.replace(original_title, '', 1)
    body = re.sub(r'{{< /?read-more >}}', '', body)
    for other in manifest['guides']:
        old = '/' + other['source'].split('content/', 1)[1].removesuffix('.md') + '/'
        body = body.replace(old, other['url'])
    digest = hashlib.sha256(re.sub(r'\s+', ' ', body).strip().encode()).hexdigest()
    if digest != entry['body_sha256']:
        errors.append(f'Guide source text changed: {source}')
    if (root / entry['source']).exists():
        errors.append(f'Duplicate source: {entry["source"]}')
    if page(entry['url']).redirect:
        errors.append(f'Guide must render its content: {entry["url"]}')
    if '/articles/' in entry['source']:
        old = '/articles/' + Path(entry['source']).stem + '/'
        if page(old).redirect != entry['url']:
            errors.append(f'Article redirect missing: {old}')

routes = {entry['url'] for entry in manifest['guides']}
for section, count in [('search-quality', 2), ('search-tuning', 8), ('production-patterns', 3)]:
    route = '/documentation/' + section + '/'
    links = {urlsplit(link).path for link in page(route).links}
    expected = {e['url'] for e in manifest['guides'] if Path(e['guide']).parent.name == section}
    if len(expected) != count or not expected <= links or page(route).guides != routes:
        errors.append(f'Guide category has incorrect membership: {section}')
    for landing in ['/learn/', '/documentation/guides/']:
        if route not in {urlsplit(link).path for link in page(landing).links}:
            errors.append(f'{landing} omits {route}')

series = [e['url'] for e in manifest['guides'] if '/search-tuning/' in e['url']]
for index, route in enumerate(series):
    expected = {}
    if index:
        expected['prev'] = series[index - 1]
    if index + 1 < len(series):
        expected['next'] = series[index + 1]
    if page(route).neighbors != expected:
        errors.append(f'Series order incorrect: {route}')
    for link in page(route).links:
        target = urlsplit(link)
        if target.path in series and target.fragment and unquote(target.fragment) not in page(target.path).ids:
            errors.append(f'Broken series anchor: {link}')

entries = re.findall(r'^- page: (\S+)', (root / 'qdrant-landing/data/examples.yaml').read_text(), re.M)
catalog = page('/learn/examples/')
if catalog.examples != len(entries) or len(set(entries)) != len(entries):
    errors.append('Catalog must show each registered tutorial exactly once')
if not {'example-query', 'example-goal', 'example-stack'} <= catalog.ids:
    errors.append('Catalog filters are missing')
for route in entries:
    route = route.lower()
    if page(route).redirect:
        errors.append(f'Tutorial source was replaced: {route}')
    if route not in {urlsplit(link).path for link in catalog.links}:
        errors.append(f'Tutorial missing from catalog: {route}')
if (args.public / 'learn/examples/index.md').read_text().count('[Open Example]') != len(entries):
    errors.append('Markdown catalog differs from HTML catalog')

# Cascade rules suppress archive bodies in HTML, Markdown, and discovery indexes.
index = (root / 'qdrant-landing/content/articles/_index.md').read_text()
retired = re.search(r'path: /articles/\{([^}]+)\}', index)[1].split(',')
discovery = '\n'.join((args.public / name).read_text() for name in ['sitemap.xml', 'llms.txt', 'articles/index.md'])
for slug in retired:
    source = root / 'qdrant-landing/content/articles' / (slug + '.md')
    if not source.exists():
        source = root / 'qdrant-landing/content/articles' / slug / '_index.md'
    fm = source.read_text().split('---', 2)[1]
    explicit = re.search(r'^slug:\s*(\S+)', fm, re.M)
    route = '/articles/' + re.sub(r'[^\w-]', '', explicit[1].strip('"\'').lower() if explicit else slug) + '/'
    path = args.public / route.strip('/')
    if re.search(r'^draft: true\s*$', fm, re.M):
        if (path / 'index.html').exists():
            errors.append(f'Archived draft published: {route}')
        continue
    if page(route).redirect != '/articles/' or not (path / 'index.md').exists() or (path / 'index.md').read_text().strip() != '# Articles\n\nBrowse current Qdrant articles in [Articles](/articles/index.md).':
        errors.append(f'Archive body exposed: {route}')
    if route in discovery:
        errors.append(f'Archive listed in discovery: {route}')
for slug in ['search-quality', 'embedding-research', 'qdrant-internals', 'production-ops']:
    category = page('/articles/' + slug + '/')
    if category.redirect:
        errors.append(f'Active article category redirected: {slug}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(routes)} preserved guides; {len(series)} ordered series parts; {len(entries)} original tutorials; archive bodies excluded.')
