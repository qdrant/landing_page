---
title: Join the waiting list for the Qdrant Hybrid Cloud solution.
section_title: Request early access to the Qdrant Hybrid Cloud
form:
  - id: 0
    header: "Get <span style='color: var(--brand-primary);'>Early Access</span> to Qdrant Hybrid Cloud"
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
    label: What's the name of your company?
    rows: 1
    name: companyName
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
    label: Are you already using Qdrant?
    type: checkbox
    options:
    - Yes, in Qdrant Cloud
    - Yes, on-premise
    - We are using another solution at the moment
    - No, we are not using any vector search engine
    name: experienced
  - id: 5
    label: Please describe the approximate size of the deployment you are planning to use. (optional)
    placeholder: 3 machines 64GB RAM each, or a deployment capable of serving 100M OpenAI embeddings
    type: text
    name: clusterSize
    required: False
  - id: 6
    label: What's your target infrastructure?
    type: radio
    options:
    - AWS
    - GCP
    - Azure
    - Other
    name: infrastructure
---