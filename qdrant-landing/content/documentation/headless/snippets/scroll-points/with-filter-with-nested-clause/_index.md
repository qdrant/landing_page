

This happens because both points are matching the two conditions:

- the "t-rex" matches food=meat on `diet[1].food` and likes=true on `diet[1].likes`
- the "diplodocus" matches food=meat on `diet[1].food` and likes=true on `diet[0].likes`

To retrieve only the points which are matching the conditions on an array element basis, that is the point with id 1 in this example, you would need to use a nested object filter.

Nested object filters allow arrays of objects to be queried independently of each other.

It is achieved by using the `nested` condition type formed by a payload key to focus on and a filter to apply.

The key should point to an array of objects and can be used with or without the bracket notation ("data" or "data[]").

