from .base import CompileResult, Language
from .bash import LanguageBash
from .csharp import LanguageCsharp
from .go import LanguageGo
from .java import LanguageJava
from .python import LanguagePython
from .rust import LanguageRust
from .typescript import LanguageTypescript

__all__ = [
    "ALL_LANGUAGES",
    "CompileResult",
    "Language",
    "LanguageBash",
    "LanguageCsharp",
    "LanguageGo",
    "LanguageJava",
    "LanguagePython",
    "LanguageRust",
    "LanguageTypescript",
    "parse_languages",
]

ALL_LANGUAGES: tuple[type[Language], ...] = (
    LanguageBash,
    LanguageCsharp,
    LanguageGo,
    LanguageJava,
    LanguagePython,
    LanguageRust,
    LanguageTypescript,
)


def parse_languages(langs: str) -> list[type[Language]]:
    """Parse comma-separated list of languages into a list of Language classes.

    Accepts either language names or snippet file extensions.
    Example: "python,ts,go" -> [LanguagePython, LanguageTypescript, LanguageGo]
    """
    result: list[type[Language]] = []
    for lang_name in langs.split(","):
        lang_name = lang_name.strip()
        for lang in ALL_LANGUAGES:
            if lang in result:
                continue
            if lang_name in (lang.NAME, lang.SNIPPET_FILENAME.split(".")[1]):
                result.append(lang)
                break
        else:
            msg = f"Unknown language: {lang_name}"
            raise ValueError(msg)
    return result
