package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchText;

public class Snippet {
        public static void run() throws Exception {
                matchText("description", "good cheap");
        }
}
