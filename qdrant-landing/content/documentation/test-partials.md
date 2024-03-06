---
title: POC - Test documentation for partials
weight: 1
hideInSidebar: true
---

This is a POC of features from Hugo (gohugo.io) that I'd like to incorporate into our
docs. We probably can also use this in our articles and blog posts.

This first feature relates to progressive disclosure. When we have a "lot" of content, 
many readers may want to skip over content such as descriptions of HNSW that they
already know.


{{% expand "More info on HNSW" %}}
Once we have a canonical Qdrant definition for HNSW, we can add it here.
{{% /expand %}}
<br>

To review the code I used to set this up, see [my test-partials.md file](https://github.com/qdrant/landing_page/pull/690/files#diff-526e365af25822ada556c462693e51ebee57e500a3c7d0bfb5b07d78357f5014)

In addition, I've set up a variable for multitenancy in the 
`layouts/shortcodes/multitenancy.md` file. I call that as a variable, specifically (without the backslash), as follows:

```markdown
"{{\% multitenancy %}}"
```

Once we set up the Qdrant definition for multitenancy, we can call it anywhere
in our docs. This will help us stay consistent.

And here's the content of multitenancy.md file, in the `qdrant-landing/layouts/shortcodes` directory:

> {{% multitenancy %}}
