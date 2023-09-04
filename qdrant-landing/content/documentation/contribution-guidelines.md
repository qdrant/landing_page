---
title: Contribution Guidelines
weight: 35
draft: true
---

# Contributing Guidelines

Welcome to the Qdrant repository! Whether you're a developer, data scientist, or just curious about similarity search and vector indexing, we're excited to have you on board. This guide will help you kickstart your journey with Qdrant. 

## Introduction

Qdrant is an open-source similarity search engine that specializes in high-dimensional vector indexing. It is designed to help you efficiently search and retrieve vectors. Qdrant is an ideal tool for a wide range of applications, including recommendation systems, search engines, and more.

## Getting Started

Discover how Qdrant revolutionizes similarity search through in-depth vector indexing!

It covers various topics, including installation, advanced usage, and optimization to cater both beginners and experts. For more information, see the [Qdrant Documentation](https://github.com/qdrant/landing_page/tree/master/qdrant-landing/content/documentation) on GitHub.

| Quick Links                                                 | Scope of Page                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| [**Quick Start Guide**](https://github.com/qdrant/landing_page/blob/master/qdrant-landing/content/documentation/quick-start.md)     |Learn how to set up and run first queries. |
| [**Installation Guide**](https://github.com/qdrant/landing_page/blob/master/qdrant-landing/content/documentation/guides/installation.md) | Learn how to install Qdrant on your system, including both basic and advanced installation options.           |
| [**Usage Examples**](https://github.com/qdrant/internal-examples)   | Learn how Qdrant can be used in real-world scenarios.  |
|[**Internal Examples**](https://github.com/qdrant/internal-examples)   | Learn how to use Qdrant and adjacent technologies.     |
|[**API Reference**](https://qdrant.github.io/qdrant/redoc/)   | Learn and explore the API reference to understand how to interact with Qdrant programmatically.     |
|[**Rust Contributing Guide**](https://github.com/qdrant/qdrant/blob/master/CONTRIBUTING.md)   | Learn about how to contribute in the Rust Code for Qdrant contribution guide.     |

## Contributing Instructions

We appreciate various types of contributions that can help improve our documentation:

* **Documentation Edits:** You can contribute by making edits and improvements to the existing documentation. This includes fixing typos, correcting inaccuracies, and improving clarity.

* **Adding New Documentation:** You can contribute by adding new topics to our documentation if required. The new topics can include adding new documentation sections, guides, or tutorials.

* **Join the Community**: Qdrant has a vibrant and welcoming community of developers and enthusiasts. Connect with us on our [GitHub repository](https://github.com/qdrant/qdrant) and other communication channels to ask questions, share ideas, and collaborate.

* **Contribute**: If you are interested in contributing to Qdrant, check out our contribution guidelines. We welcome contributions in the form of code, documentation, bug reports, and more. You can do it in any convenient way - create an [issue](https://github.com/qdrant/qdrant/issues), start a [discussion](https://github.com/qdrant/qdrant/discussions), or drop us a [message](https://discord.gg/tdtYvXjC4h).

* **Start Building**: Ready to put Qdrant to work? Follow our step-by-step guides in the documentation to set up Qdrant in your environment and start building your similarity search solutions.

* **Stay Informed:** Keep an eye on our project updates, releases, and community events. Be sure to subscribe to our mailing lists or follow us on social media to stay informed about the latest developments.

## Markdown Styleguide

Following are some markdown styleguides you need to follow:

1. To add code for different language variants, use blocks of code in the markdown, one after the other, indicating the language:
    ``` bash
        # here is your code
    ```
    
    ``` python
        # here is your code
    ```
    The copy button appears by default on any outline code blocks.
   
2. To add a note in markdown, you can use:
  `> **_NOTE:_**  The note content.`

3. To create a blockquote, add a > in front of a paragraph.

> This is a sample text

  To create blockquotes with multiple paragraphs, add a > on the blank lines between the paragraphs.

> This is the sample text part 1.
>
> This is the sample text part 2.

## How to contribute to Qdrant documentation

To add or update the Qdrant documentation on GitHub, follow the steps given below:

### First contributions

#### You need to have access to the Qdrant repository where the contribution guide is located.

#### If you don't have git on your machine, [install it](https://docs.github.com/en/get-started/quickstart/set-up-git).

### **Fork the repository:**

* Visit the [Qdrant repository](https://github.com/qdrant/landing_page) on GitHub. Click the **Fork** button in the upper-right corner to create a copy of the repository under your GitHub account.

 The repository forking lets you copy the source code repository locally and make any changes.


### **Clone your forked repository:**

* On your forked repository, click the **Code** button and copy the repository URL.
* Open your terminal or command prompt and use the `git clone` command to clone the repository to your local machine. Replace `<your-username>` with your GitHub username:

  `git clone https://github.com/<your-username>/landing_page.git`

### **Make changes:**

* Locate the files you want to add or update in the cloned repository. You can add or update the files using a text editor or a markdown editor.
* Once you make your desired changes to the contribution guidelines, you can use standard markdown syntax for formatting.
  
### **Commit your changes:**

* After making your changes, save the new or updated files.
* In the terminal or command prompt, navigate to your local repository folder.
* Use the following commands to commit your changes:

  `git add file_name.md`
  `git commit -m "Added or Updated files"`

### **Push Your Changes:**

* Push the changes to your forked repository on GitHub:

  `git push origin master`
  
### **Create a Pull Request:**

* Visit your forked repository on GitHub, and you should see a banner indicating that you've pushed a new branch. Click the **Compare & pull request** button.

### **Submit the Pull Request:**

* On the pull request page, provide a meaningful title and description for your changes. Review your changes to ensure everything looks good.
* Click the **Create pull request** button to submit your changes.
  
### **Review and Collaborate:**

* The maintainers of the Qdrant repository will review your pull request. They may ask for further changes or provide feedback.
* Once your changes are approved, they will be merged into the main repository.
  
**Result**: You have updated the Qdrant documentation. Be sure to monitor your pull request for any comments or feedback from the repository maintainers.

## Feel free to contribute more
If you use Qdrant or Metric Learning in your projects, we'd love to hear your story! Feel free to share articles and demos in our community.

## Contact

If you have problems with code or architecture understanding - reach us at any time.
Feeling confident and want to contribute more? - Come to [work with us](https://qdrant.join.com/)!
