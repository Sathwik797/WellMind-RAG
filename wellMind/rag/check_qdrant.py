from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

collection = "nwis_knowledge"

results = client.scroll(
    collection_name=collection,
    limit=100,
    with_payload=True
)

sources = {}

for point in results[0]:
    source = point.payload.get("source", "UNKNOWN")
    sources[source] = sources.get(source, 0) + 1

print("\nDocuments in Qdrant:\n")

for source, count in sources.items():
    print(f"{source}: {count} chunks")

print(f"\nTotal chunks: {sum(sources.values())}")

from qdrant_store import client, QDRANT_COLLECTION

# 1. How many points total are stored
info = client.get_collection(QDRANT_COLLECTION)
print(f"Total points in collection: {info.points_count}")

# 2. List distinct sources (filenames) and how many chunks each has
results, _ = client.scroll(
    collection_name=QDRANT_COLLECTION,
    limit=1000,  # increase if you have more chunks
    with_payload=True,
    with_vectors=False
)

from collections import Counter
sources = Counter(point.payload.get("source") for point in results)

print("\nFiles stored in Qdrant:")
for source, count in sources.items():
    print(f"  {source}: {count} chunks")
