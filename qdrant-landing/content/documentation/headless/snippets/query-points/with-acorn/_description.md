This code snippet demonstrates how to enable ACORN for HNSW search.
ACORN improves search recall for searches with multiple low-selectivity payload filters, at the cost of reduced performance.
The `enable` parameter activates ACORN based on filter selectivity.
The `max_selectivity` parameter controls the threshold - if estimated filter selectivity is higher than this value, ACORN will not be used.
Selectivity is estimated as the ratio of points satisfying the filters to total points.
Values range from 0.0 (never use ACORN) to 1.0 (always use ACORN), with a default of 0.4.