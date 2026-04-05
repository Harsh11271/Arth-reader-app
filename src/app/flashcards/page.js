"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";

export default function FlashcardsPage() {
  const [books, setBooks] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBooksWithCards();
  }, [router]);

  const fetchBooksWithCards = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }

    const { data: cardsData } = await supabase
      .from("flashcards")
      .select("book_id")
      .eq("user_id", user.id);

    const { data: booksData } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (booksData && cardsData) {
      const countMap = {};
      cardsData.forEach(c => {
        countMap[c.book_id] = (countMap[c.book_id] || 0) + 1;
      });

      const booksWithCards = booksData
        .filter(b => countMap[b.id])
        .map(b => ({ ...b, cardCount: countMap[b.id] }));
      
      setBooks(booksWithCards);
    }
    setLoading(false);
  };

  const handleSelectBook = async (book) => {
    setSelectedBook(book);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", book.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFlashcards(data);
    }
    setLoading(false);
  };

  const handleBack = () => {
    setSelectedBook(null);
    setFlashcards([]);
    fetchBooksWithCards();
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm("Delete this flashcard?")) return;
    
    const { error } = await supabase.from("flashcards").delete().eq("id", cardId);
    if (!error) {
      setFlashcards(prev => prev.filter(c => c.id !== cardId));
    } else {
      alert("Delete failed: " + error.message);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <div style={{ flex: 1, overflowY: 'auto', padding: '3rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 className="heading" style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {selectedBook ? selectedBook.title : "Vocabulary Review"}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {selectedBook 
              ? `${flashcards.length} words saved from this book` 
              : "Select a book to review your saved vocabulary."}
          </p>
          {selectedBook && (
            <button 
              className="btn btn-secondary" 
              onClick={handleBack} 
              style={{ marginTop: '16px' }}
            >
              ← Back to Books
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
        ) : !selectedBook ? (
          /* BOOK SELECTION VIEW */
          books.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h2>No flashcards yet!</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                Go read a book and save some words to see them appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
              {books.map((book, index) => (
                <div 
                  key={book.id} 
                  className="glass-panel flashcard"
                  onClick={() => handleSelectBook(book)}
                  style={{ 
                    height: '280px', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    animation: 'flashcardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards', 
                    animationDelay: `${index * 0.08}s`
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📖</div>
                  <h3 className="heading" style={{ color: 'var(--text)', fontSize: '1.2rem' }}>{book.title}</h3>
                  <div style={{ 
                    marginTop: '16px', 
                    background: 'var(--accent)', 
                    padding: '4px 14px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>
                    {book.cardCount} {book.cardCount === 1 ? 'word' : 'words'}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* FLASHCARD VIEW FOR SELECTED BOOK */
          flashcards.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h2>All flashcards deleted!</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                Go back and read more to save new words.
              </p>
            </div>
          ) : (
            <div className="flashcard-grid">
              {flashcards.map((card, index) => (
                <div 
                  key={card.id} 
                  className="glass-panel flashcard"
                  style={{ animation: 'flashcardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards', animationDelay: `${index * 0.08}s`, position: 'relative' }}
                >
                  {/* Delete Flashcard Button */}
                  <button 
                    onClick={() => handleDeleteCard(card.id)}
                    title="Delete flashcard"
                    style={{ 
                      position: 'absolute', top: '12px', right: '12px', 
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', 
                      color: '#f87171', borderRadius: '8px', padding: '5px 9px', 
                      cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s ease'
                    }}
                  >
                    ✕
                  </button>

                  <div className="flashcard-header">
                    <h2 className="flashcard-word">{card.word}</h2>
                  </div>
                  <div className="flashcard-context">
                    <em>"{card.context}"</em>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
                  <div className="flashcard-explanation">
                    <ReactMarkdown>{card.explanation}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
