import csv
import subprocess
import os
import openai
from typing import Iterable
from dataclasses import dataclass


BASE_DIR = os.path.abspath(os.path.dirname(os.path.realpath(__file__)) + "/../qdrant-landing")
OUTPUT_DIR = BASE_DIR + "/static"
GENERAL_DESCRIPTION = (
    "Qdrant is a cutting-edge platform focused on delivering exceptional performance and efficiency in vector "
    "similarity search. As a robust vector database, it specializes in managing, searching, and retrieving "
    "high-dimensional vector data, essential for enhancing AI applications, machine learning, and modern search "
    "engines. With a suite of powerful features such as state-of-the-art hybrid search capabilities, "
    "retrieval-augmented generation (RAG) applications, and dense and sparse vector support, Qdrant stands out as an "
    "industry leader. Its offerings include managed cloud services, enabling users to harness the robust functionality "
    "of Qdrant without the burden of maintaining infrastructure. The platform supports advanced data security measures "
    "and seamless integrations with popular platforms and frameworks, catering to diverse data handling and analytic "
    "needs. Additionally, Qdrant offers comprehensive solutions for complex searching requirements through its "
    "innovative Query API and multivector representations, allowing for precise matching and enhanced retrieval "
    "quality. With its commitment to open-source principles and continuous innovation, Qdrant tailors solutions to "
    "meet both small-scale projects and enterprise-level demands efficiently, helping organizations unlock profound "
    "insights from their unstructured data and optimize their AI capabilities."
)

@dataclass
class HugoContent:
    path: str
    absolute_url: str
    title: str | None
    content: str | None


def sort_key(line: dict) -> int:
    """
    Calculate a score for the hugo content entry based on its path importance.
    The more important the path, the higher the score.
    :param line: A dictionary representing a line from the CSV output of `hugo list published`.
    :return:
    """
    path_boosts = {
        "documentation/concepts": 10,
        "documentation/quickstart": 9,
        "articles": 7,
        "blog": 5,
        "documentation": 3,
    }
    path = line.get("path", "")
    score = sum(boost for key, boost in path_boosts.items() if key in path)
    return score


def load_frontmatter_and_content(raw_content: str) -> (dict, str):
    """
    Load the front matter and content from the raw content string.
    The front matter is expected to be in YAML format and enclosed in `---` at the beginning of the content.
    The content is everything after the front matter.
    :param raw_content:
    :return:
    """
    frontmatter = dict()
    if raw_content.startswith("---"):
        end_index = raw_content.find("---", 3) + 3
        raw_frontmatter = raw_content[:end_index].strip()
        # Parse the front matter as a dictionary
        for line in raw_frontmatter.splitlines()[1:-1]:
            try:
                key, value = line.split(":", 1)
                frontmatter[key.strip()] = value.strip("\"' ")  # Remove quotes and whitespace
            except ValueError:
                # If the line doesn't contain a key-value pair, skip it
                continue
        # Remove the front matter from the content
        content = raw_content[end_index:].strip()
    else:
        content = raw_content.strip()
    return frontmatter, content

def iter_hugo_content() -> Iterable[HugoContent]:
    """
    List the published content in Hugo.
    :return:
    """
    # Run os `huho list published` command and capture the output.
    cmd = ["hugo", "list", "published"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with error: {result.stderr}")

    # Parse the output to extract the paths. Output is expected to be a CSV format
    # with the first line being a header. The first column contains the path.
    csv_reader = csv.DictReader(result.stdout.splitlines())
    lines = list(csv_reader)
    for line in sorted(lines, key=sort_key, reverse=True):
        path = line.get("path")
        if not path:
            continue

        # Load the content of the file at the given path.
        with open(os.path.join(BASE_DIR, path), "r", encoding="utf-8") as file:
            frontmatter, content = load_frontmatter_and_content(file.read())
            if not content:
                continue

        yield HugoContent(
            path=path,
            absolute_url=line.get("permalink"),
            title=frontmatter.get("title"),
            content=content,
        )


def summarize_content(content: str) -> str:
    """
    Generate a summary for the given content using an LLM.
    Use GitHub Models as a provider for the LLM.
    :param content:
    :return:
    """
    # Truncate the content to a maximum of 8192 characters
    content = content[:8192]

    # Call the GitHub Models API to generate a summary
    client = openai.OpenAI(
        api_key=os.environ.get("GITHUB_TOKEN"),
        base_url="https://models.github.ai/inference",
    )
    completions = client.chat.completions.create(
        model="openai/gpt-4o",
        messages=[
            {
                "role": "user",
                "content": (
                    "Please summarize the following content in a concise manner, "
                    "focusing on the main points and key information. The summary should"
                    "not be longer than 2 sentences:\n\n"
                    f"{content}"
                )
            }
        ]
    )
    summary = completions.choices[0].message.content.strip()
    return summary


def main():
    """
    List all the content in Hugo and generate both llms.txt and llms-full.txt files.
    Overwrite existing files if they exist.
    :return:
    """
    # Change the current working directory to the Hugo content directory
    os.chdir(BASE_DIR)

    # Load the paths to all the published content in Hugo and process them sequentially
    # to generate the llms.txt and llms-full.txt files.
    with (open(os.path.join(OUTPUT_DIR, "llms.txt"), "w", encoding="utf-8") as llms_file, \
         open(os.path.join(OUTPUT_DIR, "llms-full.txt"), "w", encoding="utf-8") as llms_full_file):

        # Write the header for the both files
        llms_file.write("# https://qdrant.tech/ llms.txt\n")
        llms_file.write("## Overall Summary\n")
        llms_file.write(f"> {GENERAL_DESCRIPTION}\n\n")
        llms_file.write("## Page Links\n")

        llms_full_file.write("# https://qdrant.tech/ llms-full.txt\n")
        llms_full_file.write("## Overall Summary\n")
        llms_full_file.write(f"> {GENERAL_DESCRIPTION}\n\n")

        for page_counter, content in enumerate(iter_hugo_content(), start=1):
            # Write the content to the full file
            llms_full_file.write(f"<|page-{page_counter}-lllmstxt|>\n")
            llms_full_file.write(content.content + "\n\n")

            # Write the link to the llms.txt file
            if not content.title:
                continue
            content_summary = summarize_content(content.content)
            llms_file.write(f"- [{content.title}]({content.absolute_url}): {content_summary}\n")
            print(f"Processed {content.title} ({content.absolute_url})")


if __name__ == "__main__":
    main()
