package com.example.snippets_amalgamation;

import static io.qdrant.client.PointIdFactory.id;

import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                client.deleteAsync("{collection_name}", List.of(id(0), id(3), id(100)));
        }
}
