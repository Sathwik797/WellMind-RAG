import os
import sys
import unittest

class TestRAGPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.script_dir = os.path.join(os.path.dirname(__file__), "..", "wellMind")
        sys.path.insert(0, cls.script_dir)

    def test_text_processor_chunking(self):
        from rag.text_processor import create_structured_chunks
        text = "Oil India Limited drilling operations in Upper Assam. Barail formation encountered at 2450m MD with minor mud loss. Drillers added mica flakes and LCM pills to restore hydrostatic pressure."
        chunks = create_structured_chunks(text, max_words=20, overlap_sentences=1)
        self.assertTrue(len(chunks) >= 1)
        self.assertIn("Barail", "".join(chunks))

    def test_embeddings_dimension(self):
        from rag.embeddings import generate_embedding
        vec = generate_embedding("stuck pipe prevention in shale")
        self.assertEqual(len(vec), 384, "all-MiniLM-L6-v2 embedding dimension must be 384")

    def test_retrieval_empty_query(self):
        from rag.retrieve import retrieve
        res = retrieve("nonexistent_unique_keyword_xyz_12345", top_k=2)
        self.assertIsInstance(res, list)

if __name__ == "__main__":
    unittest.main()
