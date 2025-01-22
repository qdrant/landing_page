---
title:  Google Summer of Code 2023 - Polygon Geo Filter for Qdrant Vector Database
short_description: Gsoc'23 Polygon Geo Filter for Qdrant Vector Database
description: A Summary of my work and experience at Qdrant's Gsoc '23.
preview_dir: /articles_data/geo-polygon-filter-gsoc/preview
small_preview_image: /articles_data/geo-polygon-filter-gsoc/icon.svg
social_preview_image: /articles_data/geo-polygon-filter-gsoc/preview/social_preview.jpg
weight: -50
author: Zein Wen
author_link: https://www.linkedin.com/in/zishenwen/
date: 2023-10-12T08:00:00+03:00
draft: false
keywords:
    - payload filtering
    - geo polygon
    - search condition
    - gsoc'23
category: qdrant-internals
---



## Introduction

Greetings, I'm Zein Wen, and I was a Google Summer of Code 2023 participant at Qdrant. I got to work with an amazing mentor, Arnaud Gourlay, on enhancing the Qdrant Geo Polygon Filter. This new feature allows users to refine their query results using polygons. As the latest addition to the Geo Filter family of radius and rectangle filters, this enhancement promises greater flexibility in querying geo data, unlocking interesting new use cases.

## Project Overview

{{< figure src="/articles_data/geo-polygon-filter-gsoc/geo-filter-example.png" caption="A Use Case of Geo Filter (https://traveltime.com/blog/map-postcode-data-catchment-area)" alt="A Use Case of Geo Filter" >}}

Because Qdrant is a powerful query vector database it presents immense potential for machine learning-driven applications, such as recommendation. However, the scope of vector queries alone may not always meet user requirements. Consider a scenario where you're seeking restaurant recommendations; it's not just about a list of restaurants, but those within your neighborhood. This is where the Geo Filter comes into play, enhancing query by incorporating additional filtering criteria. Up until now, Qdrant's geographic filter options were confined to circular and rectangular shapes, which may not align with the diverse boundaries found in the real world. This scenario was exactly what led to a user feature request and we decided it would be a good feature to tackle since it introduces greater capability for geo-related queries.

## Technical Challenges

**1. Geo Geometry Computation** 

{{< figure src="/articles_data/geo-polygon-filter-gsoc/basic-concept.png" caption="Geo Space Basic Concept" alt="Geo Space Basic Concept" >}}

Internally, the Geo Filter doesn't start by testing each individual geo location as this would be computationally expensive. Instead, we create a geo hash layer that [divides the world](https://en.wikipedia.org/wiki/Grid_(spatial_index)#Grid-based_spatial_indexing) into rectangles. When a spatial index is created for Qdrant entries it assigns the entry to the geohash for its location. 

During a query we first identify all potential geo hashes that satisfy the filters and subsequently check for location candidates within those hashes. Accomplishing this search involves two critical geometry computations: 
1. determining if a polygon intersects with a rectangle
2. ascertaining if a point lies within a polygon.

{{< figure src=/articles_data/geo-polygon-filter-gsoc/geo-computation-testing.png caption="Geometry Computation Testing" alt="Geometry Computation Testing" >}}

While we have a geo crate (a Rust library) that provides APIs for these computations, we dug in deeper to understand the underlying algorithms and verify their accuracy. This lead us to conduct extensive testing and visualization to determine correctness. In addition to assessing the current crate, we also discovered that there are multiple algorithms available for these computations. We invested time in exploring different approaches, such as [winding windows](https://en.wikipedia.org/wiki/Point_in_polygon#Winding%20number%20algorithm:~:text=of%20the%20algorithm.-,Winding%20number%20algorithm,-%5Bedit%5D) and [ray casting](https://en.wikipedia.org/wiki/Point_in_polygon#Winding%20number%20algorithm:~:text=.%5B2%5D-,Ray%20casting%20algorithm,-%5Bedit%5D), to grasp their distinctions, and pave the way for future improvements.

Through this process, I enjoyed honing my ability to swiftly grasp unfamiliar concepts. In addition, I needed to develop analytical strategies to dissect and draw meaningful conclusions from them. This experience has been invaluable in expanding my problem-solving toolkit.

**2. Proto and JSON format design** 

Considerable effort was devoted to designing the ProtoBuf and JSON interfaces for this new feature. This component is directly exposed to users, requiring a consistent and user-friendly interface, which in turns help drive a a positive user experience and less code modifications in the future.

Initially, we contemplated aligning our interface with the [GeoJSON](https://geojson.org/) specification, given its prominence as a standard for many geo-related APIs. However, we soon realized that the way GeoJSON defines geometries significantly differs from our current JSON and ProtoBuf coordinate definitions for our point radius and rectangular filter. As a result, we prioritized API-level consistency and user experience, opting to align the new polygon definition with all our existing definitions.

In addition, we planned to develop a separate multi-polygon filter in addition to the polygon. However, after careful consideration, we recognize that, for our use case, polygon filters can achieve the same result as a multi-polygon filter. This relationship mirrors how we currently handle multiple circles or rectangles. Consequently, we deemed the multi-polygon filter redundant and would introduce unnecessary complexity to the API. 

Doing this work illustrated to me the challenge of navigating real-world solutions that require striking a balance between adhering to established standards and prioritizing user experience. It also was key to understanding the wisdom of focusing on developing what's truly necessary for users, without overextending our efforts.

## Outcomes

**1. Capability of Deep Dive** 
Navigating unfamiliar code bases, concepts, APIs, and techniques is a common challenge for developers. Participating in GSoC was akin to me going from the safety of a swimming pool and right into the expanse of the ocean. Having my mentor’s support during this transition was invaluable. He provided me with numerous opportunities to independently delve into areas I had never explored before. I have grown into  no longer fearing unknown technical areas, whether it's unfamiliar code, techniques, or concepts in specific domains. I've gained confidence in my ability to learn them step by step and use them to create the things I envision.

**2. Always Put User in Minds**
Another crucial lesson I learned is the importance of considering the user's experience and their specific use cases. While development may sometimes entail iterative processes, every aspect that directly impacts the user must be approached and executed with empathy. Neglecting this consideration can lead not only to functional errors but also erode the trust of users due to inconsistency and confusion, which then leads to them no longer using my work.

**3. Speak Up and Effectively Communicate**
Finally, In the course of development, encountering differing opinions is commonplace. It's essential to remain open to others' ideas, while also possessing the resolve to communicate one's own perspective clearly. This fosters productive discussions and ultimately elevates the quality of the development process.

### Wrap up

Being selected for Google Summer of Code 2023 and collaborating with Arnaud and the other Qdrant engineers, along with all the other community members, has been a true privilege. I'm deeply grateful to those who invested their time and effort in reviewing my code, engaging in discussions about alternatives and design choices, and offering assistance when needed. Through these interactions, I've experienced firsthand the essence of open source and the culture that encourages collaboration. This experience not only allowed me to write Rust code for a real-world product for the first time, but it also opened the door to the amazing world of open source.

Without a doubt, I'm eager to continue growing alongside this community and contribute to new features and enhancements that elevate the product. I've also become an advocate for Qdrant, introducing this project to numerous coworkers and friends in the tech industry. I'm excited to witness new users and contributors emerge from within my own network!

If you want to try out my work, read the [documentation](/documentation/concepts/filtering/#geo-polygon) and then, either sign up for a free [cloud account](https://cloud.qdrant.io) or download the [Docker image](https://hub.docker.com/r/qdrant/qdrant). I look forward to seeing how people are using my work in their own applications!
