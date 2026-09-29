from ingest import ingest_pdf
from generate_answer import generate_answer


pdf_path = input("Enter the full path of the PDF: ")

print("\n" + "=" * 60)
print("UPLOADING PDF")
print("=" * 60)

document_id = ingest_pdf(pdf_path)

print("\nPDF uploaded successfully.")
print(f"Document ID: {document_id}")


while True:

    query = input("\nAsk a question about this PDF (or type 'exit'): ")

    if query.lower() == "exit":
        break

    print("\n" + "=" * 60)
    print("WELLMIND ANSWER")
    print("=" * 60)

    result = generate_answer(
        query=query,
        document_id=document_id
    )

    print(result["answer"])

    print("\n" + "=" * 60)
    print("SOURCES")
    print("=" * 60)

    for source in result["sources"]:
        print(
            f"{source['source']} | "
            f"Page {source['page']} | "
            f"Score: {source['score']:.4f}"
        )