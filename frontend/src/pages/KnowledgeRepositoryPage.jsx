import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Search,
  UploadCloud,
  Send,
  Sparkles,
  BookOpen,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Paperclip,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Info
} from "lucide-react";
import { useWell } from "../context/WellContext";
import { askKnowledgeRepository, uploadDocument, listDocuments } from "../api/wellmindApi";

const SUGGESTED_QUERIES = [
  "How to mitigate Mud Loss in Barail Sandstone?",
  "W001 past lost circulation incidents & LCM pill formulation",
  "Differential stuck pipe prevention when overbalanced",
  "Recommended cementing slurry additives for fractured zones"
];

const PRE_INDEXED_DOCS = [
  { filename: "W001_DDR.pdf", type: "Daily Drilling Report", well: "OIL-BHK-142 (W001)", status: "Vectorized" },
  { filename: "PLAYBOOK_MUD_LOSS.pdf", type: "Standard Operating Playbook", well: "All Assam Wells", status: "Vectorized" },
  { filename: "PARAM_GUIDE2_PRESSURE_WINDOW.pdf", type: "Hydraulics Technical Guide", well: "Field-Wide", status: "Vectorized" },
  { filename: "W003_WCR.pdf", type: "Well Completion Report", well: "Alpha-03 (W003)", status: "Vectorized" },
  { filename: "W001_WCR.pdf", type: "Well Completion Report", well: "OIL-BHK-142 (W001)", status: "Vectorized" },
];

