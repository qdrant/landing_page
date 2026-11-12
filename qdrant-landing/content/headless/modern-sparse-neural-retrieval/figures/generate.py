#!/usr/bin/env python3
"""Build this article's static HTML figures. No external libraries or runtime JS.

Run from any directory. Original PNGs are recorded in Git history (see README.md). The native
HTML carries all essential labels and is also emitted by include in index.md.
The arbitrary embedding matrix entries are abstracted to labeled dimensions;
scalar examples, token identities, mathematical operations, and expansion text
remain explicit. See README.md for the inventory and adaptation decisions.
"""
from pathlib import Path
from html import escape

HERE = Path(__file__).resolve().parent
FIGURES = []
QWORDS = ['What', 'is', 'Qdrant']
DWORDS = ['Qdrant', 'is', 'a', 'vector', 'database']
QTOKENS = ['What', 'is', 'Q', 'dra', 'nt']
DTOKENS = ['Q', 'dra', 'nt', 'is', 'a', 'vector', 'database']


def tokens(items, weights=None, hits=(), added=()):
    cells = []
    for i, word in enumerate(items):
        cls = 'snr-token' + (' snr-hit' if word in hits else '') + (' snr-added' if word in added else '')
        weight = '' if weights is None else f'<span class="snr-weight">{escape(str(weights[i]))}</span>'
        cells.append(f'<span class="{cls}"><span>{escape(word)}</span>{weight}</span>')
    return '<div class="snr-tokens">' + ''.join(cells) + '</div>'


def box(label, content, role=''):
    return f'<div class="snr-box snr-{role}"><span class="snr-label">{label}</span>{content}</div>'


def arrow():
    return '<div class="snr-arrow" aria-hidden="true"></div>'


def join():
    return f'<div class="snr-join" aria-hidden="true">{arrow()}</div>'


def lanes(*content, aligned=False):
    return '<div class="snr-lanes'+(' snr-aligned' if aligned else '')+'">' + ''.join(f'<div class="snr-lane">{c}</div>' for c in content) + '</div>'


def note(text):
    return f'<p class="snr-note">{text}</p>'


def step(number, title, content=''):
    return f'<div class="snr-step"><span class="snr-num">{number}</span><div><strong>{title}</strong>{content}</div></div>'


def bert(words, projection, word_level=False):
    content = tokens(words)
    content += note('BERT context: h<sub>t</sub> ∈ ℝ<sup>768</sup> per token')
    if word_level:
        content += note('First subtoken only: Q → Qdrant')
    content += '<div class="snr-head"><strong>'+projection[0]+'</strong>'+projection[1]+'</div>'
    return box('BERT tokenizer → context', content, 'model')


def simple_query(word_tokens=False, binary=False):
    data = box('Query', tokens(QWORDS), 'query')
    if word_tokens:
        data += arrow() + box('BERT tokenizer', tokens(QTOKENS), 'model')
    if binary:
        data += arrow() + box('Binary query · 30,522 vocabulary slots', tokens(QTOKENS, [1]*5) + note('Other slots: 0'), 'query')
    return data + '<div class="snr-bypass" aria-hidden="true"></div>'


def output(label, words, weights, role, hits=(), added=()):
    return box(label, tokens(words, weights, hits, added), role)


def match(headers, rows):
    return '<div class="snr-products">'+''.join('<div class="snr-product"><strong>'+str(row[0])+'</strong><span class="snr-math">'+str(row[1])+' × '+str(row[2])+'</span></div>' for row in rows)+'</div>'


def equation(terms, result):
    return '<div class="snr-equation">' + ''.join(f'<span>{"+ " if i else ""}{term}</span>' for i,term in enumerate(terms)) + f'<span class="snr-result">= {result}</span></div>'


def figure(name, title, kind, body, caption):
    index = len(FIGURES) + 1
    html = f'<figure class="snr-figure" id="snr-{name.lower()}" aria-labelledby="snr-title-{index}">\n<div class="snr-heading"><span class="snr-title" id="snr-title-{index}">{title}</span><span class="snr-kind">{kind}</span></div>\n{body}\n<figcaption class="snr-caption">{caption}</figcaption>\n</figure>\n'
    (HERE / f'{name}.html').write_text(html)
    FIGURES.append(name)

