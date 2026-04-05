"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
         setUser(user);
      } else {
         router.push("/auth");
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMsg("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  if (!user) return <div className="app-container"><Navigation /><div style={{padding: '2rem'}}>Loading profile...</div></div>;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <Navigation />
      <main style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 className="heading" style={{ fontSize: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Profile</h1>
        
        {/* User Info Card */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '24px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
            <div style={{ fontSize: '1.3rem', marginTop: '6px', fontWeight: '500' }}>{user.user_metadata?.username || "Not set"}</div>
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <div style={{ fontSize: '1.3rem', marginTop: '6px', fontWeight: '500' }}>{user.email}</div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '24px' }}>
          <h2 className="heading" style={{ fontSize: '1.3rem', marginBottom: '20px' }}>🔒 Change Password</h2>
          
          {passwordMsg && (
            <div style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {passwordMsg}
            </div>
          )}
          {passwordError && (
            <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min 6 characters"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'white', outline: 'none', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'white', outline: 'none', fontSize: '1rem' }}
              />
            </div>
            <button type="submit" className="btn" style={{ padding: '14px', marginTop: '4px' }} disabled={changingPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Logout */}
        <button className="btn" onClick={handleLogout} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
          Log Out
        </button>
      </main>
    </div>
  );
}
