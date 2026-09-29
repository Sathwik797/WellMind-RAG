import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from .embeddings import generate_embedding

load_dotenv()

from .qdrant_store import client, QDRANT_COLLECTION as COLLECTION_NAME

# model = SentenceTransformer("all-MiniLM-L6-v2")

def retrieve(query, top_k=5, document_id=None):
    # query_vector = model.encode(query).tolist()
    query_vector = generate_embedding(query)
    query_filter = None
    if document_id:
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id)
                )
            ]
        )
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=query_filter,
        limit=top_k,
        with_payload=True
    ).points

    chunks = []

    for result in results:
        payload = result.payload or {}

        chunks.append({
            "score": result.score,
            "source": payload.get("source"),
            "document_id": payload.get("document_id"),
            "page": payload.get("page"),
            "text": payload.get("text")
        })

    return chunks


if __name__ == "__main__":

    query = input("Enter your query: ")
    results = retrieve(query)
    print(f"\nTop {len(results)} relevant chunks:\n")
    for i, result in enumerate(results, 1):
        print("=" * 60)
        print(f"Result {i}")
        print(f"Score: {result['score']:.4f}")
        print(f"Source: {result['source']}")
        print(f"Page: {result['page']}")

        print(f"\n{result['text']}")