# 1. Exact matching and its two distinct sources of statistics.
query = box('Query', tokens(QWORDS, hits=['is','Qdrant']) + note('Match only terms present in the document.'), 'query') + '<div class="snr-bypass" aria-hidden="true"></div>'
doc = box('Document 42', tokens(DWORDS, hits=['is','Qdrant']), 'doc') + arrow() + output('Document term frequency (TF)', DWORDS, [1]*5, 'doc', ['is','Qdrant'])
body = lanes(query, doc) + join()
body += box('Word statistics → relevance score', note('Sum contributions from matching query terms. BM25 combines document TF with corpus statistics: inverse document frequency (IDF) and average document length.') + '<div class="snr-bm25">' + box('IDF factor', '<div class="snr-math">log(N / df(t))</div>') + box('TF and length factor', '<div class="snr-frac"><span>(k₁ + 1) · tf(t, d)</span><span>k₁ · (1 − b + b · dl(d)/dl<sub>avg</sub>) + tf(t, d)</span></div>') + '</div>' + note('BM25 = Σ<sub>t ∈ q</sub> IDF factor × TF and length factor. N: corpus size; df(t): documents containing t; k₁ and b: parameters; dl(d): document length; dl<sub>avg</sub>: average document length.'), 'op')
figure('LexicalRetrievers','Lexical retrieval','Exact terms · word statistics',body,'Query and document meet through shared terms, not learned embeddings. BM25 is the illustrative scoring formula from the original figure.')

# 2. Posting lists preserve every document ID from the original.
rows = ''.join('<div class="snr-matches"><span class="snr-index-term">'+word+'</span><span class="snr-inline-arrow" aria-hidden="true">→</span>' + ''.join(f'<span class="snr-id">{i}</span>' for i in ids) + '</div>' for word,ids in [('Qdrant',[2,42]),('vector',[5,42]),('database',[2,4,8,42])])
figure('InvertedIndex','Inverted index','Term → document IDs',box('Posting lists',rows) + note('Look up a term to find the documents that contain it. Document 42 occurs in all three lists.'),'A term points directly to the documents containing it, so retrieval can skip documents without that term.')

# 3. Sentence vectors are distinct from the token vectors in later figures.
def dense(role, words, values):
    v = '<div class="snr-vector">'+''.join(f'<span>{x}</span>' for x in values)+'</div>'
    return box('Query' if role=='query' else 'Document 42',tokens(words),role)+arrow()+box('Dense embedding model',note('Example: text-embedding-3-small'), 'model')+arrow()+box('Sentence embedding',v,role)
body=lanes(dense('query',QWORDS,['−0.22','0.19','0.17','…','−0.5','1','0.33','0.4','0.23','−2.5']),dense('doc',DWORDS,['0.2','−0.9','1.7','…','9.5','−0.01','0.3','−0.4','2.3','2.5']))+join()+box('Similarity → relevance score','<div class="snr-math">q · d = Σ<sub>i</sub> q<sub>i</sub> d<sub>i</sub></div>'+note('Compare the whole embeddings; exact word overlap is not required.'),'op')
figure('DenseRetrievers','Dense retrieval','Sentence embeddings',body,'Both branches encode an entire text into a dense vector. The vector coordinates are illustrative.')

# 4. Two learned branches, word weights, and the exact original score.
linear=('Linear regression → round to integer','<div class="snr-math">y = x · w + b</div>')
q=box('Query',tokens(QWORDS),'query')+arrow()+bert(QTOKENS,linear,True)+arrow()+output('Query word weights',QWORDS,[5,9,340],'query',['is','Qdrant'])
d=box('Document 42',tokens(DWORDS),'doc')+arrow()+bert(DTOKENS,linear,True)+arrow()+output('Document word weights',DWORDS,[230,2,3,109,105],'doc',['is','Qdrant'])
score=match([], [['Qdrant',340,230],['is',9,2]])+'<div class="snr-total">Σ matched contributions = <strong>78,218</strong></div>'
figure('DeepCT','DeepCT','Contextual word weights',lanes(q,d,aligned=True)+join()+box('Exact word matching → sum',score,'op'),'Matching words contribute their learned weights. The score is illustrative; it is not a complete BM25 calculation.')

