package com.example.snippets_amalgamation;

public class Snippet {
        public static void run() throws Exception {
                client
                      .facetAsync(
                          Points.FacetCounts.newBuilder()
                              .setCollectionName(collection_name)
                              .setKey("foo")
                              .setExact(true)
                              .build())
                      .get();
        }
}
