import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "nwis_knowledge_repository")

def get_qdrant_client():
    if QDRANT_URL and QDRANT_API_KEY:
        return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    elif QDRANT_URL:
        return QdrantClient(url=QDRANT_URL)
    else:
        # Local development fallback when Qdrant Cloud credentials are not configured
        script_dir = os.path.dirname(os.path.abspath(__file__))
        storage_path = os.path.join(script_dir, "..", "qdrant_storage")
        os.makedirs(storage_path, exist_ok=True)
        return QdrantClient(path=storage_path)

client = get_qdrant_client()
VECTOR_SIZE = 384


def create_collection():
    """Create the NWIS knowledge collection if it does not exist."""

    existing_collections = client.get_collections()

    collection_names = [
        collection.name
        for collection in existing_collections.collections
    ]

    if QDRANT_COLLECTION not in collection_names:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )

        print(f"Collection '{QDRANT_COLLECTION}' created successfully.")

    else:
        print(f"Collection '{QDRANT_COLLECTION}' already exists.")

    client.create_payload_index(
        collection_name=QDRANT_COLLECTION,
        field_name="document_id",
        field_schema=PayloadSchemaType.KEYWORD
    )

    print("document_id index is ready.")


def test_collection():
    """Verify that the collection exists."""

    collection_info = client.get_collection(
        collection_name=QDRANT_COLLECTION
    )

    print("\nCollection verification:")
    print(f"Name: {QDRANT_COLLECTION}")
    print(f"Vectors: {collection_info.config.params.vectors}")


if __name__ == "__main__":
    create_collection()
    test_collection()