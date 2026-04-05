"use client";

import { useState, useEffect, useRef } from "react";
import ePub from "epubjs";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import PdfReader from "@/components/PdfReader";
import DocxReader from "@/components/DocxReader";
import { useParams, useRouter } from "next/navigation";

function getFileType(url) {
  if (!url) return "epub";
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "pdf";
  if (lower.includes(".docx") || lower.includes(".doc")) return "docx";
  return "epub";
}

const THEMES = [
  { id: "paperback", name: "Paperback", swatch: "#faf6f0", textColor: "#2a2218" },
  { id: "ancient", name: "Ancient Scroll", swatch: "#f5e6ce", textColor: "#2a1e0e" },
  { id: "modern", name: "Modern White", swatch: "#ffffff", textColor: "#1a1a1a" },
  { id: "night", name: "Night Mode", swatch: "#1e1e2a", textColor: "#e0e0e6" },
];

const BORDERS = [
  { id: "none", name: "None", icon: "▢" },
  { id: "classic", name: "Classic Gold", icon: "✦" },
  { id: "vintage", name: "Vintage Leather", icon: "❧" },
  { id: "gothic", name: "Gothic", icon: "⚜" },
  { id: "royal", name: "Royal Crown", icon: "♛" },
];

export default function ReaderPage() {
  const { bookId } = useParams();
  const router = useRouter();
  
  const [bookUrl, setBookUrl] = useState(null);
  const [bookTitle, setBookTitle] = useState("Loading...");
  const [user, setUser] = useState(null);
  const [fileType, setFileType] = useState("epub");
  
  const [currentTheme, setCurrentTheme] = useState("paperback");
  const [currentBorder, setCurrentBorder] = useState("classic");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null);
  
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  
  // AI Sidebar states
  const [selectedText, setSelectedText] = useState("");
  const [surroundingSentence, setSurroundingSentence] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // AI Fetching states
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState("");

  // Storage & Summary states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSummaryPrompt, setShowSummaryPrompt] = useState(false);
  const [chapterText, setChapterText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chapterSummary, setChapterSummary] = useState("");

  // Page tracking
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [goToPageInput, setGoToPageInput] = useState("");

  useEffect(() => {
    async function loadBook() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();
        
      if (data) {
        setBookUrl(data.file_url);
        setBookTitle(data.title);
        setFileType(getFileType(data.file_url));
      } else {
        alert("Could not load book.");
        router.push("/dashboard");
      }
    }
    loadBook();
  }, [bookId]);

  useEffect(() => {
    if (bookUrl && viewerRef.current) {
      if (bookRef.current) {
        bookRef.current.destroy();
      }

      fetch(bookUrl)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const book = ePub(buffer);
          bookRef.current = book;
      
          const rendition = book.renderTo(viewerRef.current, {
            width: "100%",
            height: "100%",
            spread: "always",
            flow: "paginated",
          });
          renditionRef.current = rendition;

          rendition.display();

          // Generate locations for page numbers (every 1024 chars = ~1 page)
          book.ready.then(() => {
            return book.locations.generate(1024);
          }).then(() => {
            setTotalPages(book.locations.total);
          });

          // Apply initial theme
          applyThemeToRendition(rendition, currentTheme);

          rendition.on("selected", (cfiRange, contents) => {
            book.getRange(cfiRange).then((range) => {
              const text = range.toString().trim();
              if (!text) return;

              setSelectedText(text);
              setIsSidebarOpen(true);
              setExplanation("");
              setError("");
              setSaveSuccess(false);
              
              const node = range.startContainer;
              const paragraph = node.parentNode ? node.parentNode.textContent : text;
              setSurroundingSentence(paragraph.trim());
              
              contents.window.getSelection().removeAllRanges();
            });
          });

          rendition.on("relocated", (location) => {
            // Update current page from locations
            if (book.locations && location.start) {
              const page = book.locations.locationFromCfi(location.start.cfi);
              setCurrentPage(page + 1);
            }

            if (location.atEnd) {
              try {
                const item = book.spine.get(location.start.href);
                if (item) {
                  item.load(book.load.bind(book)).then((doc) => {
                    if(doc) {
                      setChapterText(doc.textContent || "Could not extract chapter text.");
                      setShowSummaryPrompt(true);
                    }
                  });
                }
              } catch(err) { console.error(err) }
            } else {
              setShowSummaryPrompt(false);
              setChapterSummary("");
            }
          });
        })
        .catch(err => console.error("Failed to load EPUB:", err));

      return () => {
        if (bookRef.current) bookRef.current.destroy();
      };
    }
  }, [bookUrl]);

  // Apply theme to epub.js rendition
  const applyThemeToRendition = (rendition, themeId) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!rendition || !theme) return;
    
    rendition.themes.register("custom", { 
      body: { 
        background: "transparent !important", 
        color: `${theme.textColor} !important`,
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "line-height": "1.8 !important",
        "padding": "0 16px !important"
      } 
    });
    rendition.themes.select("custom");
  };

  // Handle theme change
  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    setShowThemeMenu(false);
    setShowBorderMenu(false);
    if (renditionRef.current) {
      applyThemeToRendition(renditionRef.current, themeId);
    }
  };

  const handleBorderChange = (borderId) => {
    setCurrentBorder(borderId);
    setShowBorderMenu(false);
    setShowThemeMenu(false);
  };

  // Page flip with realistic animation
  const nextPage = () => {
    if (!renditionRef.current || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('next');
    setTimeout(() => {
      renditionRef.current.next();
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDirection(null);
      }, 100);
    }, 500);
  };

  const prevPage = () => {
    if (!renditionRef.current || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    setTimeout(() => {
      renditionRef.current.prev();
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDirection(null);
      }, 100);
    }, 500);
  };

  // Get current theme's page color for the flip overlay
  const getPageColor = () => {
    const colors = {
      paperback: '#faf6f0',
      ancient: '#f5e6ce',
      modern: '#ffffff',
      night: '#1e1e2a',
    };
    return colors[currentTheme] || '#faf6f0';
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    setExplanation("");
    setError("");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: selectedText, context: surroundingSentence }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch explanation.");
      }
      setExplanation(data.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSaveCard = async () => {
    setIsSaving(true);
    if (!user) return;
    
    const { error } = await supabase.from("flashcards").insert([
      { 
        user_id: user.id,
        book_id: bookId,
        word: selectedText, 
        context: surroundingSentence, 
        explanation 
      }
    ]);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      console.error("Save Error:", error);
      alert(`Supabase Error: ${error.message}`);
    }
    setIsSaving(false);
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chapterText }),
      });
      const data = await res.json();
      if(res.ok) setChapterSummary(data.summary);
    } catch (err) {
      console.error(err);
    }
    setIsSummarizing(false);
  };

  if (!bookUrl) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
        <Navigation />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
          Loading from cloud...
        </div>
      </div>
    );
  }

  // PDF Reader
  if (fileType === "pdf") {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
        <Navigation />
        <PdfReader bookUrl={bookUrl} bookTitle={bookTitle} bookId={bookId} user={user} />
      </div>
    );
  }

  // DOCX Reader
  if (fileType === "docx") {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
        <Navigation />
        <DocxReader bookUrl={bookUrl} bookTitle={bookTitle} bookId={bookId} user={user} />
      </div>
    );
  }

  // EPUB Reader (default)
  return (
    <div className={`app-container theme-${currentTheme} border-${currentBorder}`} style={{ display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* AI Sidebar */}
        {isSidebarOpen && (
          <div className="sidebar" style={{ padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="heading">Lexora</h2>
              <button className="btn btn-secondary" onClick={() => setIsSidebarOpen(false)}>Close</button>
            </div>
            
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Selected Phrase</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '500', color: 'var(--accent)' }}>{selectedText}</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Surrounding Context</div>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.5', fontStyle: 'italic' }}>"{surroundingSentence}"</div>
            </div>

            {!explanation && !isExplaining && !error && (
              <button className="btn" style={{ width: '100%', padding: '14px' }} onClick={handleExplain}>
                ✨ Explain with full context
              </button>
            )}

            {isExplaining && (
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--accent)' }}>
                <em>Analyzing context...</em>
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
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>Lexora Explanation</div>
                  <div style={{ lineHeight: '1.6', fontSize: '1rem' }}>
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '14px', background: saveSuccess ? '#10b981' : 'transparent', color: saveSuccess ? 'white' : 'var(--text)' }} 
                  onClick={handleSaveCard}
                  disabled={isSaving || saveSuccess}
                >
                  {isSaving ? "Saving..." : saveSuccess ? "✓ Saved to Flashcards" : "💾 Save to Flashcards"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Reader Area */}
        <div className="reader-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
          {/* Header with Theme Selector - dark bar always visible */}
          <div style={{ 
            padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 20
          }}>
            <div className="book-title heading" style={{ fontSize: '1rem', color: '#e0e0e6' }}>{bookTitle}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Theme Selector */}
              <div className="theme-selector">
                <button 
                  style={{ background: '#2d2d44', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => { setShowThemeMenu(!showThemeMenu); setShowBorderMenu(false); }}
                >
                  🎨 Theme
                </button>
                {showThemeMenu && (
                  <div className="theme-dropdown glass-panel">
                    {THEMES.map(theme => (
                      <button 
                        key={theme.id} 
                        className="theme-option" 
                        onClick={() => handleThemeChange(theme.id)}
                        style={{ fontWeight: currentTheme === theme.id ? '600' : '400' }}
                      >
                        <span className="theme-swatch" style={{ background: theme.swatch }}></span>
                        {theme.name}
                        {currentTheme === theme.id && " ✓"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Border Selector */}
              <div className="theme-selector">
                <button 
                  style={{ background: '#2d2d44', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => { setShowBorderMenu(!showBorderMenu); setShowThemeMenu(false); }}
                >
                  📐 Border
                </button>
                {showBorderMenu && (
                  <div className="theme-dropdown glass-panel">
                    {BORDERS.map(border => (
                      <button 
                        key={border.id} 
                        className="theme-option" 
                        onClick={() => handleBorderChange(border.id)}
                        style={{ fontWeight: currentBorder === border.id ? '600' : '400' }}
                      >
                        <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{border.icon}</span>
                        {border.name}
                        {currentBorder === border.id && " ✓"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
                onClick={() => router.push("/dashboard")}
              >
                ✕ Close
              </button>
            </div>
          </div>
          
          {/* Book Spread */}
          <div className="book-wrapper">
            <div className="book-spread" style={{ overflow: 'hidden' }}>
              {/* Full epub viewer spanning both pages */}
              <div ref={viewerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}></div>

              {/* Spine shadow line in the center */}
              <div style={{ 
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', 
                width: '3px', height: '100%', 
                background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.03), rgba(0,0,0,0.15))',
                zIndex: 5, pointerEvents: 'none' 
              }}></div>

              {/* Narrow edge strips for page turning - only 40px wide so text selection works in the middle */}
              <div onClick={prevPage} style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '100%', cursor: 'w-resize', zIndex: 6 }}></div>
              <div onClick={nextPage} style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '100%', cursor: 'e-resize', zIndex: 6 }}></div>

              {/* Realistic Page Flip Overlay */}
              {isFlipping && flipDirection && (
                <div className={`page-flip-overlay flipping-${flipDirection}`}>
                  <div className="flip-front" style={{ background: getPageColor() }}></div>
                  <div className="flip-back" style={{ background: getPageColor(), filter: 'brightness(0.92)' }}></div>
                </div>
              )}

              {/* Dynamic shadow at the spine during flip */}
              <div className={`page-shadow ${isFlipping ? (flipDirection === 'next' ? 'active-next' : 'active-prev') : ''}`}></div>
            </div>
          </div>

          {/* Navigation Buttons with Page Input */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '10px 20px', background: '#1a1a2e' }}>
            <button className="btn btn-secondary" onClick={prevPage} style={{ padding: '8px 20px', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} disabled={isFlipping}>← Prev</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Page</span>
              <input
                type="number"
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt(goToPageInput);
                    if (page >= 1 && page <= totalPages && bookRef.current?.locations) {
                      const cfi = bookRef.current.locations.cfiFromLocation(page - 1);
                      if (cfi && renditionRef.current) {
                        renditionRef.current.display(cfi);
                      }
                    }
                    setGoToPageInput("");
                  }
                }}
                placeholder={String(currentPage)}
                style={{
                  width: '55px', padding: '6px 8px', borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)', background: '#2d2d44',
                  color: '#fff', fontSize: '0.9rem', textAlign: 'center', outline: 'none'
                }}
              />
              <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>of {totalPages || '...'}</span>
            </div>
            
            <button className="btn btn-secondary" onClick={nextPage} style={{ padding: '8px 20px', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} disabled={isFlipping}>Next →</button>
          </div>

          {/* Smart Summary Popover */}
          {showSummaryPrompt && (
            <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 40, width: '90%', maxWidth: '600px', animation: 'slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <h3 className="heading">End of Chapter Reached!</h3>
                   <button className="btn btn-secondary" onClick={() => setShowSummaryPrompt(false)}>Skip</button>
                </div>
                {!chapterSummary ? (
                  <button className="btn" style={{ width: '100%' }} onClick={handleGenerateSummary} disabled={isSummarizing}>
                    {isSummarizing ? "Analyzing Chapter..." : "✨ Generate Smart Summary"}
                  </button>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto', lineHeight: '1.6' }}>
                    <ReactMarkdown>{chapterSummary}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
