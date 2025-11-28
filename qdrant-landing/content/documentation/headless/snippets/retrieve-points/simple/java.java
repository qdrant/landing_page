package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;

import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                client
                    .retrieveAsync("{collection_name}", List.of(id(0), id(30), id(100)), false, false, null)
                    .get();
        }
}
