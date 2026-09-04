---
label: CONFIGURATION
title: "Choose Your Method: The Comparison Matrix"
tables:
  - id: quantization-configuration
    featureCellWidth: 13rem
    cols:
      - id: scalar
        name: Scalar
        highlight: false
        bold: false
      - id: turboQuant
        name: TurboQuant
        highlight: false
        bold: false
      - id: binary
        name: Binary
        highlight: false
        bold: false
      - id: product
        name: Product
        highlight: false
        bold: false
    features:
      - name: Memory Cut
        scalar: 4x
        turboQuant: 8x to 32x
        binary: Up to 32x
        product: Up to 64x
      - name: Typical Recall (with rescoring)
        scalar: Usually within 1%
        turboQuant: Comparable <br>to scalar at double the compression
        binary: High on centered, high-dim embeddings
        product: Lower, tune carefully
      - name: Speed
        scalar: Faster
        turboQuant: Fast
        binary: Fastest (up to 40x)
        product: Slower
      - name: Best for
        scalar: Safe default, <br>any dimensionality
        turboQuant: Strong default, <br>no dataset training
        binary: Models with 1024+ dimensions
        product: When memory <br>is the only priority
banner:
  content:
    Scalar, product, and binary quantization each make a different tradeoff across memory savings, recall, and query speed.
  link:
    url: /documentation/manage-data/quantization/
    text: Compare Quantization Methods
sitemapExclude: true
---