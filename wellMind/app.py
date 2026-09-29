import os
import shutil
import uuid
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# from rag.ingest import ingest_pdf
# from rag.generate_answer import generate_answer


app = FastAPI(
    title="WellMind API",
    description="NWIS WellMind document intelligence API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str
    document_id: str | None = None

@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "WellMind",
        "version": "1.0.0"
    }

# @app.post("/upload")
# async def upload_pdf(file: UploadFile = File(...)):

#     if not file.filename:
#         raise HTTPException(
#             status_code=400,
#             detail="No file provided."
#         )
#     if not file.filename.lower().endswith(".pdf"):
#         raise HTTPException(
#             status_code=400,
#             detail="Only PDF files are supported."
#         )
#     document_id = str(uuid.uuid4())
#     temp_file = NamedTemporaryFile(
#         delete=False,
#         suffix=".pdf"
#     )

#     try:
#         with temp_file as f:
#             shutil.copyfileobj(file.file, f)

#         # Pass the ORIGINAL filename so Qdrant stores the real name,
#         # not the temp file's random name (tmpxxxxxx.pdf).
#         ingest_pdf(
#             temp_file.name,
#             document_id=document_id,
#             original_filename=file.filename
#         )

#         return {
#             "message": "PDF uploaded and processed successfully.",
#             "document_id": document_id,
#             "filename": file.filename
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

#     finally:
#         if os.path.exists(temp_file.name):
#             os.remove(temp_file.name)

# @app.post("/ask")
# def ask_question(request: QuestionRequest):

#     if not request.question.strip():
#         raise HTTPException(status_code=400, detail="Question cannot be empty.")
#     try:
#         result = generate_answer(query=request.question, document_id=request.document_id)
#         return {
#             "answer": result["answer"],
#             "sources": result["sources"]
#         }
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to generate answer: {str(e)}"
#         )

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    from rag.ingest import ingest_pdf

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    document_id = str(uuid.uuid4())
    temp_file = NamedTemporaryFile(delete=False, suffix=".pdf")

    try:
        with temp_file as f:
            shutil.copyfileobj(file.file, f)

        ingest_pdf(
            temp_file.name,
            document_id=document_id,
            original_filename=file.filename
        )

        return {
            "message": "PDF uploaded and processed successfully.",
            "document_id": document_id,
            "filename": file.filename
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process PDF: {str(e)}"
        )

    finally:
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)


@app.post("/ask")
def ask_question(request: QuestionRequest):
    from rag.generate_answer import generate_answer

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:
        result = generate_answer(
            query=request.question,
            document_id=request.document_id
        )

        return {
            "answer": result["answer"],
            "sources": result["sources"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate answer: {str(e)}"
        )