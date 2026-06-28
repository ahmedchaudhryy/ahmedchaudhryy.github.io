from datetime import datetime, timezone
import json
import os

from scholarly import scholarly


SCHOLAR_ID = "taGG11wAAAAJ"
EXPECTED_NAME_PARTS = {"ahmed", "chaudhry"}
JSON_PATH = os.path.join("assets", "data", "scholar_stats.json")


def update_scholar_stats():
    """Refresh metrics without overwriting the curated research categories."""
    try:
        author = scholarly.fill(scholarly.search_author_id(SCHOLAR_ID))
        author_name = author.get("name", "")
        normalized_name = set(author_name.lower().split())

        if not EXPECTED_NAME_PARTS.issubset(normalized_name):
            raise RuntimeError(
                f"Scholar profile mismatch: expected Ahmed Chaudhry, received {author_name!r}"
            )

        with open(JSON_PATH, "r", encoding="utf-8") as file:
            stats = json.load(file)

        stats.update(
            {
                "citations": author.get("citedby", 0),
                "h_index": author.get("hindex", 0),
                "publications": len(author.get("publications", [])),
                "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            }
        )

        with open(JSON_PATH, "w", encoding="utf-8") as file:
            json.dump(stats, file, ensure_ascii=False, indent=2)
            file.write("\n")

        print(f"Updated Google Scholar metrics for {author_name}.")

    except Exception as error:
        print(f"Error updating Scholar metrics: {error}")
        raise


if __name__ == "__main__":
    update_scholar_stats()
