"""
Surface every customer quote in the case studies so none get missed when
converting them to the `{{< quote >}}` shortcode.

This deliberately over-captures. A false positive costs a moment's reading; a
missed quote ships. Earlier passes matched only quotes sitting next to an
attribution verb ("says", "explains"), which silently skipped whole classes:
standalone pull quotes, blockquotes, quotes attributed on their own line with a
dash, and quotes buried inside an image's alt text.

Every one of these forms is reported:

    "quote," says Name              quote attributed inline, either order
    > "quote" - Name, Title         blockquote with a trailing attribution
    *"quote"*                       italic pull quote, attribution or not
    ![“quote” - Name](/img.png)     quote living inside an image
    “quote”                         any quoted span long enough to be speech

Usage:

    python3 automation/find-customer-quotes.py                 # all case studies
    python3 automation/find-customer-quotes.py sprinklr bayer  # named ones
    python3 automation/find-customer-quotes.py --todo          # unconverted only
    python3 automation/find-customer-quotes.py --counts        # one line per file

Exit status is 0 always; this is a reporting tool.
"""

import glob
import os
import re
import sys

BLOG = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    '..', 'qdrant-landing', 'content', 'blog')

# Shortest run of characters we will treat as speech rather than a stray phrase
# in quotation marks. Deliberately low.
MIN_QUOTE = 25

FENCE = re.compile(r'^```.*?^```', re.S | re.M)
FRONT_MATTER = re.compile(r'\A---.*?^---\s*$', re.S | re.M)
QUOTED = re.compile(u'[“"“]([^“”"“”]{%d,600})[”"”]' % MIN_QUOTE)

ATTRIB_VERB = (u'says|said|notes|noted|explains|explained|remarks|remarked|'
               u'adds|added|emphasizes|emphasized|recalls|recalled|puts it|'
               u'points out|pointed out|according to|observes|observed|'
               u'describes|described|argues|argued|reflects|told us|summed it up')

# A capitalised name appearing within a short distance of the quote.
NEAR_NAME = re.compile(u'([A-Z][\\w.’-]+(?: [A-Z][\\w.’-]+){0,3})')


def classify(line):
    stripped = line.lstrip()
    if stripped.startswith('>'):
        return 'blockquote'
    if stripped.startswith('!['):
        return 'in-image'
    if stripped.startswith('*') and stripped.rstrip().endswith('*'):
        return 'italic'
    if stripped.startswith('-') or stripped.startswith('*   '):
        return 'in-bullet'
    return 'in-prose'


def speaker_near(context):
    """Best guess at who is speaking, or None. Guessing wrong is fine here."""
    m = re.search(u'(?:%s)[,:]?\\s+%s' % (ATTRIB_VERB, NEAR_NAME.pattern), context)
    if m:
        return m.group(1)
    m = re.search(u'%s[^.\n]{0,30}?(?:%s)' % (NEAR_NAME.pattern, ATTRIB_VERB), context)
    if m:
        return m.group(1)
    m = re.search(u'[-—–]\\s*%s' % NEAR_NAME.pattern, context)
    if m:
        return m.group(1)
    return None


def scan(path):
    with open(path, encoding='utf-8') as handle:
        raw = handle.read()

    converted = raw.count('{{< quote')

    # Blank out regions we must not report on, preserving line numbers so the
    # reported line is the line in the real file.
    def blank(match):
        return re.sub(r'[^\n]', ' ', match.group(0))

    body = FRONT_MATTER.sub(blank, raw)
    body = FENCE.sub(blank, body)
    # Text already inside a shortcode is converted; do not re-report it.
    body = re.sub(r'\{\{<.*?>\}\}', blank, body, flags=re.S)

    hits = []
    for match in QUOTED.finditer(body):
        text = ' '.join(match.group(1).split())
        line_no = body.count('\n', 0, match.start()) + 1
        line = raw.split('\n')[line_no - 1]
        context = body[max(0, match.start() - 160):match.end() + 160]
        hits.append({
            'line': line_no,
            'text': text,
            'kind': classify(line),
            'who': speaker_near(context),
        })
    return converted, hits


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = {a for a in sys.argv[1:] if a.startswith('--')}

    paths = sorted(glob.glob(os.path.join(BLOG, 'case-study-*.md')))
    total_files = total_quotes = 0

    for path in paths:
        slug = os.path.basename(path)[len('case-study-'):-len('.md')]
        if args and slug not in args:
            continue

        converted, hits = scan(path)
        if '--todo' in flags and not hits:
            continue
        if not hits and '--counts' not in flags:
            continue

        total_files += 1
        total_quotes += len(hits)

        if '--counts' in flags:
            print('%-24s %2d unconverted  %2d already cards'
                  % (slug, len(hits), converted))
            continue

        print('\n### %s   (%d unconverted, %d already cards)'
              % (slug, len(hits), converted))
        for hit in hits:
            who = hit['who'] or '?'
            print('  L%-4d %-11s [%s] %s'
                  % (hit['line'], hit['kind'], who, hit['text'][:120]))

    print('\n%d files, %d unconverted quotes' % (total_files, total_quotes))


if __name__ == '__main__':
    main()
