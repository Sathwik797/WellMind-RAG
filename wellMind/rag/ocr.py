import os
import fitz

_ocr_instance = None

def get_ocr():
    global _ocr_instance
    if _ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            _ocr_instance = PaddleOCR(
                lang="en",
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
                enable_mkldnn=False
            )
        except Exception as e:
            print(f"PaddleOCR not available, using PyMuPDF direct parser: {e}")
            _ocr_instance = False
    return _ocr_instance if _ocr_instance is not False else None

def extract_text_from_pdf(pdf_path):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    doc = fitz.open(pdf_path)
    pages_text = []

    for page_number, page in enumerate(doc, start=1):
        text = page.get_text().strip()

        if text:
            pages_text.append({
                "page": page_number,
                "text": text,
                "method": "PyMuPDF"
            })
            continue

        ocr_engine = get_ocr()
        if ocr_engine is not None:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image_path = f"_ocr_page_{page_number}.png"
            pix.save(image_path)

            try:
                result = ocr_engine.predict(image_path)
                page_text = []
                for res in result:
                    if hasattr(res, "json"):
                        data = res.json() if callable(res.json) else res.json
                        if isinstance(data, dict):
                            rec_texts = data.get("rec_texts", [])
                            page_text.extend(rec_texts)

                pages_text.append({
                    "page": page_number,
                    "text": "\n".join(page_text),
                    "method": "PaddleOCR"
                })
            finally:
                if os.path.exists(image_path):
                    os.remove(image_path)
        else:
            pages_text.append({
                "page": page_number,
                "text": "",
                "method": "PyMuPDF"
            })
    doc.close()

    return pages_text


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(script_dir, "sample_img.pdf")
    try:
        pages = extract_text_from_pdf(pdf_path)

        for page in pages:
            print(f"\n--- Page {page['page']} ({page['method']}) ---")
            print(page["text"])

    except Exception as e:
        print(f"Error: {e}")