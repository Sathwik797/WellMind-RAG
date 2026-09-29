import re
import os


def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', '', text)
    return text.strip()


def split_sentences(text):
    return re.split(r'(?<=[.!?])\s+', text)


def create_structured_chunks(text, max_words=300, overlap_sentences=1):
    """
    Split text into overlapping, sentence-aligned chunks.
    Keeps all content (no keyword filtering) so it works on any PDF.
    """
    text = clean_text(text)
    sentences = split_sentences(text)

    chunks = []
    current = []
    current_len = 0

    for sentence in sentences:
        word_count = len(sentence.split())

        if current_len + word_count > max_words and current:
            chunks.append(" ".join(current))
            current = current[-overlap_sentences:]  # carry forward for context
            current_len = sum(len(s.split()) for s in current)

        current.append(sentence)
        current_len += word_count

    if current:
        chunks.append(" ".join(current))

    # drop only empty/noise chunks
    return [c for c in chunks if len(c.strip()) > 20]


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))

    text = """
    Mud losses were observed while drilling through the fractured formation.
    The drilling team reduced the pump rate and monitored mud volume.
    """

    chunks = create_structured_chunks(text)

    for i, chunk in enumerate(chunks, 1):
        print(f"\nChunk {i}")
        print("-" * 50)
        print(chunk)