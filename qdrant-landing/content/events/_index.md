---
title: Events
description: Events
icons:
  # Filenames under static/icons/outline/”
  # for more see svg.html partial
  date: calendar.svg
  place: map-pin.svg
  time: clock.svg
build:
  render: always
cascade:
- build:
    list: local
    publishResources: false
    render: never
---

