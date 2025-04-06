"""
A script which reads markdown file and extracts snippets from it into a separate folder
grouped by the language and category.


Example.md:


## Create collection with qdrant

How to create a collection with qdrant:


```http
PUT /collections/my_collection
{
    "vector_config": {
        "size": 1536,
        "distance": "Cosine"
    }
}
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="my_collection",
    vectors_config=VectorParams(size=1536, distance="Cosine"),
)
```


---

Now, the script should extract the snippets into a separate folder grouped by the language and "category".
Category should be asked from the user, it may contain 2 parts - top-level category and sub-category.

For example: `create-collection/simple-collection`

This will create a folder `create-collection` and inside it will create a folder `simple-collection`.
All snippets should be placed into this folder with names `http.md`, `python.md`, etc.

Path to the root folder is defined in the `SNIPPETS_ROOT` variable.

Instead of providing the category, user can skip it, in this case snippets should be ignored.

If the category is provided, the script should create a folder for the category if it doesn't exist.

Snippets in the original file should be replaced with the link to the new file, which looks like this:

```
{{< code-snippet path="{SNIPPERS_MD_ROOT}/{CATEGORY}/{SUBCATEGORY}/" >}}
```

"""

import dataclasses
import re
import os
import argparse
from typing import Optional


SNIPPETS_ROOT = "qdrant-landing/content/documentation/headless/snippets/"
SNIPPERS_MD_ROOT = "/documentation/headless/snippets"


@dataclasses.dataclass
class Snippet:
    language: str
    content: str


@dataclasses.dataclass
class SnippetsGroup:
    # Content of the markdown file before the snippets
    # Up to the first other snippet(excluding) or header(including)
    context: str
    raw_content: str
    snippets: list[Snippet]
    path: Optional[str] = None


def extract_snippets(markdown_content: str) -> list[SnippetsGroup]:
    """
    Extracts snippets from the markdown content.

    Snippet group is a sequence of code blocks, not separated by other text.
    Whitespace-only lines between snippets are allowed.
    """
    # Pattern to match code blocks with their language and content
    pattern = r'```(\w+)\n(.*?)\n```'
    matches = list(re.finditer(pattern, markdown_content, re.DOTALL))
    
    if not matches:
        return []
    
    # Pattern to match headers
    header_pattern = r'^#{1,6}\s+.*$'
    
    groups = []
    current_group = []
    current_raw_content = ""
    
    for i, match in enumerate(matches):
        if not current_group:
            # Start a new group
            current_group = [match]
            current_raw_content = match.group(0)
            
            # Find the context for this group
            # Look for the previous header or snippet
            start_pos = 0
            if i > 0:
                start_pos = matches[i - 1].end()
            
            # Find the last header before this snippet
            context_start = start_pos
            for header_match in re.finditer(header_pattern, markdown_content[start_pos:match.start()], re.MULTILINE):
                context_start = start_pos + header_match.start()
            
            context = markdown_content[context_start:match.start()]
        else:
            # Check if there's only whitespace between this match and the previous one
            last_match = matches[i - 1]
            between_content = markdown_content[last_match.end():match.start()]
            
            # Check if the content between matches contains only whitespace
            if re.match(r'^\s*$', between_content):
                current_raw_content += between_content + match.group(0)
                current_group.append(match)
            else:
                # There's non-whitespace content between matches, finalize current group
                groups.append(SnippetsGroup(
                    context=context,
                    raw_content=current_raw_content,
                    snippets=[Snippet(language=m.group(1), content=m.group(2)) for m in current_group]
                ))
                # Start a new group
                current_group = [match]
                current_raw_content = match.group(0)
                
                # Find the context for the new group
                # Look for the previous header or snippet
                start_pos = matches[i - 1].end()
                
                # Find the last header before this snippet
                context_start = start_pos
                for header_match in re.finditer(header_pattern, markdown_content[start_pos:match.start()], re.MULTILINE):
                    context_start = start_pos + header_match.start()
                
                context = markdown_content[context_start:match.start()]
    
    # Add the last group if it exists
    if current_group:
        groups.append(SnippetsGroup(
            context=context,
            raw_content=current_raw_content,
            snippets=[Snippet(language=m.group(1), content=m.group(2)) for m in current_group]
        ))
    
    return groups


