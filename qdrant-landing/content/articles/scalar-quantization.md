---
title: Quantized Qdrant Queries Quality
short_description: "TBD"
description: "TBD"
social_preview_image: /articles_data/scalar-quantization/social_preview.png
small_preview_image: /articles_data/scalar-quantization/quantization-icon.svg
preview_dir: /articles_data/scalar-quantization/preview
weight: 3
author: XXX
author_link: XXX
date: 2023-03-21T10:45:00+01:00
draft: false
keywords:
  - vector search
  - scalar quantization
  - TBD
---

High-dimensional vector embeddings can be memory-intensive, especially when working with 
large datasets consisting of millions of vectors. Memory footprint really starts being 
a concern when we scale things up. A small choice of the data type used to store a single
number impacts even billions of numbers and can drive the memory requirements crazy. The
higher the precision of your type, the more accurately you can represent the numbers. 
The more accurate your vectors, the more precise is the distance calculation. But the 
advantages stop paying off when you need to order more and more memory. 

Qdrant chose `float32` as a default type used to store the numbers of your embeddings. 
So a single number needs 4 bytes of the memory and a 512-dimensional vector occupies 
2 kB. That's only the memory used to store the vector. There is also an overhead of the
HNSW graph, so as a rule of thumb we estimate the memory size with the following formula:

```
memory_size = number_of_vectors * vector_dimension * 4 bytes * 1.5
```

While Qdrant offers various options to store some parts of the data on disk, starting
from the version 1.1.0, you can also optimize your memory by changing the data type used
by the embeddings. We've implemented the mechanism of **Scalar Quantization**!

## Scalar Quantization

Scalar quantization is a data compression technique that converts floating point values 
into integers. In case of Qdrant `float32` gets converted into `int8`, so a single number 
needs 75% less memory. It's not a simple rounding though! It's a process that makes that
transformation partially reversible, so we can also revert integers back to floats with 
a small loss of precision. 

### Theoretical background

Assume we have a collection of `float32` vectors and denote a single value as `f32`. 
In reality neural embeddings do not cover a whole range represented by the floating
point numbers, but rather a small subrange. Since we know all the other vectors, we can 
establish some statistics of all the numbers. For example, the distribution of the values 
will be typically normal:

![A distribution of the vector values](/articles_data/scalar-quantization/float32-distribution.png)

Our example shows that 99% of the values come from a `[-2.0, 5.0]` range. And the 
conversion to `int8` will surely lose some precision, so we rather prefer keeping the 
representation accuracy within the range of 99% of the most probable values and ignoring
the precision of the outliers. There might be a different choice of the range width, 
actually, any value from a range `[0, 1]`, where `0` means empty range, and `1` would 
keep all the values. That's a hyperparameter of the procedure called `quantile`. A value 
of `0.95` or `0.99` is typically a reasonable choice, but in general `quantile ∈ [0, 1]`.

#### Conversion to integers

Let's talk about conversion to `int8`. Integers also have a finite set of values that
might be represented. Within a single byte they may represent up to 256 different values,
either from `[-128, 127]` or `[0, 255]`.

![Value ranges represented by int8](/articles_data/scalar-quantization/int8-value-range.png)

Since we put some boundaries on the numbers that might be represented by the `f32`, and
`i8` has some natural boundaries, the process of converting the values between those
two ranges is quite natural:

$$ f32 = \alpha * i8 + offset $$

$$ i8 = \frac{f32 - offset}{\alpha} $$

The parameters $ \alpha $ and $ offset $ has to be calculated for a given set of vectors, 
but that comes easily by putting the minimum and maximum of the represented range for 
both `f32` and `i8`. 

![Float32 to int8 conversion](/articles_data/scalar-quantization/float32-to-int8-conversion.png)

For the unsigned `int8` it will go as following:

$$ \begin{equation}
\begin{cases} -2 = \alpha * 0 + offset \\\\ 5 = \alpha * 255 + offset \end{cases} 
\end{equation} $$

In case of signed `int8`, we'll just change the represented range boundaries:

$$ \begin{equation}
\begin{cases} -2 = \alpha * (-128) + offset \\\\ 5 = \alpha * 127 + offset \end{cases} 
\end{equation} $$

For any set of vector values we can simply calculate the $ \alpha $ and $ offset $ and 
those values have to be stored along with the collection to enable to conversion between
the types. 

#### Distance calculation

We do not store the vectors in the collections represented by `int8` instead of `float32` 
just for the sake of compressing the memory. But the coordinates are being used while we 
calculate the distance between the vectors. Both dot product and cosine distance requires 
multiplying the corresponding coordinates of two vectors, so that's the operation we 
perform quite often on `float32`. Here is how it would look like if we perform the 
conversion to `int8`:

