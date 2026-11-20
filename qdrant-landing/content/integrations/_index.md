---
title: Qdrant Integrations
type: marketing/integrations
description: Embeddings, frameworks, data pipelines, platforms, and observability tools that work with Qdrant.
hero:
  title: Integrations
  description: Connect Qdrant to the embedding models, AI frameworks, data pipelines, platforms, and observability tools you already use.
  buttons:
    - text: Browse documentation
      url: /documentation/ecosystem/
      style: contained
    - text: Request an integration
      url: "#request-integration"
      style: outlined
# Each category lists the pages of a documentation section, so the directory stays in sync with the docs.
categories:
  - id: embeddings
    title: Embeddings
    section: /documentation/embeddings
  - id: frameworks
    title: Frameworks
    section: /documentation/frameworks
  - id: data-management
    title: Data Management
    section: /documentation/data-management
  - id: platforms
    title: Platforms
    section: /documentation/platforms
  - id: observability
    title: Observability
    section: /documentation/observability
requestForm:
  title: Request an integration
  description: Missing a tool you rely on, or building one that should work with Qdrant?<br>Tell us which one and we'll get back to you.
  id: integrations-form
  # Internal name of the HubSpot radio question that picks the request type.
  # The pills above the form are built from its options and drive it.
  typeField: what_type_of_integration
  hubspotFormOptions: '{
    "region": "eu1",
    "portalId": "139603372",
    "formId": "2dac74a7-c3bc-4cca-b575-e88db1f7499e",
    "submitButtonClass": "button button_contained",
    "css": "",
  }'
build:
  render: always
cascade:
  - type: marketing/integrations
  - build:
      list: local
      publishResources: false
      render: never
---
