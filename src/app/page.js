"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import "./landing.css";

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  return (
    <div className="lp-wrapper">
      <header className="lp-header">
        <div className="lp-nav-container">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            Arth
          </Link>
          
          <div className="lp-nav-links">
            <Link href="#features" className="lp-nav-link">Features</Link>
            <Link href="#about" className="lp-nav-link">About</Link>
            
            {session ? (
              <Link href="/dashboard" className="lp-btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth?mode=login" className="lp-btn-secondary">
                  Login
                </Link>
                <Link href="/auth?mode=signup" className="lp-btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="lp-section lp-hero">
          <div className="lp-hero-content">
            <h1 className="lp-hero-title">
              Read Smarter, <br />
              <span>Not Harder</span>
            </h1>
            <p className="lp-hero-subtitle">
              Transform your digital library into an interactive odyssey. Our Lexora breathes life into every page, turning passive reading into an active mastery of knowledge.
            </p>
            <div className="lp-hero-actions">
              <Link href={session ? "/dashboard" : "/auth"} className="lp-btn-primary">
                Get Started
              </Link>
              <a href="#features" className="lp-nav-link" style={{ fontWeight: 600 }}>
                Explore Features
              </a>
            </div>
          </div>
          <div className="lp-hero-visual">
            <div style={{ position: 'relative', width: '100%', maxWidth: '680px', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
              <video 
                src="/hero-vedio.mp4" 
                autoPlay={true} 
                loop={true} 
                muted={true} 
                playsInline={true}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="lp-glow"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="lp-section lp-features">
          <div className="lp-section-inner">
            <h2 className="lp-section-heading">6 Curated Experiences</h2>
            <div className="lp-section-subline"></div>
            
            <div className="lp-grid">
              {/* Feature 1 */}
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <h3 className="lp-feature-title">Universal Format Upload</h3>
                <p className="lp-feature-desc">
                  Seamlessly import your entire library. From classic PDFs to modern EPUBs, we treat every digital file with the reverence of a rare folio.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                </div>
                <h3 className="lp-feature-title">Lexora Context Companion</h3>
                <p className="lp-feature-desc">
                  Never break your flow. Highlight complex terminology to receive instant, academically-backed context directly on the same page.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
                </div>
                <h3 className="lp-feature-title">Flashcard Mastery</h3>
                <p className="lp-feature-desc">
                  Passive consumption ends here. Save your words for future memory while reading. Our engine automatically synthesizes Lexora Insights.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </div>
                <h3 className="lp-feature-title">Harmonious Themes</h3>
                <p className="lp-feature-desc">
                  Protect your focus. Read comfortably for hours by selecting from expertly balanced, eye-friendly options like Paperback, Ancient, or Night mode.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="10" height="10"/></svg>
                </div>
                <h3 className="lp-feature-title">Crafted Book Borders</h3>
                <p className="lp-feature-desc">
                  Wrap your digital text in elegance. Frame your reading environment with beautifully embossed Classic, Vintage, Gothic, or Royal border aesthetics.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><line x1="11.414" y1="14.414" x2="14" y2="17"/></svg>
                </div>
                <h3 className="lp-feature-title">Authentic Page Navigation</h3>
                <p className="lp-feature-desc">
                  Navigate like peeling real paper. Instantly jump directly to any location by typing the exact page number, recreating the exact feel of a physical book.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission / Ethos Section */}
        <section id="about" className="lp-section" style={{ background: '#fdf9f0', paddingTop: '8rem', paddingBottom: '8rem' }}>
          <div className="lp-section-inner" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', color: '#735c00', marginBottom: '2rem' }}>Our Mission</div>
            <h2 style={{ fontFamily: 'var(--font-outfit), serif', fontSize: '3.5rem', fontStyle: 'italic', color: '#041627', lineHeight: '1.2', marginBottom: '3rem', letterSpacing: '-0.02em', padding: '0 2rem' }}>
              "Preserving the depth of physical reading in the age of digital noise."
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#c4c6cd', transform: 'rotate(-45deg)' }}>edit</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', textAlign: 'left', padding: '0 1rem' }}>
              {/* The Project */}
              <div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-outfit), serif', color: '#041627', marginBottom: '1.5rem', borderLeft: '3px solid #735c00', paddingLeft: '1rem' }}>The Project</h3>
                <p style={{ color: '#44474c', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Arth was born from a simple frustration: digital reading felt hollow. We wanted to build something that respected the gravity of a physical tome while leveraging the analytical power of artificial intelligence.
                </p>
                <p style={{ color: '#44474c', lineHeight: '1.8', fontSize: '0.95rem' }}>
                  By focusing on typography, intentional asymmetry, and "warm" parchment interfaces, we've created a space where focus is the default, not the exception.
                </p>
              </div>
              
              {/* The Ethos */}
              <div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-outfit), serif', color: '#041627', marginBottom: '1.5rem', borderLeft: '3px solid #735c00', paddingLeft: '1rem' }}>The Ethos</h3>
                <p style={{ color: '#44474c', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  We don't track your reading for "engagement." We analyze your reading for <strong style={{ color: '#735c00' }}>synthesis</strong>. Your data is your own, treated with the same confidentiality as a personal diary.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#041627', fontWeight: 'bold', marginBottom: '1rem', fontStyle: 'italic' }}>
                    <div style={{ width: '4px', height: '4px', background: '#041627', borderRadius: '50%' }}></div> No-Ads Sanctuary
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#041627', fontWeight: 'bold', marginBottom: '1rem', fontStyle: 'italic' }}>
                    <div style={{ width: '4px', height: '4px', background: '#041627', borderRadius: '50%' }}></div> Contextual Lexora Analysis
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#041627', fontWeight: 'bold', fontStyle: 'italic' }}>
                     <div style={{ width: '4px', height: '4px', background: '#041627', borderRadius: '50%' }}></div> Premium Design Language
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <div className="lp-cta">
            <div className="lp-cta-pattern"></div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1, color: '#fed65b' }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <h2>Ready to start your journey?</h2>
            <p>Join a community of deep-thinkers and curious minds. Your digital sanctuary awaits, featuring immersive themes and intelligent assistance.</p>
            <Link href={session ? "/dashboard" : "/auth"} className="lp-btn-primary" style={{ position: 'relative', zIndex: 1 }}>
              Get Started
            </Link>
            <div className="lp-cta-platforms">
              <span>Available for Desktop</span>
              <span>•</span>
              <span>Web Reader</span>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '2rem', textAlign: 'center', color: '#74777d', fontSize: '0.9rem' }}>
        <p>© 2026 Arth. Crafted for the modern scholar.</p>
      </footer>
    </div>
  );
}