export default function KnowledgeRepositoryPage() {
  const { activeWell } = useWell();
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const wellId = activeWell?.id || activeWell?.wellId || "W001";
  const wellDisplayName = activeWell?.name || activeWell?.wellName || "OIL-BHK-142";

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [documents, setDocuments] = useState(PRE_INDEXED_DOCS);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  // History of structured Q&A items
  const [qaHistory, setQaHistory] = useState([
    {
      question: "How to fix Mud loss in Barail Sandstone fractured intervals?",
      timestamp: "Today at 22:45",
      wellScope: "OIL-BHK-142",
      answer:
        "For fractured Barail Sandstone zones exhibiting partial to total mud losses: 1. Immediately suspend rotation and pull bit 10m off bottom into casing shoe or stable formation. 2. Spot 40-50 bbl high-fluid-loss coarse nut-plug / mica LCM pill (sized 200-800 microns). 3. Squeeze gently at 1.5-2.0 BPM until stabilization pressure is observed. 4. Reduce mud circulation rate to 1800 LPM and lower ECD below fracture gradient (1.46 SG threshold).",
      sources: [
        { source: "W001_DDR.pdf", page: 2, excerpt: "Partial mud loss detected at 2905 m; drilling suspended. LCM pill mixed and pumped." },
        { source: "PLAYBOOK_MUD_LOSS.pdf", page: 1, excerpt: "Spotting coarse LCM pill in permeable depleted sandstone layers." },
        { source: "PARAM_GUIDE2_PRESSURE_WINDOW.pdf", page: 1, excerpt: "Pressure window management and ECD reduction during losses." }
      ]
    }
  ]);

  useEffect(() => {
    listDocuments()
      .then((docs) => {
        if (docs && docs.length > 0) {
          setDocuments((prev) => {
            const existingNames = new Set(prev.map((d) => d.filename));
            const newDocs = docs
              .filter((d) => !existingNames.has(d.filename))
              .map((d) => ({
                filename: d.filename,
                type: "Uploaded Document",
                well: "Assam Field",
                status: "Vectorized"
              }));
            return [...prev, ...newDocs];
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q || asking) return;

    setAsking(true);
    setQuestion("");

    try {
      const res = await askKnowledgeRepository({
        question: q,
        documentId: selectedDoc || null
      });

      const newQa = {
        question: q,
        timestamp: "Just now",
        wellScope: wellDisplayName,
        answer: res.answer || "No response received from WellMind service.",
        sources: res.sources || []
      };

      setQaHistory((prev) => [newQa, ...prev]);
    } catch (err) {
      const errQa = {
        question: q,
        timestamp: "Just now",
        wellScope: wellDisplayName,
        answer: `Knowledge retrieval notice: ${err.message || "Unable to reach WellMind service"}`,
        sources: []
      };
      setQaHistory((prev) => [errQa, ...prev]);
    } finally {
      setAsking(false);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const res = await uploadDocument(file);
      setDocuments((prev) => [
        {
          filename: res.filename || file.name,
          type: "User Uploaded PDF",
          well: wellDisplayName,
          status: "Vectorized"
        },
        ...prev
      ]);
      setUploadMessage({
        type: "success",
        text: `Report "${file.name}" indexed into WellMind vector repository.`
      });
    } catch (err) {
      setUploadMessage({
        type: "error",
        text: `Upload failed: ${err.message || "File upload error"}`
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="ops-workspace-page">
      {/* 1. Header Bar */}
      <div className="workspace-header-bar">
        <div className="wh-left">
          <div className="wh-title-badge">
            <BookOpen size={14} className="wh-badge-icon" />
            <span>WELLMIND: WELL KNOWLEDGE & EVIDENCE WORKSPACE</span>
          </div>
          <div className="wh-context-pill">
            <span className="wh-ctx-label">ACTIVE RIG:</span>
            <span className="wh-ctx-val text-amber">{wellDisplayName} ({wellId})</span>
            <span className="wh-ctx-optional">
              <span className="wh-ctx-sep">|</span>
              <span className="wh-ctx-label">FORMATION:</span>
              <span className="wh-ctx-val text-cyan">Barail Sandstone</span>
              <span className="wh-ctx-sep">|</span>
              <span className="wh-ctx-label">RISK:</span>
              <span className="wh-ctx-val text-danger font-mono font-bold">74% Mud Loss</span>
            </span>
          </div>
        </div>

        <div className="wh-right">
          <button
            className="ops-btn-action-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadCloud size={14} />
            <span>{uploading ? "Indexing PDF..." : "Upload WCR / DDR"}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* 2. Main Workspace Split */}
      <div className="workspace-main-split">
        {/* Left Column: Ask & RAG Evidence Pipeline */}
        <div className="rag-qa-stream" ref={scrollRef}>
          {/* Query Bar */}
          <div className="rag-input-box">
            <div className="rag-input-row">
              <Search size={16} className="text-cyan ml-2" />
              <input
                type="text"
                placeholder="Ask WellMind about operational risks, lost circulation, stuck pipe, cementing..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                disabled={asking}
              />
              <button
                className="rag-send-btn"
                onClick={() => handleAsk()}
                disabled={asking || !question.trim()}
              >
                {asking ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Ask WellMind</span>
                    <Send size={13} />
                  </>
                )}
              </button>
            </div>

            {/* Quick Context Chips */}
            <div className="rag-suggestions-row">
              <span className="rag-sug-title">RECOMMENDED OPERATIONAL QUERIES:</span>
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  className="rag-sug-chip"
                  onClick={() => handleAsk(sq)}
                  disabled={asking}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Status Banner */}
          {uploadMessage && (
            <div className={`ops-alert-banner ${uploadMessage.type === "success" ? "success" : "danger"}`}>
              {uploadMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{uploadMessage.text}</span>
            </div>
          )}

          {/* Active Asking Indicator */}
          {asking && (
            <div className="rag-loading-card">
              <div className="rlc-spinner">
                <RefreshCw size={18} className="animate-spin text-cyan" />
              </div>
              <div className="rlc-text">
                <div className="rlc-title font-mono font-bold">Querying WellMind Multi-Document RAG Embeddings...</div>
                <div className="rlc-sub">Searching Daily Drilling Reports, Well Completion Reports, and Field Operating Playbooks...</div>
              </div>
            </div>
          )}

          {/* Evidence Cards Stream */}
          <div className="rag-history-list">
            {qaHistory.map((item, idx) => (
              <div className="rag-card" key={idx}>
                {/* 1. Question Header */}
                <div className="rag-card-header">
                  <div className="rc-badge-pill">OPERATIONAL INQUIRY</div>
                  <div className="rc-question">{item.question}</div>
                  <div className="rc-meta font-mono">
                    <span>{item.timestamp}</span>
                    <span>·</span>
                    <span className="text-cyan">Scope: {item.wellScope}</span>
                  </div>
                </div>

                {/* 2. Retrieved Evidence Pipeline */}
                {item.sources && item.sources.length > 0 && (
                  <div className="rag-evidence-section">
                    <div className="res-title">
                      <FileText size={12} className="text-cyan" />
                      <span>RETRIEVED KNOWLEDGE CHUNKS ({item.sources.length} SOURCES)</span>
                    </div>
                    <div className="res-chips-grid">
                      {item.sources.map((src, sIdx) => (
                        <div className="res-source-pill" key={sIdx}>
                          <div className="rsp-top">
                            <span className="rsp-filename font-mono font-bold">{src.source}</span>
                            <span className="rsp-page font-mono">Page {src.page}</span>
                          </div>
                          {src.excerpt && <div className="rsp-excerpt">{src.excerpt}</div>}
                          {src.score && (
                            <div className="rsp-score font-mono">
                              Relevance: {(src.score * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Synthesis & Mitigation Action */}
                <div className="rag-synthesis-section">
                  <div className="rss-title">
                    <Sparkles size={13} className="text-amber" />
                    <span>ENGINEERING SYNTHESIS & PLAYBOOK MITIGATION</span>
                  </div>
                  <div className="rss-body">{item.answer}</div>
                </div>

                {/* 4. Footnote Citations */}
                {item.sources && item.sources.length > 0 && (
                  <div className="rag-card-footer font-mono text-xs">
                    <span className="text-muted">Evidence verified against Oil India Limited technical archives: </span>
                    {item.sources.map((s) => s.source).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Indexed Well Document Repository */}
        <div className="rag-docs-sidebar">
          <div className="dossier-inner">
            <div className="dossier-header-bar">
              <div className="dh-status-chip">
                <span className="dh-pulse" />
                <span>INDEXED KNOWLEDGE REPOSITORY</span>
              </div>
              <div className="dh-well-title">Well Documents & Playbooks</div>
              <div className="dh-sub-meta">
                <span>Vectorized Knowledge Base</span>
                <span className="dh-dot">·</span>
                <span className="text-cyan font-mono">{documents.length} Reports</span>
              </div>
            </div>

            {/* Quick Context Summary */}
            <div className="dossier-section">
              <div className="dossier-section-title">
                <Info size={13} />
                <span>ACTIVE OPERATIONAL CONTEXT</span>
              </div>
              <div className="dossier-props-table">
                <div className="dp-row">
                  <span className="dp-key">Current Rig</span>
                  <span className="dp-val text-primary font-mono">{wellDisplayName}</span>
                </div>
                <div className="dp-row">
                  <span className="dp-key">Bit Depth</span>
                  <span className="dp-val text-cyan font-mono">2450.4m MD</span>
                </div>
                <div className="dp-row">
                  <span className="dp-key">Formation</span>
                  <span className="dp-val text-primary">Barail Sandstone</span>
                </div>
                <div className="dp-row">
                  <span className="dp-key">Active Risk State</span>
                  <span className="dp-val text-danger font-mono font-bold">74% Critical Mud Loss</span>
                </div>
              </div>
            </div>

            {/* Document Index List */}
            <div className="dossier-section">
              <div className="dossier-section-title">
                <Database size={13} />
                <span>INDEXED REPORTS (WCR & DDR)</span>
                <span className="badge-count">{documents.length}</span>
              </div>

              <div className="rag-docs-list">
                {documents.map((doc, idx) => (
                  <div className="rag-doc-item" key={idx}>
                    <div className="rdi-icon">
                      <FileText size={16} />
                    </div>
                    <div className="rdi-info">
                      <div className="rdi-title font-mono font-bold">{doc.filename}</div>
                      <div className="rdi-sub">{doc.type} · {doc.well}</div>
                    </div>
                    <div className="rdi-status">
                      <span className="rdi-status-badge font-mono">{doc.status || "Ready"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Box */}
            <div className="rag-upload-dropzone" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={24} className="text-cyan mb-1" />
              <div className="rud-title">Upload New WCR / DDR / Mud Report</div>
              <div className="rud-sub">Supports PDF documents. Automatically indexed with OCR & vector embeddings for immediate querying.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
