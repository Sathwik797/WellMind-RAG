import os
import uuid
from dotenv import load_dotenv
from qdrant_client.models import PointStruct

from .ocr import extract_text_from_pdf
from .text_processor import create_structured_chunks
from .embeddings import generate_embedding
from .qdrant_store import client, QDRANT_COLLECTION

load_dotenv()

def ingest_pdf(pdf_path, document_id=None, original_filename=None):
    """Extract, chunk, embed, and store a PDF in Qdrant.

    pdf_path: actual location to read the file from (may be a temp path)
    original_filename: the human-readable filename to store in payload
                        (falls back to pdf_path's basename if not given)
    """

    print(f"Processing: {pdf_path}")

    if document_id is None:
        document_id = str(uuid.uuid4())

    source_name = original_filename or os.path.basename(pdf_path)

    pages = extract_text_from_pdf(pdf_path)
    points = []

    for page in pages:
        page_number = page["page"]
        method = page["method"]
        text = page["text"]

        chunks = create_structured_chunks(text)

        for chunk_index, chunk in enumerate(chunks):
            vector = generate_embedding(chunk)

            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "source": source_name,
                        "document_id": document_id,
                        "page": page_number,
                        "chunk": chunk_index,
                        "extraction_method": method,
                        "text": chunk
                    }
                )
            )

    if points:
        client.upsert(
            collection_name=QDRANT_COLLECTION,
            points=points
        )

    print(f"Stored {len(points)} chunks in Qdrant.")

    return document_id