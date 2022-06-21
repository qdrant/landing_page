---
title: Join the waiting list for the Qdrant cloud-hosted version private beta.
section_title: Request early access to the Qdrant Cloud
form:
  - id: 0
    header: "Get <span style='color: var(--brand-primary);'>Early Access</span> to Qdrant Cloud"
    label: All right! 😊 What is your e-mail? *
    placeholder: name@example.com
    type: email
    name: email
    required: True
  - id: 1
    label: May we have your name, please?
    type: text
    rows: 1
    placeholder: Dr. Smith
    name: name
  - id: 2
    label: For what purpose do you/will you use a cloud-hosted solution?
    type: checkbox
    options:
    - For my company product
    - For one of my company internal project
    - For a client as an agency or a freelancer
    - For a personal project
    name: purpose
  - id: 3
    label: What's the size of your company?
    type: radio
    options:
    - 1
    - 2-10
    - 11-50
    - 51-200
    - 201-1000
    - 1001+
    name: companySize
  - id: 4
    label: What is your use case?
    type: radio
    options:
    - Semantic Text Search
    - Similar Image Search
    - Recommendations
    - Chat Bots
    - Matching Engines
    - Anomalies Detection
    - Other
    name: case
  - id: 5
    label: Have you ever used any vector search engines? If yes, which ones?
    type: text
    rows: 1
    placeholder: Type here your answer
    name: experienced
---