package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeyword;

public class Snippet {
        public static void run() throws Exception {
                matchKeyword("color", "red");
        }
}
