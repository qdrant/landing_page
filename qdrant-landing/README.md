To rebuild scss to css:

```bash
npm install
```

# Build css from scss

Install sass if you don't have it:

```bash
npm install -g sass
```

``` bash
cd qdrant-landing
sass --watch --style=compressed ./themes/qdrant/static/css/main.scss ./themes/qdrant/static/css/main.css
```

# Articles

## Metadata

Articles are written in markdown and stored in `content/articles` directory. Each article has a header with metadata:

```yaml
---
title: Here goes the title of the article #required
short_description: Short description of the article
description: This is a longer description of the article, you can get a little bit more wordly here. Try to keep it under 140 characters. #required
social_preview_image: /articles_data/cars-recognition/social_preview.jpg # This image will be used in social media previews, should be 1200x630px. Required.
small_preview_image: /articles_data/cars-recognition/icon.svg # This image will be used in the list of articles at the footer, should be 40x40px
preview_dir: /articles_data/cars-recognition/preview # This directory contains images that will be used in the article preview. They can be generated from one image. Read more below. Required.
weight: 10 # This is the order of the article in the list of articles at the footer. The lower the number, the higher the article will be in the list.
author: Yusuf Sarıgöz # Author of the article. Required.
author_link: https://medium.com/@yusufsarigoz # Link to the author's page. Required.
date: 2022-06-28T13:00:00+03:00 # Date of the article. Required.
draft: false # If true, the article will not be published
keywords: # Keywords for SEO
  - vector databases comparative benchmark
  - benchmark
  - performance
  - latency
---
```

## Preview image mechanism

Preview image for each page is selected based from the following places in the following order:

- If document has param `social_preview_image` - it will be used as preview image
- If there is a file `static/<path-to-section>/<file-name>-social-preview.png` - it will be used as preview image
- Global `preview_image = "/images/social_preview.png"` will be used as preview image

## Article preview

Article preview is a set of images that will be used in the article preview. They can be generated from one image. To generate preview images, you need to have [ImageMagick](https://imagemagick.org/index.php) and [cwebp](https://developers.google.com/speed/webp/download) installed.

You can install `cwebp` with the following command:

```bash
curl -s https://raw.githubusercontent.com/Intervox/node-webp/latest/bin/install_webp | sudo bash
```

### Prepare preview image

For the preview use image with the aspect ratio 3 to 1 in jpg or png format. With resolution not smaller than 1200x630px. The image should illustrate in some way the article's core idea. Fill free got creative. Check out that most important part of the image is in the center.

### Generating preview images

To generate preview images, run the following command from the root of project:

```bash
bash -x automation/process-article-img.sh <path-to-image> <alias-for-the-article>
```

For example:

```bash
bash -x automation/process-article-img.sh ~/Pictures/my_preview.jpg filtrable-hnsw 
```

This command will create a directory `preview` in `static/article_data/filtrable-hnsw` and generate preview images in it. If the directory `static/article_data/filtrable-hnsw` doesn't exist, it will be created. If it exists, only files in children `preview` directory will be affected. In this case preview images will be overwritten. Your original image will not be affected.

### Preview images set

Preview images set consists of the following images:

`preview.jpg` - 530x145px (used on the article preview card **for browsers, not supporting webp**)
`preview.webp` - 530x145px (used on the article preview card **for browsers, supporting webp**)
`title.jpg` - 898x300px (used on the article's page as the main image before the article title **for browsers, not supporting webp**)
`title.webp` - 898x300px (used on the article's page as the main image before the article title **for browsers, supporting webp**)
`social_preview.jpg` - 1200x630px (used in social media previews)

# Documentation

## Metadata

Documentation pages are written in markdown and stored in `content/documentation` directory. Each page has a header with metadata:

```yaml
---
title: Here goes the title of the page #required
weight: 10 # This is the order of the page in the sidebar. The lower the number, the higher the page will be in the sidebar.
canonicalUrl: https://qdrant.io/documentation/ # Optional. This is the canonical url of the page.
hideInSidebar: true # Optional. If true, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).
---
```

## Preview images for documentation pages

Branded individual preview images for documentation pages might be auto-generated using the following command:

(from the root of the project)

```bash
bash -x automation/generate-all-docs-preview.sh
```

It will automatically insert documentation Section name and Title of the page into the preview.
If there is a custom background for the image - it should be placed in the `static/documentation/<section-name>/<page>-bg.png`.
<!-- (Use midjourney and one of the styles https://www.notion.so/qdrant/Midjourney-styles-a8dbc94761a74bb287a8a8ad05d593d1 to generate the background) -->

If there is no custom background - random default background will be used.

Generated images will be placed in the `static/documentation/<section-name>/<page>-social-preview.png`.

To re-generate preview image, remove the previously generated one and run the command again.

## Documentation sidebar

### Delimiter

To create a delimiter in the sidebar, use the following command:

``` bash
cd qdrant-landing
hugo new --kind delimiter documentation/<delimiter-title>.md
```

It will create a file `content/documentation/<delimiter-title>.md`.

To put a delimiter to desired place in the sidebar, set the `weight` parameter to the desired value. The lower the value, the higher the delimiter will be in the sidebar.

### External link

To create an external link in the sidebar, use the following command:

``` bash
cd qdrant-landing
hugo new --kind external-link documentation/<link-title>.md
```

It will create a file `content/documentation/<link-title>.md`. Open it and set the `external_link` parameter to the desired value.

### Params

Additionally, to the standard hugo front matter params, we have the following params:

```yaml
hideInSidebar: true
```

If `true`, the page will not be shown in the sidebar. It can be used in regular documentation pages and in documentation section pages (_index.md).

# Main Page

## Customers/Partners Logos

To add a customer logo to the marquee on the main page:

1. Add a logo to `/qdrant-landing/static/content/images/logos` directory. The logo should be in png format and have a transparent background and width 200px. The color of the logo should be `#B6C0E4`.
 
2. Add a markdown file to `content/stack` directory using next command (replace `customer-name` with the name of the customer):

``` bash
cd qdrant-landing
hugo new --kind customer-logo stack/customer-name.md
```

Edit the file if needed.

3. If total number of slides changed - update `static/css/main.scss` file. Find line:

```scss
@include marquee.base(80px, 200px, 13, 6, 20px, false, 50s);
```

and change 13 to the number of logos.

Rebuild css from scss (see instructions [above](#build-css-from-scss)).

4. To change order of the logos - add or change `weight` parameter in the markdown files in `/qdrant-landing/content/stack` directory.
