## Re-ranking with payload values

The Query API can retrieve points not only by vector similarity but also by the content of the payload.

There are two ways to make use of the payload in the query:

* Apply filters to the payload fields, to only get the points that match the filter.
* Order the results by the payload field.

Let's see an example of when this might be useful:

