#!/usr/bin/env bash
# Fetch the five raw corpora into data/raw/. Pinned URLs; SHA256 is recorded by T1.
set -euo pipefail
cd "$(dirname "$0")/data/raw"

BEIR=https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets
WANDS_SHA=3b74dcf4ba29ab8ff3e6a50b5b09fc627cb882b5
CSN_SHA=bd0cf261e357a3eb5c8fba490d23ec1a1cd59555

fetch() {  # fetch <url> <outfile>
  if [ -s "$2" ]; then echo "have $2"; return; fi
  echo "get  $2"
  curl -fsSL -C - -o "$2" "$1"
}

fetch "$BEIR/scifact.zip" scifact.zip
fetch "$BEIR/arguana.zip" arguana.zip
fetch "https://raw.githubusercontent.com/wayfair/WANDS/$WANDS_SHA/dataset/product.csv" wands_product.csv
fetch "https://raw.githubusercontent.com/wayfair/WANDS/$WANDS_SHA/dataset/query.csv" wands_query.csv
fetch "https://raw.githubusercontent.com/wayfair/WANDS/$WANDS_SHA/dataset/label.csv" wands_label.csv
fetch "https://huggingface.co/datasets/code-search-net/code_search_net/resolve/$CSN_SHA/python/train-00000-of-00001.parquet" csn_python_train.parquet
fetch "$BEIR/dbpedia-entity.zip" dbpedia-entity.zip

echo "--- sizes ---"
ls -l
