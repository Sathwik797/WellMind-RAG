from qdrant_store import client, QDRANT_COLLECTION


def view_chunks():
    records, _ = client.scroll(
        collection_name=QDRANT_COLLECTION,
        limit=100,
        with_payload=True,
        with_vectors=False
    )

    print(f"Total chunks retrieved: {len(records)}")

    for i, record in enumerate(records, start=1):
        payload = record.payload

        print(f"\n{'=' * 60}")
        print(f"Chunk {i}")
        print(f"Source: {payload.get('source')}")
        print(f"Page: {payload.get('page')}")
        print(f"Method: {payload.get('extraction_method')}")
        print(f"\nText:\n{payload.get('text')}")


if __name__ == "__main__":
    view_chunks()