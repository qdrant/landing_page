package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchPhrase;

public class Snippet {
        public static void run() throws Exception {
                matchPhrase("description", "brown fox");
        }
}
