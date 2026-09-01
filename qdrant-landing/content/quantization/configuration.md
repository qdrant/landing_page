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
        turboQuant: Usually within 1%
        binary: Faster
        product: Safe default, <br>any dimensionality
      - name: Typical Recall (with rescoring)
        scalar: 8x to 32x
        turboQuant: Comparable <br>to scalar at double the compression
        binary: Fast
        product: Strong default, <br>no dataset training
      - name: Speed
        scalar: Up to 32x
        turboQuant: High on centered, high-dim embeddings
        binary: Fastest (up to 40x)
        product: Models with 1024+ dimensions
      - name: Best for
        scalar: Up to 64x
        turboQuant: Lower, tune carefully
        binary: Slower
        product: When memory <br>is the only priority
banner:
  content:
    Scalar, product, and binary quantization each make a different tradeoff across memory savings, recall, and query speed.
  link:
    url: /documentation/cloud/
    text: Compare Quantization Methods
sitemapExclude: true
---