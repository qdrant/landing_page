---
title: Movie Search Demo
weight: 4
---

{{< date >}} Day 1 {{< /date >}}

# Building a Movie Recommendation Engine

Let's take everything we've learned so far and put it to work in a meaningful project: a movie recommendation system.

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

**Follow along:** [Google Colab Notebook](https://colab.research.google.com/github/qdrant/examples/blob/main/movie-search-system/movie_search_demo.ipynb)

## Project Overview: Beyond Simple Recommendations

When we say "recommendation system," we don't mean a complicated deep learning pipeline with user embeddings and cosine similarities swirling in a cloud of metrics. We mean something simpler—and at the same time, more foundational.

**We're building a search engine. One that understands what a movie means.**

We'll take long, rich movie descriptions and split them into semantically meaningful chunks. We'll embed those chunks using a pretrained model, then store them in Qdrant along with metadata like title, director, year, and genre.

This mini-project demonstrates how to implement a practical recommendation system using Qdrant's core features, reinforcing all the concepts covered in our first three videos.

## What You'll Build

By the end of this project, you'll have:

- **Semantic movie search** - Find films by plot, theme, or mood
- **Advanced filtering** - Search within specific genres, years, or ratings  
- **Rich metadata** - Store and retrieve detailed film information
- **Hybrid queries** - Combine vector similarity with traditional filters
- **Real-world pipeline** - Complete data processing and search workflow

## Step 1: Setting Up the Movie Dataset

First, let's create a sample dataset of science fiction movies with rich descriptions:

```python
# Sample movie dataset
movies_data = [
    {
        "id": "blade_runner_2049",
        "title": "Blade Runner 2049",
        "director": "Denis Villeneuve", 
        "year": 2017,
        "genre": ["Science Fiction", "Drama", "Thriller"],
        "rating": 8.0,
        "description": """Thirty years after the events of the first film, a new blade runner, 
        LAPD Officer K, discovers a long-buried secret that has the potential to plunge what's 
        left of society into chaos. K's discovery leads him on a quest to find Rick Deckard, 
        a former LAPD blade runner who has been missing for 30 years. The film explores themes 
        of humanity, identity, and what it means to be real in a world where artificial beings 
        are nearly indistinguishable from humans. Set in a dystopian Los Angeles, the movie 
        continues the philosophical questions about consciousness and soul."""
    },
    {
        "id": "interstellar", 
        "title": "Interstellar",
        "director": "Christopher Nolan",
        "year": 2014,
        "genre": ["Science Fiction", "Drama"],
        "rating": 8.6,
        "description": """In the near future, Earth is becoming uninhabitable due to climate change 
        and crop failures. A team of astronauts travels through a wormhole near Saturn in search 
        of a new home for humanity. The film combines hard science fiction with emotional storytelling, 
        exploring concepts of time dilation, black holes, and higher dimensions. At its core, it's 
        a story about love transcending space and time, as Cooper struggles to reunite with his 
        daughter Murph while trying to save the human race. The movie tackles themes of sacrifice, 
        hope, and the power of human connection across vast distances."""
    },
    {
        "id": "arrival",
        "title": "Arrival", 
        "director": "Denis Villeneuve",
        "year": 2016,
        "genre": ["Science Fiction", "Drama"],
        "rating": 7.9,
        "description": """When twelve mysterious alien spacecraft appear around the world, linguistics 
        professor Louise Banks is recruited by the military to communicate with the extraterrestrial 
        visitors. As she learns their language, she begins to experience visions that seem to show 
        her future. The film explores how language shapes thought and perception, suggesting that 
        learning the aliens' non-linear language allows Louise to experience time differently. 
        It's a meditation on communication, loss, and the choices we make when we know the future. 
        The story challenges our understanding of time and free will."""
    },
    {
        "id": "ex_machina",
        "title": "Ex Machina",
        "director": "Alex Garland", 
        "year": 2014,
        "genre": ["Science Fiction", "Thriller"],
        "rating": 7.7,
        "description": """A young programmer named Caleb wins a contest to spend a week at the private 
        estate of his company's CEO, Nathan. There, he's asked to administer a Turing test to an 
        advanced AI robot named Ava to determine if she has consciousness. As Caleb interacts with 
        Ava, he becomes increasingly convinced of her sentience and begins to question Nathan's 
        motives. The film explores themes of artificial intelligence, consciousness, manipulation, 
        and the nature of humanity. It raises questions about what makes someone human and whether 
        AI can truly experience emotions or if it's simply very good at simulating them."""
    },
    {
        "id": "the_matrix",
        "title": "The Matrix",
        "director": "The Wachowskis",
        "year": 1999, 
        "genre": ["Science Fiction", "Action"],
        "rating": 8.7,
        "description": """Neo, a computer hacker, discovers that reality as he knows it is actually 
        a computer simulation called the Matrix, designed to subjugate humanity while machines 
        harvest their bodies for energy. Recruited by the mysterious Morpheus and his crew of rebels, 
        Neo must learn to manipulate the Matrix and become 'The One' prophesied to free humanity. 
        The film explores themes of reality versus illusion, free will versus determinism, and 
        the nature of existence. It combines philosophical depth with groundbreaking action sequences, 
        asking whether ignorant bliss is preferable to painful truth."""
    }
]
```

## Step 2: Setting Up Qdrant and Dependencies

```python
import os
from datetime import datetime
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, 
    Filter, FieldCondition, MatchValue, Range
)
from sentence_transformers import SentenceTransformer

# Initialize Qdrant client
client = QdrantClient(
    url=os.getenv("QDRANT_URL", "http://localhost:6333"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

print("Qdrant client and embedding model initialized successfully!")
```

## Step 3: Creating the Collection

```python
collection_name = "movie_recommendations"

# Create collection with appropriate vector configuration
client.create_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(
        size=384,  # all-MiniLM-L6-v2 embedding size
        distance=Distance.COSINE  # Best for semantic similarity
    ),
)

print(f"Collection '{collection_name}' created successfully!")
```

## Step 4: Chunking and Processing Movie Data

Now let's implement our chunking strategy for movie descriptions:

```python
def chunk_movie_description(description, max_words=100):
    """
    Split movie description into semantic chunks
    For movie descriptions, we'll use sentence-based chunking
    """
    from nltk.tokenize import sent_tokenize
    
    sentences = sent_tokenize(description)
    chunks = []
    current_chunk = []
    current_word_count = 0
    
    for sentence in sentences:
        word_count = len(sentence.split())
        
        if current_word_count + word_count > max_words and current_chunk:
            # Create chunk from current sentences
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_word_count = word_count
        else:
            current_chunk.append(sentence)
            current_word_count += word_count
    
    # Add remaining sentences as final chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

def process_movie_data(movie):
    """Process a single movie into chunks with embeddings and metadata"""
    chunks = chunk_movie_description(movie["description"])
    points = []
    
    for chunk_index, chunk in enumerate(chunks):
        # Generate embedding for this chunk
        embedding = embedding_model.encode(chunk).tolist()
        
        # Create rich metadata payload
        payload = {
            "movie_id": movie["id"],
            "title": movie["title"],
            "director": movie["director"],
            "year": movie["year"],
            "genre": movie["genre"],
            "rating": movie["rating"],
            "chunk_index": chunk_index,
            "total_chunks": len(chunks),
            "content": chunk,
            "word_count": len(chunk.split()),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Create point with unique ID
        point_id = f"{movie['id']}_chunk_{chunk_index}"
        
        points.append(PointStruct(
            id=point_id,
            vector=embedding,
            payload=payload
        ))
    
    return points

# Process all movies
all_points = []
for movie in movies_data:
    movie_points = process_movie_data(movie)
    all_points.extend(movie_points)
    print(f"Processed '{movie['title']}' - {len(movie_points)} chunks")

print(f"Total points to insert: {len(all_points)}")
```

## Step 5: Inserting Data into Qdrant

```python
# Insert all points into the collection
client.upsert(
    collection_name=collection_name,
    points=all_points
)

print("All movie data inserted successfully!")

# Verify the data
collection_info = client.get_collection(collection_name)
print(f"Collection info: {collection_info}")
```

## Step 6: Implementing Search Functions

Now let's create various search functions to demonstrate different query types:

### Basic Semantic Search

```python
def search_movies(query, limit=5):
    """Basic semantic search across movie descriptions"""
    query_embedding = embedding_model.encode(query).tolist()
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        limit=limit
    )
    
    print(f"Search results for: '{query}'")
    print("-" * 50)
    
    for result in results:
        payload = result.payload
        print(f"Title: {payload['title']} ({payload['year']})")
        print(f"Director: {payload['director']}")
        print(f"Score: {result.score:.3f}")
        print(f"Content: {payload['content'][:150]}...")
        print(f"Genres: {', '.join(payload['genre'])}")
        print("-" * 30)

# Test basic search
search_movies("artificial intelligence and consciousness")
```

### Filtered Search by Genre

```python
def search_by_genre(query, genre_filter, limit=5):
    """Search movies within a specific genre"""
    query_embedding = embedding_model.encode(query).tolist()
    
    # Create filter for specific genre
    genre_filter_condition = Filter(
        must=[
            FieldCondition(
                key="genre",
                match=MatchValue(value=genre_filter)
            )
        ]
    )
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        query_filter=genre_filter_condition,
        limit=limit
    )
    
    print(f"Search results for '{query}' in {genre_filter} genre:")
    print("-" * 50)
    
    for result in results:
        payload = result.payload
        print(f"Title: {payload['title']} ({payload['year']})")
        print(f"Score: {result.score:.3f}")
        print(f"Content: {payload['content'][:100]}...")
        print("-" * 30)

# Test genre-filtered search
search_by_genre("time travel and family", "Drama")
```

### Search by Year Range

```python
def search_by_year_range(query, start_year, end_year, limit=5):
    """Search movies within a specific year range"""
    query_embedding = embedding_model.encode(query).tolist()
    
    # Create filter for year range
    year_filter = Filter(
        must=[
            FieldCondition(
                key="year",
                range=Range(gte=start_year, lte=end_year)
            )
        ]
    )
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        query_filter=year_filter,
        limit=limit
    )
    
    print(f"Search results for '{query}' between {start_year}-{end_year}:")
    print("-" * 50)
    
    for result in results:
        payload = result.payload
        print(f"Title: {payload['title']} ({payload['year']})")
        print(f"Score: {result.score:.3f}")
        print(f"Content: {payload['content'][:100]}...")
        print("-" * 30)

# Test year range search
search_by_year_range("dystopian future", 2010, 2020)
```

### Advanced Multi-Filter Search

```python
def advanced_search(query, min_rating=None, genres=None, start_year=None, end_year=None, limit=5):
    """Advanced search with multiple filters"""
    query_embedding = embedding_model.encode(query).tolist()
    
    # Build filter conditions
    filter_conditions = []
    
    if min_rating:
        filter_conditions.append(
            FieldCondition(key="rating", range=Range(gte=min_rating))
        )
    
    if genres:
        for genre in genres:
            filter_conditions.append(
                FieldCondition(key="genre", match=MatchValue(value=genre))
            )
    
    if start_year and end_year:
        filter_conditions.append(
            FieldCondition(key="year", range=Range(gte=start_year, lte=end_year))
        )
    
    # Create filter if we have conditions
    query_filter = Filter(must=filter_conditions) if filter_conditions else None
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        query_filter=query_filter,
        limit=limit
    )
    
    print(f"Advanced search results for: '{query}'")
    if min_rating:
        print(f"Minimum rating: {min_rating}")
    if genres:
        print(f"Genres: {', '.join(genres)}")
    if start_year and end_year:
        print(f"Years: {start_year}-{end_year}")
    print("-" * 50)
    
    for result in results:
        payload = result.payload
        print(f"Title: {payload['title']} ({payload['year']})")
        print(f"Director: {payload['director']}")
        print(f"Rating: {payload['rating']}")
        print(f"Score: {result.score:.3f}")
        print(f"Content: {payload['content'][:120]}...")
        print("-" * 30)

# Test advanced search
advanced_search(
    query="love and sacrifice", 
    min_rating=8.0, 
    genres=["Science Fiction"], 
    start_year=2010, 
    end_year=2020
)
```

## Step 7: Recommendation Features

### Find Similar Movies

```python
def find_similar_movies(movie_title, limit=3):
    """Find movies similar to a given movie"""
    # First, find the movie by title
    title_filter = Filter(
        must=[
            FieldCondition(key="title", match=MatchValue(value=movie_title))
        ]
    )
    
    # Get the first chunk of the target movie
    target_results = client.search(
        collection_name=collection_name,
        query_vector=[0] * 384,  # Dummy vector, we just want to filter
        query_filter=title_filter,
        limit=1
    )
    
    if not target_results:
        print(f"Movie '{movie_title}' not found")
        return
    
    # Use the first chunk's vector to find similar content
    target_vector = target_results[0].vector
    target_movie_id = target_results[0].payload["movie_id"]
    
    # Search for similar content, excluding the target movie
    exclude_filter = Filter(
        must_not=[
            FieldCondition(key="movie_id", match=MatchValue(value=target_movie_id))
        ]
    )
    
    similar_results = client.search(
        collection_name=collection_name,
        query_vector=target_vector,
        query_filter=exclude_filter,
        limit=limit * 2  # Get more to ensure we have different movies
    )
    
    # Group by movie to avoid duplicates
    seen_movies = set()
    unique_results = []
    
    for result in similar_results:
        movie_id = result.payload["movie_id"]
        if movie_id not in seen_movies and len(unique_results) < limit:
            seen_movies.add(movie_id)
            unique_results.append(result)
    
    print(f"Movies similar to '{movie_title}':")
    print("-" * 50)
    
    for result in unique_results:
        payload = result.payload
        print(f"Title: {payload['title']} ({payload['year']})")
        print(f"Similarity Score: {result.score:.3f}")
        print(f"Matching Content: {payload['content'][:120]}...")
        print("-" * 30)

# Test similarity search
find_similar_movies("Blade Runner 2049")
```

### Theme-Based Recommendations

```python
def recommend_by_theme(theme_description, limit=3):
    """Recommend movies based on thematic content"""
    query_embedding = embedding_model.encode(theme_description).tolist()
    
    results = client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        limit=limit * 2  # Get more to ensure variety
    )
    
    # Group by movie for unique recommendations
    seen_movies = set()
    unique_results = []
    
    for result in results:
        movie_id = result.payload["movie_id"]
        if movie_id not in seen_movies and len(unique_results) < limit:
            seen_movies.add(movie_id)
            unique_results.append(result)
    
    print(f"Movie recommendations for theme: '{theme_description}'")
    print("-" * 50)
    
    for result in unique_results:
        payload = result.payload
        print(f"Title: {payload['title']} ({payload['year']})")
        print(f"Director: {payload['director']}")
        print(f"Relevance Score: {result.score:.3f}")
        print(f"Why it matches: {payload['content'][:150]}...")
        print(f"Genres: {', '.join(payload['genre'])}")
        print("-" * 30)

# Test theme-based recommendations
recommend_by_theme("questioning reality and the nature of existence")
```

## Step 8: Testing Your Movie Search System

Now let's test our complete system with various queries:

```python
# Test various search scenarios
print("=" * 60)
print("TESTING MOVIE RECOMMENDATION SYSTEM")
print("=" * 60)

# 1. Basic semantic search
print("\n1. SEMANTIC SEARCH - 'time travel'")
search_movies("time travel", limit=3)

# 2. Mood-based search
print("\n2. MOOD-BASED SEARCH - 'philosophical and thought-provoking'")
search_movies("philosophical and thought-provoking", limit=3)

# 3. Genre-specific search
print("\n3. GENRE SEARCH - 'action' in Science Fiction")
search_by_genre("action", "Science Fiction", limit=3)

# 4. Advanced filtered search
print("\n4. ADVANCED SEARCH - High-rated recent sci-fi about AI")
advanced_search(
    query="artificial intelligence", 
    min_rating=7.5, 
    genres=["Science Fiction"], 
    start_year=2010, 
    end_year=2020,
    limit=3
)

# 5. Similar movie recommendations
print("\n5. SIMILAR MOVIES to 'The Matrix'")
find_similar_movies("The Matrix", limit=3)

# 6. Theme-based recommendations
print("\n6. THEME RECOMMENDATIONS - 'father-daughter relationship'")
recommend_by_theme("father-daughter relationship", limit=3)
```

## Key Learning Outcomes

Through building this movie recommendation system, you've successfully implemented:

### 1. **Data Model Design**
- Structured movie data with rich metadata
- Semantic chunking of movie descriptions
- Meaningful payload design for filtering and display

### 2. **Vector Search Implementation**
- Semantic similarity search for movie discovery
- Multiple distance metrics understanding (cosine similarity)
- Real-world embedding generation and storage

### 3. **Advanced Filtering**
- Genre-based filtering
- Year range queries
- Rating thresholds
- Multi-condition filtering

### 4. **Recommendation Logic**
- Content-based similarity recommendations
- Theme-based movie discovery
- Handling duplicate results across chunks

### 5. **Production Considerations**
- Proper metadata structure for rich results
- Efficient chunking for movie descriptions
- Search result grouping and deduplication

## Next Steps and Extensions

You can extend this system by:

1. **Adding More Data Sources**
   - IMDB ratings and reviews
   - Cast and crew information
   - Movie posters and trailers

2. **Enhanced Search Features**
   - Fuzzy matching for movie titles
   - Actor/director-based recommendations
   - Mood and emotion-based search

3. **User Personalization**
   - User preference vectors
   - Viewing history integration
   - Collaborative filtering

4. **Performance Optimization**
   - Result caching
   - Batch processing for large datasets
   - Index optimization

## Congratulations!

You've built a functional movie recommendation system that demonstrates all the core concepts from Day 1:

- **Points and vectors** - Movie chunks with embeddings
- **Distance metrics** - Cosine similarity for semantic search
- **Payloads** - Rich metadata for filtering and display
- **Chunking strategies** - Sentence-based processing of descriptions
- **Embedding models** - Real semantic understanding with Sentence Transformers

This foundation prepares you for more advanced topics in the coming days, including indexing optimization, hybrid search, and production deployment strategies. 