# 5. DeepImpact: query words stay unencoded, document words get scalar impacts.
projection=('Two-layer NN · 768D → 1 scalar', '')
q=simple_query()
d=box('Document 42',tokens(DWORDS),'doc')+arrow()+bert(DTOKENS,projection,True)+arrow()+output('Document word impacts',DWORDS,[2.2,0.3,0.1,1.9,1.5],'doc',['Qdrant','is'])
score=match(['Shared word','Query presence','Document impact'],[['Qdrant',1,2.2],['is',1,0.3]])+'<div class="snr-total">Σ matched impacts = <strong>2.5</strong></div>'
figure('DeepImpact','DeepImpact','Word-level scalar impacts',lanes(q,d)+join()+box('Sum impacts of matching query words',score,'op'),'The document is encoded; query words select document impacts. Only the first subtoken of each document word is used. Values are illustrative.')

# 6. TILDEv2: all BERT subtokens survive; the query is a binary sparse vector.
projection=('Scalar projection · 768D → 1 value', '')
q=simple_query(True,True)
d=box('Document 42',tokens(DWORDS),'doc')+arrow()+bert(DTOKENS,projection)+arrow()+output('Document token weights',DTOKENS,[1.8,3,0.9,0.1,0.2,2,1.8],'doc',['Q','dra','nt','is'])
score=match(['Shared token','Query','Document'],[['Q',1,1.8],['dra',1,3],['nt',1,0.9],['is',1,0.1]])+'<div class="snr-total">Σ matched impacts = <strong>5.8</strong></div>'
figure('TILDEv2','TILDEv2','Token-level scalar weights',lanes(q,d)+join()+box('Exact token matching → sum',score,'op'),'Q, dra, and nt remain separate matching dimensions. The unexpanded query has 1s for its tokens and 0s elsewhere; all example weights are illustrative.')

# 7. COIL: 768D -> 32D token vectors, exact token gating, max, then sum.
projection=('Linear projection · 768D → 32D', '<div class="snr-math">z<sub>t</sub> = W · h<sub>t</sub> + b</div>')
q=box('Query',tokens(QWORDS),'query')+arrow()+bert(QTOKENS,projection)+arrow()+output('Query token vectors · 32D each',QTOKENS,['q_What','q_is','q_Q','q_dra','q_nt'],'query',['is','Q','dra','nt'])
d=box('Document 42',tokens(DWORDS),'doc')+arrow()+bert(DTOKENS,projection)+arrow()+output('Document token vectors · 32D each',DTOKENS,['d_Q','d_dra','d_nt','d_is','d_a','d_vector','d_database'],'doc',['is','Q','dra','nt'])
score='<div class="snr-coil-score">'+box('1 · Exact token gate',tokens(['is','Q','dra','nt']))+box('2 · Dot product → max','<div class="snr-math">m<sub>t</sub> = max<sub>j: dⱼ = t</sub> q<sub>t</sub> · d<sub>j</sub></div>')+box('3 · Sum','<div class="snr-math">m<sub>is</sub> + m<sub>Q</sub> + m<sub>dra</sub> + m<sub>nt</sub></div>')+'</div>'
figure('COIL','COIL','Contextual token vectors',lanes(q,d,aligned=True)+join()+box('Token-gated late interaction',score,'op'),'Match token identities, compare their 32D contextual vectors, keep the best repeated occurrence, then sum. For bank, financial and river occurrences can score differently.')

# 8. UniCOIL: both branches encode, but each token gets one scalar.
projection=('One-layer NN · 768D → 1 scalar', '')
q=box('Query',tokens(QWORDS),'query')+arrow()+bert(QTOKENS,projection)+arrow()+output('Query token weights',QTOKENS,[0.3,0.1,1.5,0.8,0.9],'query',['is','Q','dra','nt'])
d=box('Document 42',tokens(DWORDS),'doc')+arrow()+bert(DTOKENS,projection)+arrow()+output('Document token weights',DTOKENS,[1.7,1.4,0.8,0.6,0.2,1.7,1.9],'doc',['is','Q','dra','nt'])
score=match(['Shared token','Query','Document'],[['is',0.1,0.6],['Q',1.5,1.7],['dra',0.8,1.4],['nt',0.9,0.8]])+'<div class="snr-total">Σ matched products = <strong>4.45</strong></div>'
figure('UNICOIL','UniCOIL','Contextual token scalars',lanes(q,d,aligned=True)+join()+box('Exact token matching → scalar products → sum',score,'op'),'The query and document both get learned scalar weights. Use the maximum weight for repeated document tokens. Values are illustrative.')

