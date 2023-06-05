---
draft: false
id: 2
title: Common datasets snapshots
weight: 1
---

Understanding that creating embeddings every time can be a resource-intensive task, we have 
devised a more efficient solution for you. In this section, we will regularly publish 
snapshots of common public datasets often used for demonstration purposes. These snapshots 
contain pre-computed vectors, critical for semantic search, that you can easily import 
into your Qdrant instance. Our objective is to streamline your process and accelerate your 
progress. Say goodbye to redundant operations and harness the power of Qdrant with a simple 
snapshot import.

<table>
   <thead>
      <tr>
         <th>Dataset</th>
         <th>Description</th>
         <th>Model</th>
         <th>Dimensionality</th>
         <th>Link</th>
      </tr>
   </thead>
   <tbody>
      <tr>
         <th rowspan="2">Arxiv.org</th>
         <th>Only titles</th>
         <td><a href="https://huggingface.co/hkunlp/instructor-xl">InstructorXL</a></td>
         <td>768</td>
         <td>
            <a href="https://storage.googleapis.com/common-datasets-snapshots/arxiv_titles-3083016565637815127-2023-05-29-13-56-22.snapshot">
                <img src="/images/icons/download.svg" alt="download" />
            </a>
         </td>
      </tr>
      <tr>
         <th>Only abstracts</th>
         <td><a href="https://huggingface.co/hkunlp/instructor-xl">InstructorXL</a></td>
         <td>768</td>
         <td>
            <a href="https://storage.googleapis.com/common-datasets-snapshots/arxiv_abstracts-3083016565637815127-2023-06-02-07-26-29.snapshot">
                <img src="/images/icons/download.svg" alt="download" />
            </a>
         </td>
      </tr>
   </tbody>
</table>