package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchPrefix;

public class Snippet {
        public static void run() throws Exception {
                matchPrefix("url", "https://qdrant.");
        }
}