# 9. A before/after contrast with the actual expansion term kept explicit.
q=box('Query',tokens(['pizza']),'query')
before=lanes(q,box('Document 42 · original',tokens(['Margherita']),'doc'))+join()+box('No exact term match',note('pizza ≠ Margherita. The document cannot match this query through exact terms.'),'op')
after=lanes(q,box('Document 42 · expanded',tokens(['Margherita','pizza'],hits=['pizza'],added=['pizza']),'doc'))+join()+box('Exact matching becomes possible',note('pizza now occurs in both query and document. The dashed term was added by document expansion.'),'op')
figure('DocumentExpansion','Document expansion','Bridge the vocabulary gap',before+arrow()+after,'Expansion adds potential query terms to a document. The query stays unchanged; the added pizza term creates an exact match.')

# 10/11. External expansion: retain the complete source passage and expansions.
PASSAGE='Sure you can. You can fill in whatever you want in the From section of a money order, so your business name and address would be fine. The price only includes the money order itself. You can hand deliver it yourself if you want, but if you want to mail it, you\'ll have to provide an envelope and a stamp.'
MAILQUERY='Can I send a money order from USPS as a business?'
QUERIES=['can you write a money order on a stub','can i mail money order to a contractor','how to send a money order','can you mail money order yourself','do i need a money order stamp','can you hand deliver a money order','how to send a money order without a stamp','can someone hand deliver money order','how long can someone deliver a money order']
EXPANSION=['pay','get','orders','cash','need','check','cost','much','send','letter','copy','take','office','paper','receive','postaland','charge','ordering','use','someone','service','long','way','deposit','purchase','house','item','instructions','direct','post','transfer','carry','delivery','printed','items','needed','number','card','paid','buy','sent','us','put','done','good','sell','company','documents','free','required','billco','form']
query=box('Example query · not model input',f'<p class="snr-passage">{MAILQUERY}</p>','query')
doc=box('Document 42 · original passage',f'<p class="snr-passage">{escape(PASSAGE)}</p>','doc')
model=box('docT5query · T5 generative model',note('Generate likely queries, one token at a time.'),'model')
expanded=box('Append generated queries to the document','<ul class="snr-queries">'+''.join(f'<li>{escape(x)}</li>' for x in QUERIES)+'</ul>'+note('Repeated terms remain, so term frequencies can also increase.'),'doc')
figure('docT5queryDocumentExpansion','docT5query','External expansion · queries',lanes(query,doc)+'<div class="snr-arrow snr-doc-feed" aria-hidden="true"></div>'+model+arrow()+expanded,'Generated queries are appended to the passage before a separate retriever indexes it. Repeated words can raise term frequency.')
model=box('TILDE · vocabulary likelihood model',step(1,'Predict token probabilities in parallel',note('One distribution over the BERT vocabulary, conditioned on the passage.'))+step(2,'Select the top-k terms',note('Append terms without repetitions; no query sentence generation.')),'model')
expanded=box('Append predicted terms to the document',tokens(EXPANSION,added=EXPANSION),'doc')
figure('TILDEDocumentExpansion','TILDE','External expansion · terms',lanes(query,doc)+'<div class="snr-arrow snr-doc-feed" aria-hidden="true"></div>'+model+arrow()+expanded,'TILDE appends independent terms without repetitions. A separate retriever then indexes the passage and added terms.')

