package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.geoBoundingBox;

public class Snippet {
        public static void run() throws Exception {
                geoBoundingBox("location", 52.520711, 13.403683, 52.495862, 13.455868);
        }
}
