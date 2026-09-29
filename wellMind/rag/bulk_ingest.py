import os
import sys
from collections import Counter

# Ensure current dir is in sys.path for direct script execution
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from .ingest import ingest_pdf
    from .qdrant_store import client, QDRANT_COLLECTION, create_collection
except ImportError:
    from ingest import ingest_pdf
    from qdrant_store import client, QDRANT_COLLECTION, create_collection

# PART 11 FIX: Relative knowledge repository path
KNOWLEDGE_REPO = os.path.abspath(os.path.join(current_dir, "..", "knowledge_repository"))


def get_existing_sources():
    results, _ = client.scroll(
        collection_name=QDRANT_COLLECTION,
        limit=10000,
        with_payload=True,
        with_vectors=False
    )
    return set(point.payload.get("source") for point in results)


def bulk_ingest():
    create_collection()
    existing_sources = get_existing_sources()
    print(f"Already in Qdrant: {len(existing_sources)} files\n")

    pdf_files = [f for f in os.listdir(KNOWLEDGE_REPO) if f.lower().endswith(".pdf")]

    for filename in pdf_files:
        if filename in existing_sources:
            print(f"Skipping (already stored): {filename}")
            continue

        pdf_path = os.path.join(KNOWLEDGE_REPO, filename)
        print(f"\n{'='*60}\nIngesting: {filename}\n{'='*60}")

        try:
            document_id = ingest_pdf(pdf_path)
            print(f"Done. Document ID: {document_id}")
        except Exception as e:
            print(f"FAILED: {filename} — {e}")


if __name__ == "__main__":
    bulk_ingest()