# 12. Document context and static vocabulary feed expansion; query bypasses it.
d=box('Document 42',tokens(DWORDS),'doc')+arrow()+box('BERT contextual encoding',tokens(DTOKENS)+note('Context vector h<sub>t</sub> per document token'),'model')
v=box('BERT vocabulary · 30,522 tokens',note('All tokens v, including terms absent from the document.'))+arrow()+box('BERT embedding layer',note('Non-contextual vector e<sub>v</sub> per vocabulary token'),'model')
body=lanes(d,v,aligned=True)+join()
score='<div class="snr-coil-score">'+box('1 · Dot product','<div class="snr-math">e<sub>v</sub> · h<sub>t</sub></div>'+note('Every v against every document token t'))+box('2 · Max over document tokens','<div class="snr-math">m<sub>v</sub> = max<sub>t</sub> e<sub>v</sub> · h<sub>t</sub></div>')+box('3 · Threshold + log','<div class="snr-math">d<sub>v</sub> = log(1 + ReLU(m<sub>v</sub> + bias))</div>')+'</div>'
body+=box('Internal document expansion',score,'op')
doc_vector=arrow()+output('Document · selected vocabulary slots',['What','is','Q','dra','nt'],[0.8,0,0,0,0.1],'doc',['What','nt'],['What'])
query=box('Query · unexpanded binary vector',note('What is Qdrant')+tokens(QTOKENS,[1]*5)+note('30,522 slots; other slots: 0.'),'query')
final=box('Select weights at query-token slots',match([], [['What',1,0.8],['nt',1,0.1]])+'<div class="snr-total">Σ selected weights = <strong>0.9</strong></div>','op')
body+=lanes(doc_vector,query).replace('snr-lanes', 'snr-lanes snr-sparta-matching', 1)+join()+final
figure('SPARTA','SPARTA','Internal document expansion',body,'The document expands across the vocabulary; the binary query bypasses expansion. Max similarity precedes the threshold and log transform. Selected weights and the score are illustrative.')

# 13. SPLADE++: separate context branches, tied vocabulary projections, log,
#     max pooling over input tokens, sparse query and document, then dot product.
def splade_branch(role,words,subtokens,weights):
    content=box('Query' if role=='query' else 'Document 42',tokens(words),role)+arrow()
    content+=box('BERT tokenizer → context',tokens(subtokens)+note('h<sub>t</sub> ∈ ℝ<sup>768</sup> per input token'),'model')+arrow()
    content+=box('Vocabulary head · 30,522 outputs', '<strong>Linear + GeLU + LayerNorm</strong><div class="snr-math">x<sub>t,v</sub> = transformed(h<sub>t</sub>) · e<sub>v</sub></div>'+note('e<sub>v</sub>: static BERT vocabulary embedding'),'model')+arrow()
    content+=box('Log activation → max pooling','<div class="snr-math">a<sub>t,v</sub> = log(1 + ReLU(x<sub>t,v</sub> + b<sub>v</sub>))</div><div class="snr-math">w<sub>v</sub> = max<sub>input tokens t</sub> a<sub>t,v</sub></div>','op')+arrow()
    vocab=['vector','What','database','Q','dra','nt']
    added=['vector','database'] if role=='query' else ['What']
    chosen=[(w,v) for w,v in zip(vocab,weights) if v != 0]
    content+=output(('Query' if role=='query' else 'Document')+' · selected nonzero slots',[x[0] for x in chosen],[x[1] for x in chosen],role,['vector','What','database','nt'],added)
    return content
q=splade_branch('query',QWORDS,QTOKENS,[0.5,0.8,0.2,0.1,0.3,0.1])
d=splade_branch('doc',DWORDS,DTOKENS,[0.3,0.1,0.4,0,0,0.5])
score=match([], [['vector',0.5,0.3],['What',0.8,0.1],['database',0.2,0.4],['nt',0.1,0.5]])+'<div class="snr-total">Σ shown named matches = <strong>0.36</strong></div>'
body=lanes(q,d,aligned=True)+join()+box('Sparse query · sparse document → dot product',score,'op')
figure('SPLADE++','SPLADE++','Internal query + document expansion',body,'Both branches expand (dashed terms). Training uses sparsity regularization and distillation. Selected slots and their partial sum are illustrative; omitted slots are not scored here.')


if __name__ == '__main__':
    print(f'Generated {len(FIGURES)} figures.')
