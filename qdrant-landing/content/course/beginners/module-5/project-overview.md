---
title: "Project Overview"
short_description: "Module 5 of the Beginner Course: the capstone project and the problem it solves."
description: "One factory fire reaches an analyst four ways. Build the system that connects a news report, a satellite image, an earnings call, and a filing."
weight: 1
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# Project Overview

A factory fire at a supplier's plant reaches you four ways. A local news report, a satellite image, an earnings call where an executive gets asked about it, and the supplier's own filing weeks later. You are building the system an analyst uses to see all four, and none of them arrives labeled as an incident.

This is the news search system you designed in Module 4, extended in three ways:

- **Multiple modalities**: news, satellite imagery, and transcribed audio, all in one collection.
- **Daily ingestion**: signals arrive every 24 hours rather than as a one-off load.
- **Clustering**: group signals that describe the same underlying event, even when they arrive from different sources and in different formats.

Module 4's five design questions still frame the work. Only the answers get bigger.
