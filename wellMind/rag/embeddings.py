# from sentence_transformers import SentenceTransformer


# # Lightweight embedding model suitable for the NWIS RAG system.
# # It produces 384-dimensional vectors, matching our Qdrant collection.
# MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# # Load the model once when the module starts.
# # Loading it once is important because repeatedly loading the model
# # would make the RAG system unnecessarily slow.
# model = SentenceTransformer(MODEL_NAME)


# def generate_embedding(text: str) -> list[float]:
#     """
#     Convert text into a 384-dimensional embedding vector.
#     """

#     if not text or not text.strip():
#         raise ValueError("Cannot generate an embedding for empty text.")

#     embedding = model.encode(
#         text,
#         normalize_embeddings=True
#     )

#     return embedding.tolist()


# if __name__ == "__main__":
#     sample_text = (
#         "Mud losses were observed while drilling through a fractured formation."
#     )

#     vector = generate_embedding(sample_text)

#     print("Embedding model loaded successfully.")
#     print(f"Vector dimension: {len(vector)}")
#     print(f"First 5 values: {vector[:5]}")

from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

_model = None


def get_model():
    """Load the model only when first needed, not at import time."""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def generate_embedding(text: str) -> list[float]:
    """
    Convert text into a 384-dimensional embedding vector.
    """
    if not text or not text.strip():
        raise ValueError("Cannot generate an embedding for empty text.")

    model = get_model()
    embedding = model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()


if __name__ == "__main__":
    sample_text = (
        "Mud losses were observed while drilling through a fractured formation."
    )

    vector = generate_embedding(sample_text)

    print("Embedding model loaded successfully.")
    print(f"Vector dimension: {len(vector)}")
    print(f"First 5 values: {vector[:5]}")