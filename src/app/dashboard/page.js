"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FILE_ICONS = {
  epub: "📖",
  pdf: "📄",
  docx: "📝",
};

function getFileType(url) {
  if (!url) return "epub";
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "pdf";
  if (lower.includes(".docx") || lower.includes(".doc")) return "docx";
  return "epub";
}

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const { data } = await supabase.from('books').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setBooks(data);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${user.id}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('epubs').upload(fileName, file);
    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('epubs').getPublicUrl(fileName);
    const bookTitle = file.name.replace(/\.(epub|pdf|docx?)$/i, '');
    const { error: dbError } = await supabase.from('books').insert([
      { user_id: user.id, title: bookTitle, file_url: urlData.publicUrl }
    ]).select();
    if (!dbError) {
      alert("Uploaded: " + bookTitle);
      fetchBooks();
    } else {
      alert("DB Error: " + dbError.message);
    }
    setUploading(false);
  };

  const handleDeleteBook = async (e, book) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${book.title}"?\nThis will also remove all saved flashcards for this book.`)) return;

    // Delete flashcards first
    await supabase.from("flashcards").delete().eq("book_id", book.id);
    // Delete the book record
    const { error } = await supabase.from("books").delete().eq("id", book.id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    // Try to remove storage file
    try {
      const url = new URL(book.file_url);
      const parts = url.pathname.split("/storage/v1/object/public/epubs/");
      if (parts[1]) {
        await supabase.storage.from("epubs").remove([decodeURIComponent(parts[1])]);
      }
    } catch (err) {
      console.warn("Storage cleanup failed:", err);
    }
    setBooks(prev => prev.filter(b => b.id !== book.id));
  };

  if (loading) return <div className="app-container"><Navigation /><div style={{padding: '2rem'}}>Loading library...</div></div>;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <Navigation />
      <main style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 className="heading" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>My Library</h1>
            <p style={{ color: 'var(--text-muted)' }}>Upload EPUBs, PDFs, or Word documents to read.</p>
          </div>
          <label className="btn" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
            {uploading ? "Uploading..." : "+ Upload File"}
            <input type="file" accept=".epub,.pdf,.docx,.doc" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>

        {books.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2 className="heading" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your library is empty</h2>
            <p style={{ color: 'var(--text-muted)' }}>Upload your first file (EPUB, PDF, or DOCX) to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
            {books.map((book) => {
              const type = getFileType(book.file_url);
              return (
                <Link href={`/read/${book.id}`} key={book.id} style={{ textDecoration: 'none' }}>
                  <div className="glass-panel flashcard" style={{ height: '300px', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                    {/* Delete Button */}
                    <button 
                      onClick={(e) => handleDeleteBook(e, book)}
                      title="Delete book"
                      style={{ 
                        position: 'absolute', top: '12px', right: '12px', 
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', 
                        color: '#f87171', borderRadius: '8px', padding: '6px 10px', 
                        cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s ease',
                        zIndex: 2
                      }}
                    >
                      🗑️
                    </button>

                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{FILE_ICONS[type] || "📖"}</div>
                    <h3 className="heading" style={{ color: 'var(--text)', fontSize: '1.2rem' }}>{book.title}</h3>
                    <div style={{ 
                      marginTop: '12px', padding: '3px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                      background: type === 'epub' ? 'rgba(99,102,241,0.15)' : type === 'pdf' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: type === 'epub' ? '#818cf8' : type === 'pdf' ? '#f87171' : '#34d399',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                      {type}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px' }}>
                      Added {new Date(book.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
