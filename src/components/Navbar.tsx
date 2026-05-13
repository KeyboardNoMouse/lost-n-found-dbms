"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import "./Navbar.css";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim().toLowerCase());

export default function Navbar() {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isAdmin = !!(session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase()));

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <Link href="/" className="logo" aria-label="NIE Lost and Found home">
          NIE <span className="logo-highlight">Lost &amp; Found</span>
        </Link>
        <div className="nav-links">
          {session && (
            <>
              {isAdmin && (
                <Link href="/admin" className="nav-item admin-link">Admin</Link>
              )}
              <Link href="/history" className="nav-item history-link">My History</Link>
              <Link href="/add" className="btn-primary">Report Item</Link>
            </>
          )}
          {!session ? (
            <button className="btn-secondary" onClick={() => signIn("google")}>
              Login with Google
            </button>
          ) : (
            <div className="user-menu">
              <button
                className="profile-trigger"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="User menu"
                aria-expanded={showProfileMenu}
                aria-haspopup="true"
              >
                <div className="avatar-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="avatar-icon" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown" role="menu">
                  <div className="user-info">
                    <p className="user-name">{session.user?.name}</p>
                    <p className="user-email">{session.user?.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="btn-logout-full" role="menuitem" onClick={() => signOut()}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