def get_existing_categories() -> list[str]:
    """
    Returns a list of existing categories. List them from the root folder.
    """
    categories = []
    for file in os.listdir(SNIPPETS_ROOT):
        if os.path.isdir(os.path.join(SNIPPETS_ROOT, file)):
            categories.append(file)

    categories.sort()
    return categories


def get_existing_sub_categories(category: str) -> list[str]:
    """
    Returns a list of existing sub-categories for a given category.
    """
    sub_categories = os.listdir(os.path.join(SNIPPETS_ROOT, category))
    sub_categories.sort()
    return sub_categories


def save_snippets(snippets: list[SnippetsGroup]):
    """
    For each snippet:
    - Show first snippet content
    - Show all categories which are already created
    - Skip if category is not provided
    - Ask user to select one of the categories or create a new one
    - Create a new folder for the category if it doesn't exist
    - Ask a sub-category
    - Create a new folder for the sub-category if it doesn't exist
    - Save the snippets into the folder
    """

    for group in snippets:
        print("----------------------------")
        print(group.context)
        print("")
        print(group.snippets[0].content)
        print("----------------------------")

        existing_categories = get_existing_categories()

        print("Existing categories:")
        for i, category in enumerate(existing_categories):
            print(f"{i}. {category}")

        category = input("Enter category: ")\
        
        if category == "":
            print("Skipping snippet")
            continue

        if category not in existing_categories:
            os.makedirs(os.path.join(SNIPPETS_ROOT, category), exist_ok=True)

        existing_sub_categories = get_existing_sub_categories(category)

        print("Existing sub-categories:")
        for i, sub_category in enumerate(existing_sub_categories):
            print(f"{i}. {sub_category}")

        sub_category = input("Enter sub-category: ")
        if sub_category == "":
            print("Skipping snippet")
            continue

        sub_category_path = os.path.join(SNIPPETS_ROOT, category, sub_category)

        group.path = os.path.join(SNIPPERS_MD_ROOT, category, sub_category) + "/"

        if sub_category not in existing_sub_categories:
            os.makedirs(sub_category_path, exist_ok=True)
        else:
            overwrite = input(f"Sub-category '{sub_category}' already exists. Do you want to overwrite? (y/N): ")
            if overwrite.lower() != 'y':
                print("Skipping snippet") 
                continue

        for snippet in group.snippets:
            with open(os.path.join(sub_category_path, f"{snippet.language}.md"), "w") as f:
                # Save snippet in markdown format
                f.write(f"```{snippet.language}\n")
                f.write(snippet.content)
                f.write("\n```\n")
        
        # Save context into `_index.md` file
        with open(os.path.join(sub_category_path, "_index.md"), "w") as f:
            f.write(group.context)

    
    return snippets


def replace_snippets(markdown_content: str, snippets: list[SnippetsGroup]):
    """
    Replaces snippets in the markdown content with the links to the new files.
    """
    for group in snippets:
        if group.path is None:
            continue
        markdown_content = markdown_content.replace(group.raw_content, '{{< code-snippet path="'  + group.path + '" >}}')
    return markdown_content


def main():
    parser = argparse.ArgumentParser(description='Extract code snippets from markdown file.')
    parser.add_argument('input_file', help='Path to the input markdown file')
    parser.add_argument('--output', '-o', help='Path to the output file (default: input_file.tmp)')
    args = parser.parse_args()

    input_file = args.input_file
    output_file = args.output or f"{input_file}.tmp"

    with open(input_file, "r") as f:
        content = f.read()

    snippets = extract_snippets(content)
    snippets = save_snippets(snippets)

    replaced_content = replace_snippets(content, snippets)

    with open(output_file, "w") as f:
        f.write(replaced_content)


if __name__ == "__main__":
    main()