import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

from .retrieve import retrieve

load_dotenv()

MODEL = "meta-llama/Llama-3.1-8B-Instruct"

def get_inference_client():
    token = os.getenv("HF_TOKEN")
    if not token or not token.strip():
        return None
    try:
        return InferenceClient(token=token.strip())
    except Exception as e:
        print(f"Warning: Failed to initialize HF InferenceClient: {e}")
        return None


def build_context(results):
    context_parts = []

    for i, result in enumerate(results, 1):
        context_parts.append(
            f"""SOURCE {i}
Document: {result["source"]}
Page: {result["page"]}
Similarity Score: {result["score"]:.4f}

Content:
{result["text"]}
"""
        )

    return "\n".join(context_parts)


def generate_answer(query, document_id=None, top_k=5):

    results = retrieve(
        query,
        top_k=top_k,
        document_id=document_id
    )

    if document_id:
        not_found_msg = (
            "The information was not found in the uploaded document."
        )
        scope = "the uploaded PDF"
    else:
        not_found_msg = (
            "The information was not found in the knowledge repository."
        )
        scope = "the NWIS knowledge repository"

    if not results:
        return {
            "answer": not_found_msg,
            "sources": []
        }

    context = build_context(results)

    prompt = f"""You are WellMind, the document intelligence assistant
for the NWIS drilling system.

Your task is to answer the user's question using ONLY the retrieved
information from {scope}.

IMPORTANT RULES:
1. Use only the retrieved context.
2. Do not use outside knowledge.
3. Do not invent facts, causes, measurements, events, or recommendations.
4. If the retrieved context contains information that answers the question,
   answer the question directly.
5. If only part of the answer is available, provide that part clearly.
6. Only say "{not_found_msg}" when the retrieved context contains
   no useful information for answering the question.
7. Do not say that information is missing if the context actually contains
   relevant information.
8. Combine information from multiple sources when necessary.
9. Mention the document name and page number when relevant.
10. Keep the answer concise and professional.

USER QUESTION:
{query}

RETRIEVED CONTEXT:
{context}

ANSWER:
"""

    client = get_inference_client()

    sources = [
        {
            "source": result["source"],
            "page": result["page"],
            "score": result["score"]
        }
        for result in results
    ]

    if not client:
        # Prompt rule: Do not hide failures. Report clearly when external token is missing.
        preview = "\n\n".join([f"[{r['source']} - Page {r['page']}]: {r['text'][:250]}..." for r in results[:2]])
        return {
            "answer": (
                "[WellMind Notice] HuggingFace API token (HF_TOKEN) is not configured in wellMind/.env.\n\n"
                f"Retrieved {len(results)} relevant knowledge chunks:\n\n{preview}\n\n"
                "To enable Llama 3.1 LLM answer generation, please set HF_TOKEN in wellMind/.env."
            ),
            "sources": sources
        }

    try:
        response = client.chat_completion(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=500,
            temperature=0.1
        )

        answer = response.choices[0].message.content.strip()

    except Exception as e:
        return {
            "answer": f"Failed to generate answer from HuggingFace Llama 3.1: {str(e)}",
            "sources": sources
        }

    if not answer:
        answer = not_found_msg

    sources = [
        {
            "source": result["source"],
            "page": result["page"],
            "score": result["score"]
        }
        for result in results
    ]

    return {
        "answer": answer,
        "sources": sources
    }


if __name__ == "__main__":

    query = input("Enter your query: ")

    result = generate_answer(query)

    print("\n" + "=" * 60)
    print("WELLMIND ANSWER")
    print("=" * 60)

    print(result["answer"])

    print("\n" + "=" * 60)
    print("RETRIEVED SOURCES")
    print("=" * 60)

    for source in result["sources"]:
        print(
            f"{source['source']} | "
            f"Page {source['page']} | "
            f"Score: {source['score']:.4f}"
        )