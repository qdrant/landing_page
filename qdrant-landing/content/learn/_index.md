---
title: "Qdrant Learn Portal"
description: "Tutorials, Courses, Articles"
hideTOC: true
breadcrumb: false
partition: learn
feedback: false
content:
#   - partial: documentation/banners/banner-b
#     title: Welcome to Qdrant Learn
#     description: Learn Portal
#     image:
#       src: /img/dev-portal-cloud/dev-portal-cloud-hero.png
#       alt: Qdrant Course
#     startedButton:
#       text: Start Learning
#       url: /courses/essentials
  - partial: documentation/sections/cards-section
    title: Learn
    description: Master vector search with Qdrant through comprehensive documentation, structured courses, and hands-on tutorials.
    cardsPartial: documentation/cards/docs-cards
    cards:
    - id: 1
      image:
        src: /img/dev-portal-learn/articles.png
        alt: Articles
      title: Articles
      description: In-depth technical documentation covering vector search concepts, system architecture, and advanced techniques.

      list:
        title: "Featured articles:"
        elements:
            - Distance-based data exploration
            - Built for Vector Search
            - Semantic Search As You Type
      link:
        url: /articles/
        text: Browse Articles
    - id: 2
      image:
        src: /img/dev-portal-learn/courses.png
        alt: Courses
      title: Courses
      description: Structured learning paths with progressive difficulty levels, from beginner fundamentals to advanced implementations.
      list:
        title: "Available topics:"
        elements:
            - "Beginner: Vector search basics"
            - "Intermediate: Advanced querying"
            - "Advanced: Production optimization"
      
      link:
        url: /course/essentials
        text: View Courses
    - id: 3
      image:
        src: /img/dev-portal-learn/tutorials.png
        alt: Tutorials
      title: Tutorials
      description: Step-by-step guides and video content for hands-on learning with practical examples and real-world applications.
      list:
        title: "Tutorial categories:"
        elements:
            - "Search Engineering"
            - "RAG and Agents"
            - "Ecosystem and Integrations"
      
      link:
        url: /documentation/tutorials-overview/
        text: Explore Tutorials
  - partial: documentation/sections/cards-section
    title: Quickstart
    description: 
    cardsPartial: documentation/cards/docs-cards
    cardsPerRow: 2
    cards:
    - id: 1
      icon:
        src: /icons/outline/rocket-blue.svg
        alt: Rocket icon
      title: New to Vector Search?
      description: Start with our beginner-friendly articles on vector embeddings and basic concepts.
      link:
        text: Start Learning
        url: /documentation/tutorials-quickstart/
    - id: 2
      icon:
        src: /icons/outline/hacker-purple.svg
        alt: Hacker icon
      title: Ready to Build?
      description: Jump into practical examples and integration guides to implement Qdrant in your projects.
      link:
        text: View Examples
        url: /documentation/tutorials-search-engineer/
---

