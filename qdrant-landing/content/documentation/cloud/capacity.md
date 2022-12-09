---
title: Capacity and sizing
weight: 20
---


We have been asked a lot about the optimal cluster configuration to serve a number of vectors.
The only right answer is “It depends”.

It depends on a number of factors and options you can choose for your collections.
The very rough formula for estimating the needed memory size looks like this.


<!---
ToDo: add a formula
-->

However, this also heavily influenced by the configuration of each collection you create on the cluster.

Furthermore, you can decide to put the metadata indexes on the disc storage, to put the vectors on the disc storage, or even put the whole HNSW index on the disc. This of course will significantly affect the memory footprint. 
Also, please note that some memory, around 10%, is reserved for the needs of the underlying system.  

<!--
@todo Andrey Vasnetsov please add more details here.
-->