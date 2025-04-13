"""
This script should generate a description for snippets using OpenAI API.

Given snippet context and snippet code, the script should generate a short description of the snippet.

Description will be later used for semantic search of snippets.



"""

import os
from typing import List, Tuple
from openai import OpenAI


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set")



def describe_snippet(context: str, code: str, category: str) -> str:
    """
    Generate a description for a snippet using OpenAI API.
    """
    response = client.chat.completions.create(model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant that generates descriptions for code snippets. Ignore the format of the code and focus more on semantic meaning of the code. Don't mention HTTP, JSON or Python in the description."},
        {"role": "user", "content": f"Category: {category}\n\nContext: {context}\n\nCode: {code}"},
    ])
    return response.choices[0].message.content  


def read_snippet(dir: str) -> Tuple[str, str]:
    """
    Read a snippet from a file.
    """

    snippet_path_http = os.path.join(dir, "http.md")
    snippet_path_python = os.path.join(dir, "python.md")

    if os.path.exists(snippet_path_http):
        snippet_path = snippet_path_http
    elif os.path.exists(snippet_path_python):
        snippet_path = snippet_path_python
    else:
        raise ValueError(f"Snippet file not found in {dir}")
    
    description_path = os.path.join(dir, "_index.md")

    if not os.path.exists(snippet_path) or not os.path.exists(description_path):
        raise ValueError(f"Snippet or description file not found in {dir}")

    with open(snippet_path, "r") as f:
        snippet = f.read()

    with open(description_path, "r") as f:
        description = f.read()

    return snippet, description


def write_description(dir: str):

    description_path = os.path.join(dir, "_description.md")

    if os.path.exists(description_path):
        print(f"Description already exists in {description_path}")
        return

    snippet, description = read_snippet(dir)

    category = dir.split("/")[-2:]

    description = describe_snippet(snippet, description, category)

    with open(description_path, "w") as f:
        f.write(description)


def get_all_snippets_dirs(root_dir: str) -> List[str]:
    """
    Get all snippets dirs in the root directory.
    
    Find all sub-sub-directories in the root directory.
    
    """

    snippets_dirs = []

    for root, dirs, files in os.walk(root_dir):
        for dir in dirs:
            
            # Check that `_index.md` file exists in the directory
            if not os.path.exists(os.path.join(root, dir, "_index.md")):
                continue

            snippets_dirs.append(os.path.join(root, dir))
    return snippets_dirs




def main():
    """
    Main function to run the script.
    """

    root_dir = "qdrant-landing/content/documentation/headless/snippets/"

    snippets_dirs = get_all_snippets_dirs(root_dir)

    for snippet_dir in snippets_dirs:
        print(snippet_dir)
        write_description(snippet_dir)



if __name__ == "__main__":
    main()
