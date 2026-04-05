"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 32px', 
      borderBottom: '1px solid var(--glass-border)',
      background: 'rgba(24, 24, 27, 0.4)',
      backdropFilter: 'blur(10px)'
    }}>
      <div>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
           <span className="heading" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>📚 Arth</span>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <Link href="/dashboard" className={isActive("/dashboard")} style={navStyle(pathname === "/dashboard")}>
          Library
        </Link>
        <Link href="/flashcards" className={isActive("/flashcards")} style={navStyle(pathname === "/flashcards")}>
          Flashcards
        </Link>
        <Link href="/profile" className={isActive("/profile")} style={navStyle(pathname === "/profile")}>
          Profile
        </Link>
      </div>
    </nav>
  );
}

function navStyle(active) {
  return {
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    textDecoration: 'none',
    fontWeight: active ? '500' : '400',
    transition: 'color 0.2s',
  }
}
