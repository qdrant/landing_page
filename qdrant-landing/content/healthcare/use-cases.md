---
title: "A Few Things You Can Build with Qdrant"
tabs:
  - id: patient-data
    label: Patient-Data
  - id: operations-gps
    label: Operations for GPs
  - id: medical-imaging
    label: Medical Imaging Analysis
useCases:
  - id: patient-data
    title: "Patient-data solutions: AI scribes with speech-to-text + retrieval"
    gradient: "linear-gradient(112deg, #E2D3FF 8.74%, #6B99F5 98.12%)"
    visual:
      src: /img/healthcare/medical-img-analyses.png
      alt: Patient data AI illustration
    values:
      - label: "Build:"
        text: "Ambient documentation and clinical scribe workflows that pull relevant patient context during note generation."
      - label: "Retrieve:"
        text: "Prior notes, summaries, problems/meds, care plans, relevant guidelines, patient history snippets."
      - label: "Why retrieval matters:"
        text: "Keeps generation grounded, reduces hallucination risk, improves clinician trust."
  - id: operations-gps
    title: "Operational AI for General Practitioners"
    gradient: "linear-gradient(112deg, #D3E8FF 8.74%, #8B5CF6 98.12%)"
    visual:
      src: /img/healthcare/medical-img-analyses.png
      alt: Operations AI illustration
    values:
      - label: "Build:"
        text: "Scheduling assistants, patient routing, care coordination tools that understand clinical context."
      - label: "Retrieve:"
        text: "Appointment history, provider availability, patient preferences, referral patterns."
      - label: "Key point:"
        text: "Semantic search enables smarter matching between patient needs and available resources."
  - id: medical-imaging
    title: "Medical imaging analysis"
    gradient: "linear-gradient(112deg, #E2D3FF 8.74%, #6B99F5 98.12%)"
    visual:
      src: /img/healthcare/medical-img-analyses.png
      alt: Medical imaging analysis illustration
    values:
      - label: "Build:"
        text: "Similarity search and workflow tooling for imaging AI: case retrieval, cohorting, QA, and study navigation."
      - label: "Retrieve:"
        text: "Images/embeddings + metadata (modality, anatomy, protocol, site, timestamp)."
      - label: "Key point:"
        text: 'Vector search becomes the backbone for "find similar cases" and "surface relevant prior examples".'
sitemapExclude: true
---
