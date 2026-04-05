"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";

export default function DocxReader({ bookUrl, bookTitle, bookId, user }) {
  const [htmlContent, setHtmlContent] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadDocx() {
      try {
        const mammoth = (await import("mammoth")).default;
        const response = await fetch(bookUrl);
        const buffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setHtmlContent(result.value);
      } catch (err) {
        console.error("DOCX load error:", err);
        setHtmlContent("<p>Failed to load document.</p>");
      }
      setLoadingDoc(false);
    }
    loadDocx();
  }, [bookUrl]);

  const handleTextSelect = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (text && text.length > 0) {
      setSelectedText(text);
      setIsSidebarOpen(true);
      setExplanation("");
      setError("");
      setSaveSuccess(false);
    }
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    setExplanation("");
    setError("");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: selectedText, context: selectedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch explanation.");
      setExplanation(data.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSaveCard = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("flashcards").insert([
      { user_id: user.id, book_id: bookId, word: selectedText, context: selectedText, explanation }
    ]);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert("Error: " + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* AI Sidebar */}
      {isSidebarOpen && (
        <div className="sidebar" style={{ padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="heading">Lexora</h2>
            <button className="btn btn-secondary" onClick={() => setIsSidebarOpen(false)}>Close</button>
          </div>
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Selected Text</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--accent)' }}>{selectedText}</div>
          </div>
          {!explanation && !isExplaining && !error && (
            <button className="btn" style={{ width: '100%', padding: '14px' }} onClick={handleExplain}>
              ✨ Explain with AI
            </button>
          )}
          {isExplaining && (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--accent)' }}>
              <em>Analyzing...</em>
            </div>
          )}
          {error && (
            <div className="glass-panel" style={{ padding: '16px', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <strong>Error:</strong> {error}
            </div>
          )}
          {explanation && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="glass-panel" style={{ padding: '16px', flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                <div style={{ lineHeight: '1.6' }}><ReactMarkdown>{explanation}</ReactMarkdown></div>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '14px', background: saveSuccess ? '#10b981' : 'transparent', color: saveSuccess ? 'white' : 'var(--text)' }} 
                onClick={handleSaveCard}
                disabled={isSaving || saveSuccess}
              >
                {isSaving ? "Saving..." : saveSuccess ? "✓ Saved" : "💾 Save to Flashcards"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DOCX Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#faf6f0' }}>
        {loadingDoc ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2a2218' }}>
            Loading document...
          </div>
        ) : (
          <div 
            onMouseUp={handleTextSelect}
            style={{ 
              flex: 1, overflowY: 'auto', padding: '60px 80px', 
              maxWidth: '900px', margin: '0 auto', width: '100%',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '1.05rem', lineHeight: '1.9', color: '#2a2218'
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
}