$$ f32 * f32' = $$
$$ = (\alpha * i8 + offset) * (\alpha * i8' + offset) = $$
$$ = \alpha^{2} * i8 * i8' + offset * \alpha * i8' + offset * \alpha * i8 + offset^{2} $$

The first term, $ \alpha^{2} * i8 * i8' $ has to be calculated when we measure the
distance as it depends on both vectors. However, both the second and the third term 
($ offset * \alpha * i8' $ and $ offset * \alpha * i8 $ respectively), depend only on a 
single vector and those might be precomputed and kept for each vector. The last term,
$ offset^{2} $ does not depend on any of the values, so it might be even computed once
and reused.

If we had to calculate all the terms to measure the distance, the performance could have 
been even worse than without the conversion. But thanks for the fact we can precompute
the majority of the terms, things are getting simpler. And in turns out the scalar 
quantization has a positive impact not only on the memory usage, but also on the 
performance. But we did some benchmarks to back this statement!

### Qdrant implementation

Scalar Quantization is performed during the indexing and is disabled in plain segments, 
but we decided to keep the original vectors along with the quantized ones. 8-bit integer 
allows using the range `[-128, 127]`, but we use shorted `[0, 127]`. It is required for 
SIMD optimizations.

## Benchmarks

We simply used the same approach as we use in all [the other benchmarks we publish](/benchmarks).
Both [Arxiv-titles-384-angular-no-filters](https://github.com/qdrant/ann-filtering-benchmark-datasets) 
and [Gist-960](https://github.com/erikbern/ann-benchmarks/) datasets were chosen to make 
the comparison between non-quantized and quantized vectors. The results are summarized
in the tables:

### Arxiv-titles-384-angular-no-filters	

<table>
   <thead>
      <th></th>
      <th>Upload time</th>
      <th>Upload and indexing time</th>
      <th>Mean search precision (ef = 128)</th>
      <th>Mean search time (ef = 128)</th>
      <th>Mean search precision (ef = 256)</th>
      <th>Mean search time (ef = 256)</th>
      <th>Mean search precision (ef = 512)</th>
      <th>Mean search time (ef = 512)</th>
   </thead>
   <tbody>
      <tr>
         <th>Non-quantized vectors</th>
         <td>418 s</td>
         <td>649 s</td>
         <td>0.989</td>
         <td>0.0094</td>
         <td>0.994</td>
         <td>0.0932</td>
         <td>0.996</td>
         <td>0.161</td>
      </tr>
      <tr>
         <th>Scalar Quantization</th>
         <td>411 s</td>
         <td>496 s</td>
         <td>0.986</td>
         <td>0.0037</td>
         <td>0.993</td>
         <td>0.060</td>
         <td>0.996</td>
         <td>0.115</td>
      </tr>
      <tr>
         <td>Difference</td>
         <td><span style="color: green;">-1.67%</span></td>
         <td><span style="color: green;">-23.57%</span></td>
         <td><span style="color: red;">-0.3%</span></td>
         <td><span style="color: green;">-60.64%</span></td>
         <td><span style="color: red;">-0.1%</span></td>
         <td><span style="color: green;">-35.62%</span></td>
         <td>0%</td>
         <td><span style="color: green;">-28.57%</span></td>
      </tr>
   </tbody>
</table>

### Gist-960

<table>
   <thead>
      <th></th>
      <th>Upload time</th>
      <th>Upload and indexing time</th>
      <th>Mean search precision (ef = 128)</th>
      <th>Mean search time (ef = 128)</th>
      <th>Mean search precision (ef = 256)</th>
      <th>Mean search time (ef = 256)</th>
      <th>Mean search precision (ef = 512)</th>
      <th>Mean search time (ef = 512)</th>
   </thead>
   <tbody>
      <tr>
         <th>Non-quantized vectors</th>
         <td>272</td>
         <td>452</td>
         <td>0.802</td>
         <td>0.077</td>
         <td>0.887</td>
         <td>0.135</td>
         <td>0.941</td>
         <td>0.231</td>
      </tr>
      <tr>
         <th>Scalar Quantization</th>
         <td>247</td>
         <td>312</td>
         <td>0.802</td>
         <td>0.043</td>
         <td>0.888</td>
         <td>0.077</td>
         <td>0.941</td>
         <td>0.135</td>
      </tr>
      <tr>
         <td>Difference</td>
         <td><span style="color: green;">-9.19%</span></td>
         <td><span style="color: green;">-30.79%</span></td>
         <td>0%</td>
         <td><span style="color: green;">-44,16%</span></td>
         <td><span style="color: green;">+0.11%</span></td>
         <td><span style="color: green;">-42.96%</span></td>
         <td>0%</td>
         <td><span style="color: green;">-41,56%</span></td>
      </tr>
   </tbody>
</table>

In all the cases, the decrease in search precision is negligible, but we keep a latency 
reduction of at least 28.57%, even up to 60,64%, while searching. As a rule of thumb,
the higher the dimensionality of the vectors, the lower the precision loss.

## Good practices

TBD
