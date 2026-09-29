import { useEffect, useRef, useState } from "react";
import { askKnowledgeRepository, uploadDocument, listDocuments } from "../api/wellmindApi";
import { IconPaperclip, IconSend } from "./Icons";

const SUGGESTIONS = [
  "How to fix Mud loss?",
  "Any stuck pipe incidents nearby?",
  " What are recommended actions for cementing issue?",
];

export default function ChatBot() {
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      label: "NWIS Assistant",
      text: "Ask me anything about uploaded well reports, or upload a WCR/DDR PDF and I'll index it instantly.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("");

  useEffect(() => {
    listDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }

  async function send(question) {
    const q = (question ?? input).trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    scrollToBottom();
    try {
      const res = await askKnowledgeRepository({ question: q, documentId: selectedDoc || null });
      setMessages((m) => [...m, { role: "bot", label: "Answer", text: res.answer, sources: res.sources }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", label: "NWIS Assistant", text: `Couldn't get an answer: ${err.message}` }]);
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessages((m) => [...m, { role: "user", text: `Uploaded: ${file.name}` }]);
    setBusy(true);
    scrollToBottom();
    try {
      const res = await uploadDocument(file);
      setDocuments((prev) => [{ documentId: res.document_id, filename: res.filename }, ...prev]);
      setMessages((m) => [
        ...m,
        { role: "bot", label: "NWIS Assistant", text: `"${res.filename}" indexed and ready — ask questions about it, or select it below to scope your search.` },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", label: "NWIS Assistant", text: `Upload failed: ${err.message}` }]);
    } finally {
      setBusy(false);
      scrollToBottom();
      e.target.value = "";
    }
  }

  return (
    <div className="chat-shell">
      {documents.length > 0 && (
        <div className="doc-suggestions">
          {SUGGESTIONS.map((s) => (
            <span className="doc-chip" key={s} onClick={() => send(s)}>{s}</span>
          ))}
          <span
            className="doc-chip"
            style={{ borderColor: selectedDoc === "" ? "var(--navy)" : undefined, color: selectedDoc === "" ? "var(--navy)" : undefined }}
            onClick={() => setSelectedDoc("")}
          >
            All Documents
          </span>
        </div>
      )}

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div className={`msg ${m.role}`} key={i}>
            {m.label && <div className="qa-label">{m.label}</div>}
            {m.text}
            {m.sources && m.sources.length > 0 && (
              <div className="doc-sources">
                {m.sources.map((s, j) => (
                  <span className="doc-source-chip" key={j}>
                    <b>{s.source}</b> — p.{s.page}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg bot">Thinking…</div>}
      </div>

      <div className="chat-input-row">
        <input type="file" ref={fileInputRef} accept=".pdf" style={{ display: "none" }} onChange={handleFile} />
        <button className="upload-btn" title="Upload WCR/DDR PDF" onClick={() => fileInputRef.current?.click()}>
          <IconPaperclip size={17} />
        </button>
        <input
          type="text"
          placeholder="Ask about mud loss, stuck pipe, casing, cementing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="send-btn" onClick={() => send()} disabled={busy}>
          Send <IconSend size={14} />
        </button>
      </div>
    </div>
  );
}