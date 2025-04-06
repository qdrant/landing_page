## Facet counts

*Available as of v1.12.0*

Faceting is a special counting technique that can be used for various purposes:
- Know which unique values exist for a payload key.
- Know the number of points that contain each unique value.
- Know how restrictive a filter would become by matching a specific value.

Specifically, it is a counting aggregation for the values in a field, akin to a `GROUP BY` with `COUNT(*)` commands in SQL.

These results for a specific field is called a "facet". For example, when you look at an e-commerce search results page, you might see a list of brands on the sidebar, showing the number of products for each brand. This would be a facet for a `"brand"` field.

<aside role="status">In Qdrant you can facet on a field <strong>only</strong> if you have created a field index that supports <code>MatchValue</code> conditions for it, like a <code>keyword</code> index.</aside>

To get the facet counts for a field, you can use the following:

<aside role="status">By default, the number of <code>hits</code> returned is limited to 10. To change this, use the <code>limit</code> parameter. Keep this in mind when checking the number of unique values a payload field contains.</aside>

REST API ([Facet](https://api.qdrant.tech/v-1-13-x/api-reference/points/facet))

