---
title: Demos
description: "Four applications built on Qdrant Edge for teams that need search on the device: robots, wearables, camera networks, and field hardware that syncs to a central cluster."
demos:
  - id: edge-mission-control
    title: Edge Mission Control
    description: A home robot remembers every object it sees. Search its memory on the device, with or without a connection.
    image:
      src: /img/edge/demos/mission-control.jpg
      alt: Mission Control live feed with detection boxes over a home interior
    video:
      mp4: /img/edge/demos/mission-control.mp4
      webm: /img/edge/demos/mission-control.webm
    links:
      - text: Live Demo
        url: https://qdrant-edge-mission-control.vercel.app/
      - text: GitHub
        url: https://github.com/qdrant-labs/edge-mission-control
      - text: Read the Post
        url: /blog/qdrant-edge-on-device-vector-search/
    runs: Runs in the browser
  - id: smart-glasses
    title: Smart Glasses
    description: Search what the wearer saw in plain language. Frames are embedded on the device and never leave it.
    image:
      src: /img/edge/demos/smart-glasses.jpg
      alt: Smart Glasses demo searching a first-person store walkthrough on the device
    video:
      mp4: /img/edge/demos/smart-glasses.mp4
      webm: /img/edge/demos/smart-glasses.webm
    links:
      - text: Live Demo
        url: https://smart-glasses-edge.vercel.app/
      - text: GitHub
        url: https://github.com/qdrant/qdrant-edge-demo
    runs: Runs in the browser
  - id: sentinel
    title: Sentinel
    description: Twelve campus cameras scored against a baseline of normal. Only clips far from it are escalated.
    image:
      src: /img/edge/demos/sentinel.jpg
      alt: Sentinel dashboard with twelve campus camera feeds and the alert queue
    video:
      mp4: /img/edge/demos/sentinel.mp4
      webm: /img/edge/demos/sentinel.webm
    links:
      - text: Live Demo
        url: https://sentinel-edge-demo.vercel.app/
      - text: GitHub
        url: https://github.com/qdrant/video-anomaly-edge
      - text: Three-Part Tutorial
        url: /documentation/tutorials-build-essentials/video-anomaly-edge-part-1/
    runs: Runs in the browser
  - id: edge-visual-search
    title: Edge Visual Search
    description: Frames land in a local shard as they arrive and sync to a Qdrant server in the background.
    image:
      src: /img/edge/demos/edge-visual-search.jpg
      alt: Edge Visual Search indexing an aerial feed and returning matching frames
    video:
      mp4: /img/edge/demos/edge-visual-search.mp4
      webm: /img/edge/demos/edge-visual-search.webm
    links:
      - text: Live Demo
        url: https://edge-visual-search.vercel.app/
      - text: GitHub
        url: https://github.com/qdrant-labs/devrel-projects/tree/main/qdrant-edge-nextjs
    runs: Runs in the browser
sitemapExclude: true
---
