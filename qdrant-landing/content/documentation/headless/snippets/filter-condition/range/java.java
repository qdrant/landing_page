package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.range;

import io.qdrant.client.grpc.Common.Range;

public class Snippet {
        public static void run() throws Exception {
                range("price", Range.newBuilder().setGte(100.0).setLte(450).build());
        }
}
