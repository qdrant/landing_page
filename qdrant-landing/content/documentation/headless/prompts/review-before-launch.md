---
title: "Review my deployment"
skill: qdrant-sizing
page: /documentation/production-checklist/
---
Review my Qdrant deployment before I put production traffic on it. Read
https://skills.qdrant.tech/qdrant-sizing/SKILL.md, then ask me for my
collection configuration, my expected vector count and query rate, and the
hardware I have provisioned. Tell me which of my settings will not survive real
load, ordered by how much it would hurt, and separate what I can change later
from what needs the collection recreated. Where my numbers do not support a
conclusion, say what to measure rather than guessing.
