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

I've set up the following option with the following code:

```
Select <i style="font-size:x-large; color: #0047AB" class="fas fa-chevron-right"></i> to read more about HNSW.
```

Select <i style="font-size:x-large; color: #0047AB" class="fas fa-chevron-right"></i> to read more about HNSW.

And we add this line with:

```
{{% expand "More info on HNSW" %}}
<br>
info
<br><br>
{{% /expand %}}
```

{{% expand "More info on HNSW" %}}
<br>
Once we have a canonical Qdrant definition for HNSW, we can add it here.

<br><br>
{{% /expand %}}
<br><br>


Actually, I've set up a variable for multitenancy in the 
`layouts/shortcodes/multitenancy.md` file. I call that variable with the following code:

```
{{% multitenancy %}}
```

{{% multitenancy %}}
