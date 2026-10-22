package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchSubstring;

public class Snippet {
        public static void run() throws Exception {
                matchSubstring("url", "qdrant.tech/");
        }
}
