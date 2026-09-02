---
label: Cloud Inference Approaches
title: Pick the Model that Fits Your Budget and Speed Needs
description: >-
  <strong>Inference speeds vary by model size and type.</strong> You're billed per token
  on the text or images you embed, and the rate depends on the model: several are free,
  others are metered. Inference speed varies by model too, so a cheaper model isn't
  always the faster one. You can read more about
  <a href="/articles/how-to-choose-an-embedding-model/">choosing an embedding model</a>,
  or contact us to talk through sizing.
button:
  text: Talk Through Sizing With Our Team
  url: /contact-us/
tables:
  - id: cloud-inference-approaches
    featureCellWidth: 17rem
    cols:
      - id: managedCloud
        name: Managed Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-managed.svg
          alt: Managed cloud
      - id: hybridCloud
        name: Hybrid Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-hybrid-blue.svg
          alt: Hybrid cloud
      - id: privateCloudOss
        name: Private Cloud/OSS
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-private-teal.svg
          alt: Private cloud
    features:
      - name: Qdrant-hosted embedding models
        managedCloud: "Available: automatically enabled on new clusters"
        hybridCloud: Not available
        privateCloudOss: Not available
      - name: In-cluster proxy to externally hosted models
        managedCloud: Available
        hybridCloud: Not available
        privateCloudOss: Not available
      - name: In-cluster BM25
        managedCloud: Available
        hybridCloud: Available
        privateCloudOss: Available
sitemapExclude: true
---
