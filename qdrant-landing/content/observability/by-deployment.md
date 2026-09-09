---
title: Observability That Fits Your Deployment
subtitle: Qdrant Cloud surfaces infrastructure and request-level metrics.
description: Application-layer tracing, LLM call chains, and end-to-end retrieval quality scoring sit above the database layer and require a separate tool connected to your application code. If you are sizing a complex multi-tenant observability setup or need custom alerting rules validated against your specific workload, contact Qdrant to discuss your architecture.
link:
  text: Talk Through Your Architecture
  url: /contact-us/
tables:
  - id: observability
    featureCellWidth: 20rem
    cols:
      - id: managedCloud
        name: Managed Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/volumetric-logo.svg
          alt: Qdrant logo
      - id: hybridCloud
        name: Hybrid Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-hybrid-blue.svg
          alt: Hybrid cloud
      - id: privateCloud
        name: Private Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-private-teal.svg
          alt: Private cloud
      - id: openSource
        name: Open Source
        highlight: false
        bold: false
        icon:
          src: /icons/outline/code-purple.svg
          alt: Code
    features:
      - name: Works with your observability stack (Prometheus, Grafana, Datadog, any OpenMetrics tool)
        managedCloud: true
        hybridCloud: true
        privateCloud: true
        openSource: true
      - name: Metrics at a glance in the Cloud Console
        managedCloud: true
        hybridCloud: true
        privateCloud: N/A
        openSource: N/A
      - name: Automatic alerting on cluster health
        managedCloud: true
        hybridCloud: true
        privateCloud: Your own Alerts rules, in your own stack
        openSource: Your own rules, in your own stack
      - name: Where your telemetry goes
        managedCloud: Qdrant operates the infrastructure
        hybridCloud: Your stack & Qdrant's platform, both
        privateCloud: Your stack only, air-gapped by design
        openSource: Your stack only
sitemapExclude: true
---

