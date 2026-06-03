---
title: "{{ replace .Name "-" " " | title }}"
heading: AGENDA
logo: /img/qdrant-logo.svg
# hero_image: /img/path-to/hero.png
# badge_icons_path: static/img/path-to/icons/
description: "" # SEO description
subtitle: "" # Visible text below the heading, supports HTML
date_info: ""
location: ""
url: /{{ .Name }}/
build:
  render: always

slots:
  - type: talk
    title: "Talk Title"
    description: ""
    # company_logo: /img/path-to/logo.svg
    # company_logo_offset:
    #   placement: top
    #   value: -8
    badge: "BADGE NAME"
    badge_type: qdrant # qdrant | search | agents | edge
    badge_icon: presentation # presentation | brain | search | database
    speaker_name: "Speaker Name"
    speaker_role: "Role, Company"
    # speaker_avatar: /img/path-to/avatar.png
    duration: "20'"
    time: "10:00 AM"

  - type: break
    title: "Coffee Break"
    duration: "15'"
    time: "10:30 AM"
---
