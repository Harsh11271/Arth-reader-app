"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const THEMES = [
  { id: "paperback", name: "Paperback", bg: "#faf6f0", text: "#2a2218" },
  { id: "ancient", name: "Ancient Scroll", bg: "#f5e6ce", text: "#2a1e0e" },
  { id: "modern", name: "Modern White", bg: "#ffffff", text: "#1a1a1a" },
  { id: "night", name: "Night Mode", bg: "#1e1e2a", text: "#e0e0e6" },
];

const BORDERS = [
  { id: "none", name: "None", icon: "▢" },
  { id: "classic", name: "Classic Gold", icon: "✦" },
  { id: "vintage", name: "Vintage Leather", icon: "❧" },
  { id: "gothic", name: "Gothic", icon: "⚜" },
  { id: "royal", name: "Royal Crown", icon: "♛" },
];

export default function PdfReader({ bookUrl, bookTitle, bookId, user }) {
  const canvasLeftRef = useRef(null);
  const canvasRightRef = useRef(null);
  const pdfDocRef = useRef(null);
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [goToPageInput, setGoToPageInput] = useState("");
  const [currentTheme, setCurrentTheme] = useState("paperback");
  const [currentBorder, setCurrentBorder] = useState("classic");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);

  // AI Sidebar state
  const [selectedText, setSelectedText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const getTheme = () => THEMES.find(t => t.id === currentTheme) || THEMES[0];

  useEffect(() => {
    let cancelled = false;
    
    async function loadPdf() {
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const response = await fetch(bookUrl);
      const buffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      
      if (!cancelled) {
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      }
    }

    loadPdf().catch(err => console.error("PDF load error:", err));
    return () => { cancelled = true; };
  }, [bookUrl]);

  const renderPage = useCallback(async (pageNum, canvasRef) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    if (pageNum < 1 || pageNum > pdfDocRef.current.numPages) return;
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      
      // Scale to fit the container
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(
        (container.clientWidth) / unscaledViewport.width,
        (container.clientHeight) / unscaledViewport.height
      );
      const viewport = page.getViewport({ scale: scale * 0.95 });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.warn("Render error page", pageNum, err);
    }
  }, []);

  useEffect(() => {
    if (totalPages > 0) {
      renderPage(currentPage, canvasLeftRef);
      if (currentPage + 1 <= totalPages) {
        renderPage(currentPage + 1, canvasRightRef);
      } else if (canvasRightRef.current) {
        const ctx = canvasRightRef.current.getContext("2d");
        canvasRightRef.current.width = canvasRightRef.current.width; // clear
      }
    }
  }, [currentPage, totalPages, renderPage]);

  const nextPage = () => {
    if (currentPage + 2 <= totalPages) setCurrentPage(p => p + 2);
    else if (currentPage < totalPages) setCurrentPage(totalPages);
  };
  const prevPage = () => {
    if (currentPage - 2 >= 1) setCurrentPage(p => p - 2);
    else setCurrentPage(1);
  };
  const goToPage = () => {
    const page = parseInt(goToPageInput);
    if (page >= 1 && page <= totalPages) {
      // Make sure we land on an odd page for the spread
      setCurrentPage(page % 2 === 1 ? page : page - 1);
    }
    setGoToPageInput("");
  };

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
      if (!res.ok) throw new Error(data.error || "Failed");
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

  const theme = getTheme();

  return (
    <div className={`border-${currentBorder}`} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
            <button className="btn" style={{ width: '100%', padding: '14px' }} onClick={handleExplain}>✨ Explain with AI</button>
          )}
          {isExplaining && (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--accent)' }}><em>Analyzing...</em></div>
          )}
          {error && (
            <div className="glass-panel" style={{ padding: '16px', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}><strong>Error:</strong> {error}</div>
          )}
          {explanation && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="glass-panel" style={{ padding: '16px', flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                <div style={{ lineHeight: '1.6' }}><ReactMarkdown>{explanation}</ReactMarkdown></div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', padding: '14px', background: saveSuccess ? '#10b981' : 'transparent', color: saveSuccess ? 'white' : 'var(--text)' }} onClick={handleSaveCard} disabled={isSaving || saveSuccess}>
                {isSaving ? "Saving..." : saveSuccess ? "✓ Saved" : "💾 Save to Flashcards"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* PDF Book View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header bar - same as EPUB */}
        <div style={{ 
          padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 20
        }}>
          <div className="book-title heading" style={{ fontSize: '1rem', color: '#e0e0e6' }}>{bookTitle}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Theme Selector */}
            <div className="theme-selector">
              <button 
                style={{ background: '#2d2d44', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => { setShowThemeMenu(!showThemeMenu); setShowBorderMenu(false); }}
              >🎨 Theme</button>
              {showThemeMenu && (
                <div className="theme-dropdown glass-panel">
                  {THEMES.map(t => (
                    <button key={t.id} className="theme-option" onClick={() => { setCurrentTheme(t.id); setShowThemeMenu(false); }}
                      style={{ fontWeight: currentTheme === t.id ? '600' : '400' }}>
                      <span className="theme-swatch" style={{ background: t.bg }}></span>
                      {t.name}{currentTheme === t.id && " ✓"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Border Selector */}
            <div className="theme-selector">
              <button 
                style={{ background: '#2d2d44', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => { setShowBorderMenu(!showBorderMenu); setShowThemeMenu(false); }}
              >📐 Border</button>
              {showBorderMenu && (
                <div className="theme-dropdown glass-panel">
                  {BORDERS.map(b => (
                    <button key={b.id} className="theme-option" onClick={() => { setCurrentBorder(b.id); setShowBorderMenu(false); }}
                      style={{ fontWeight: currentBorder === b.id ? '600' : '400' }}>
                      <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{b.icon}</span>
                      {b.name}{currentBorder === b.id && " ✓"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
              onClick={() => router.push("/dashboard")}
            >✕ Close</button>
          </div>
        </div>

        {/* Book Spread */}
        <div className="book-wrapper" style={{ flex: 1 }}>
          <div className="book-spread" style={{ overflow: 'hidden', background: theme.bg }} onMouseUp={handleTextSelect}>
            {/* Left Page */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              <canvas ref={canvasLeftRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            </div>

            {/* Spine shadow */}
            <div style={{ 
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', 
              width: '3px', height: '100%', 
              background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.03), rgba(0,0,0,0.15))',
              zIndex: 5, pointerEvents: 'none' 
            }}></div>

            {/* Right Page */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {currentPage + 1 <= totalPages ? (
                <canvas ref={canvasRightRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <div style={{ color: theme.text, opacity: 0.3, fontSize: '1.2rem' }}>End</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation with Page Input */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '10px 20px', background: '#1a1a2e' }}>
          <button className="btn btn-secondary" onClick={prevPage} disabled={currentPage <= 1} style={{ padding: '8px 20px', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>← Prev</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Page</span>
            <input
              type="number"
              value={goToPageInput}
              onChange={(e) => setGoToPageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goToPage(); }}
              placeholder={`${currentPage}-${Math.min(currentPage + 1, totalPages)}`}
              style={{
                width: '65px', padding: '6px 8px', borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)', background: '#2d2d44',
                color: '#fff', fontSize: '0.9rem', textAlign: 'center', outline: 'none'
              }}
            />
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>of {totalPages || '...'}</span>
          </div>
          
          <button className="btn btn-secondary" onClick={nextPage} disabled={currentPage >= totalPages} style={{ padding: '8px 20px', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>Next →</button>
        </div>
      </div>
    </div>
  );
}
