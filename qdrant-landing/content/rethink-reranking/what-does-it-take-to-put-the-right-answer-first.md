---
figure: /img/rethink-reranking/clinician.svg
figureAlt: 'Flowchart: the clinician''s query is matched by words and by meaning, filtered by the label rules, then ordered so the dosing table comes first'
title: What Does It Take to Put the Right Answer First?
description: 'A reranker reorders only the list it''s handed. Picture a clinician searching a drug-label library for "paracetamol dose for a 4-year-old." Four jobs put the dosing table on top: match the words, match the meaning, follow the rules, and put the best answer first. Many teams split these jobs across separate engines and merge code, then hand a reranker a list it can only reorder. Qdrant prepares the candidates, and your model makes the final call on their order.'
sitemapExclude: true
---
