---
title: Sizing Upsert Batches
weight: 13
---

# Sizing Upsert Batches

Users trying to upsert points will usually see that you can do a series of points in one request, so the natural way is to just put all points you want to insert or change into one request, but that may lead to timeouts, which is frustrating.

The solution is to split the points into chunks and upsert those chunks. That invites the question of how big those chunks should be? This document aims to give you a guideline for exactly that.

# A Simple Table

look up the rough number of entries in your points' payload on the left. Then look up the column by an estimate of the average payload value size. The following table shows you the recommended upsert batch size in points:

no. of entries of size | 100 bytes | 1k   | 2k   | 5k   | 10k  | >100k
-----------------------|-----------|------|------|------|------|-------
0                      | 1000      | 1000 | 1000 | 1000 | 1000 | 1000
1                      | 1000      | 1000 |  500 |  200 |  100 |   10
2                      | 1000      | 1000 |  250 |  100 |   50 |    5
5                      | 1000      |  200 |  100 |   40 |   20 |    2
10                     | 1000      |  100 |   50 |   20 |   10 |    1
20                     |  500      |   50 |   25 |   10 |    5 |    1
50                     |  200      |   20 |   10 |    4 |    2 |    1
100                    |  100      |   10 |    5 |    2 |    1 |    1
200                    |   50      |    5 |    2 |    1 |    1 |    1
500                    |   20      |    2 |    1 |    1 |    1 |    1
1000                   |   10      |    1 |    1 |    1 |    1 |    1

