---
title: Solving Contexto.me with Vector Search
short_description: Solving Contexto.me with Vector Search and its practical implications
description: How to solve Contexto.me with Vector Search and why it is more important than it seems
social_preview_image: /articles_data/solving-contexto/preview/social_preview.jpg
preview_dir: /articles_data/solving-contexto/preview
small_preview_image: /articles_data/solving-contexto/icon.svg
weight: 8
author: Andrei Vasnetsov
author_link: https://blog.vasnetsov.com/
date: 2022-06-28T08:57:07.604Z
# aliases: [ /articles/solving-contexto/ ]
---

<!---

Plan:

- What is Contexto.me, how it works
- Naive aproaches and why they don't work
- How we solved it
- Why it can be useful in real life

-->

## Solving what?

<!---

- There is a linguistic game called Contexto.me. 
- It takes Wordle to the next level.
- Rules:
    - You have to guess a word.
    - `The words were sorted by an artificial intelligence algorithm according to how similar they were to the secret word.`
    - By submitting a guess, you will get a position of your guess in the list of words sorted by similarity to the secret word.
    - You have unlimited number of guesses, but less attempts is better.
- Let's try to solve it.

-->

[Contexto.me](https://contexto.me/) is a linguistic game that takes the popular word game [Wordle](https://www.nytimes.com/games/wordle/index.html) to the next level.
In this game, players must guess a secret word by submitting guesses and receiving feedback on the similarity of their guess to the secret word.

The game claims that it "uses an artificial intelligence algorithm to sort words by their similarity to the secret word".
When a player submits a guess, they receive feedback on its position in the sorted list of words.
Players have an unlimited number of guesses, but the game rewards those who can solve it with fewer attempts.

Try to solve it yourself and then come back to see how we tough the machine to solve it!

## Naive approaches

<!---

There are naive approaches we tried:

- The game is obviously using some kind of Word2Vec model to sort words by similarity. 
- Explain what Word2Vec is.

- We can start with random word and just look into the list of words similar to it. If we see a word that is close to the secret word, we use it as a reference. Then we look into the list of words similar to the reference word and so on. If we see the secret word, we stop.
- This approach works, but it is very slow. It tends to stuck in clusters of words that are similar to each other, which forces us to retrieve a lot of words from the model.

- We also can't use tricks from linear algebra to evaluate exact vector based on distances to given points.
    - First, because we don't know exact word2vec model which was used to sort words.
    - Second, because we don't know the exact distance to the secret word.
    - We can only compare distances between words.

The solution should not only account for the most similar word we found so far, but also consider the distance to the words it found to be dissimilar.
-->

It's clear that the game is using some kind of Word2Vec model to sort words by their similarity to the secret word.

Word2vec is a method for representing words in a way that captures their meanings and relationships to other words.
It uses machine learning algorithms to learn the representation of words in a way that captures the meanings of words based on the context in which they appear.
This means that words with similar meanings will have similar representations, and words that often appear together will also have similar representations.
The goal of word2vec is to create a compact and efficient representation of words that can be used in natural language processing tasks, such as determining the similarity between words or predicting the next word in a sentence. 

{{< figure src=/articles_data/solving-contexto/cbow-word2vec.webp caption="Word2Vec training architecture">}}


Word2vec is one of the first methods used to represent objects in vector space. 
Currently there are a lot of more sophisticated methods, that can capture meaning of the whole texts, not just a single word.
But for our purposes word2vec will work just fine.

So, here's the naive approach you've probably already thought of:

We can start with a random word and look into the list of similar words using some Word2Vec model.
If we see a word closer to the secret word, we use it as a reference and repeat the process.

Although this approach works if we are initially close enough to the secret word, it is generally quite slow and inefficient.
It tends to get stuck in clusters of words that are similar to each other, forcing us to retrieve many words from the model.

Additionally, using linear algebra techniques to evaluate the exact vector based on distances to given points does not look feasible in this scenario.
This is because the exact word2vec model used to sort the words is unknown, as is the exact distance to the secret word.
The only option is to compare distances between words.


## One working approach

Based on the previous section, we can conclude, that using only the most similar word found so far is not enough to generate efficient guesses. 
The more efficient solution must also consider the words deemed dissimilar.

Let's consider the simplest case: we have guessed 2 words `house` and `blue` and received feedback on their similarity to the secret word.

One of the words is closer to the secret word than the other, so we can make some assumptions about the secret word.
We understand that the secret word is more likely to be similar to `house` than `blue`, but we only have the information about its relative similarity to these two words.

Let's assign a score to each word in the vocabulary based on this observation:

{{< figure src=/articles_data/solving-contexto/scoring-1.png caption="Scoring words based on 2 guesses">}}

We assign +1 score to those words that are closer to `house` than `blue` and -1 score to those words that are closer to `blue` than `house`.

Now, we can use this score to rank the words in the vocabulary and use word with the highest score as our next guess.

Let's see how scores change after we make a third guess:

{{< figure src=/articles_data/solving-contexto/scoring-2.png caption="Ranking words based on next 2 guesses">}}

We can generalize this approach to any number of guesses.
The simpliest way to do this is to sample pairs of guesses and update the score iteratively.

That's it! We can use this approach to suggest words one by one and extend guess list accordingly.

Benefits of this approach:

- It is stochastic. If there are inconsistencies in the input data, the algorithm can tolerate them.
- The algorithm does not require using exactly the same model as used in the game. It can work with any distance metric and any dimensionality of the vector space.
- The algorithm is invariant to the order of the input data.
- Algorithm only relies on the relative similarity of the words and can be easily adapted to other types of input.

We even made a simple sctipt you that you can run youself, check it out on [GitHub](https://github.com/qdrant/contexto).

The script uses [Gensim](https://radimrehurek.com/gensim/) and `word2vec-google-news-300` embeddings.
On average, it takes 20-30 guesses to solve the game.

## Why it might be useful in real life

<!---

- The game simplifies the problem, that can actually be found in many real life scenarios.
- Recomendation of products, search for pictures, etc. can be implemented as a navigation in the vector space.
- It is important for cases when users do not exactly know what they wants, but can use other items as a references.
- Modern Multi-modal neural networks, like CLIP, can allow to combine initial text query with additional clarification selections. 

-->

Although this game seems to have nothing to do with issues that arise in real life, it is, in fact, a simplified version of a problem found in many industries.

For example, recommendation systems are trying to find the most relevant items for a user based on their previous purchases and reviews.

Search for a piece of art or graphics is a similar problem. Users might not know what exactly they want, but they can use similarities to explore the collection. 
This scenario can be implemented as a navigation in the vector space.

In general, all the cases when users do not know what exactly they want or can not describe it with a text query but can use other items as references can be solved using this approach.

Moreover, with modern Multi-modal neural networks, like [CLIP](https://openai.com/blog/clip/), you can combine initial text queries with more detailed clarification selections.
So, for example, the user can type "I want a picture of a cat" and then select a breed of a cat based on how it looks.

{{< figure src=/articles_data/solving-contexto/clip.png caption="CLIP model by OpenAI">}}

### How it scales

Previously, we mentioned that the algorithm scores each word in the vocabulary.
This operation is fast enough for small vocabularies, but it can become a bottleneck for large ones.

Fortunately, in most real-life scenarios, we don't need to score all entries in the collection.
Moreover, it will work even better if we don't score pairs that have a slight difference in their similarities to the target object.

So what we actually need is to find the top of the most similar and most dissimilar vectors to the reference query.
And Qdrant is the perfect tool for this task!

In Qdrant, you can use already stored records to find the most similar vectors **fast**.
And dissimilar vectors are just vectors that are similar to an inverted query.

Check out our [documentation](https://qdrant.tech/documentation/search/#recommendation-api) to learn more about how to use Qdrant for this and other tasks.


