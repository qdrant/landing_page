---
title: "{{ replace .Name "-" " " | title }}"
draft: false
slug: {{ .Name }} # Change this slug to your page slug if needed
short_description:  This is a blog post # Change this
description: This is a blog post # Change this
preview_image: /blog/Article-Image.png # Change this

# social_preview_image: /blog/Article-Image.png # Optional image used for link previews
# title_preview_image: /blog/Article-Image.png # Optional image used for blog post title
# small_preview_image: /blog/Article-Image.png # Optional image used for small preview in the list of blog posts

date: {{ .Date }}
author: John Doe # Change this
featured: false # if true, this post will be featured on the blog page
tags: # Change this, related by tags posts will be shown on the blog page
  - news
  - blog
weight: 0 # Change this weight to change order of posts
# For more guidance, see https://github.com/qdrant/landing_page?tab=readme-ov-file#blog
---

Here is your blog post content. You can use markdown syntax here.

# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

<aside role="alert">
  You can add a note to your page using this aside block.
</aside>

<aside role="status">
  This is a warning message.
</aside>

> This is a blockquote following a header.

Table:

| Header 1 | Header 2 | Header 3 | Header 4 |
| -------- | -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   | Cell 4   |
| Cell 3   | Cell 4   | Cell 5   | Cell 6   |

- List item 1
    - Nested list item 1
    - Nested list item 2
- List item 2
- List item 3

1. Numbered list item 1
    1. Nested numbered list item 1
    2. Nested numbered list item 2
2. Numbered list item 2
3. Numbered list item 3
