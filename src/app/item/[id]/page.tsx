"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import "./item.css";

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const itemId = unwrappedParams.id;
  
  const { data: session } = useSession();
  const router = useRouter();
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Claim Modal states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState("");

  // Report Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/items/${itemId}`);
        const data = await res.json();
        if (data.success) {
          setItem(data.data);
        } else {
          setError(data.error || "Failed to load item");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [itemId]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setClaimError("You must be logged in to claim an item.");
      return;
    }
    setSubmittingClaim(true);
    setClaimError("");

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, message: claimMessage, phone: claimPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimSuccess(true);
        setClaimMessage("");
        setClaimPhone("");
      } else {
        setClaimError(data.error || "Failed to submit claim. You might have already claimed this item.");
      }
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    setReportError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, reason: reportReason }),
      });
      const data = await res.json();
      if (data.success) {
        setReportSuccess(true);
        setReportReason("");
      } else {
        setReportError(data.error || "Failed to submit report");
      }
    } catch (err: any) {
      setReportError(err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", marginTop: "4rem", color: "var(--text-muted)" }}>Loading item...</div>;
  if (!item) return <div style={{ display: "flex", justifyContent: "center", marginTop: "4rem", color: "var(--danger)" }}>{error || "Item not found"}</div>;

  return (
    <main className="item-page-container">
      <div className="item-page-header">
        <button onClick={() => router.back()} className="back-btn">
          &larr; Back
        </button>
      </div>

      <div className="item-full-card custom-card">
        <div className="item-full-header">
          <span className={item.type === "lost" ? "item-badge-lost" : "item-badge-found"}>
            {item.type.toUpperCase()}
          </span>
          <span className="category-badge">{item.category}</span>
          {item.status === "resolved" && <span className="resolved-badge" style={{ marginLeft: "auto", background: "#10b981", color: "white", padding: "0.4rem 0.8rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>RECOVERED</span>}
        </div>

        <div className="item-full-layout">
          <div className="item-full-image-container">
            <img
              src={item.imageUrl || "/default-item.svg"}
              alt={item.title}
              className="item-full-image"
            />
          </div>

          <div className="item-full-details">
            <h1 className="item-full-title">{item.title}</h1>
            <p className="item-full-desc">{item.description}</p>

            <div className="item-full-meta">
              <div className="meta-row">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span><strong>Location:</strong> {item.location}</span>
              </div>
              <div className="meta-row">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span><strong>Reported At:</strong> {new Date(item.date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}</span>
              </div>
              <div className="meta-row">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span><strong>Reported By:</strong> {item.reporterName}</span>
              </div>
            </div>

            <div className="item-full-actions">
              <button 
                className="btn-contact btn-contact-claim" 
                onClick={() => setShowClaimModal(true)}
                style={{ flex: 1, textAlign: "center", border: "none", cursor: "pointer" }}
              >
                {item.type === 'lost' ? 'Respond to Item' : 'Claim Item'}
              </button>
              <button 
                className="btn-report-flag" 
                onClick={() => setShowReportModal(true)}
                title="Report this item"
                style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => { setShowReportModal(false); setReportSuccess(false); }}>
          <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report Item</h2>
              <button className="close-btn" onClick={() => { setShowReportModal(false); setReportSuccess(false); }}>✕</button>
            </div>
            {reportSuccess ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ color: "#10b981", marginBottom: "1rem" }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48" style={{ margin: "0 auto", display: "block" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 style={{ marginBottom: "0.5rem", color: "var(--text-main)", fontSize: "1.25rem" }}>Report Submitted Successfully</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Thank you. Our team will review this item shortly.</p>
                <button type="button" className="btn-contact-claim" onClick={() => { setShowReportModal(false); setReportSuccess(false); }} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600, border: "none", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
              <p className="modal-desc" style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                If you believe this item is spam, contains misinformation, or is inappropriate, please let us know.
              </p>
              {reportError && <div className="error-banner" style={{ marginBottom: "1rem", color: "#dc2626", background: "rgba(220,38,38,0.1)", padding: "0.75rem", borderRadius: "6px" }}>{reportError}</div>}
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="reportReason" style={{ fontWeight: 600 }}>Reason for reporting</label>
                <textarea
                  id="reportReason"
                  required
                  rows={4}
                  className="search-input"
                  style={{ height: "auto", padding: "1rem" }}
                  placeholder="Please provide details about why you are reporting this item..."
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button type="button" className="page-btn" onClick={() => { setShowReportModal(false); setReportSuccess(false); }}>Cancel</button>
                <button type="submit" className="btn-contact-claim" disabled={submittingReport} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600, border: "none", cursor: submittingReport ? "not-allowed" : "pointer", opacity: submittingReport ? 0.7 : 1 }}>
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
      {/* Claim Modal */}
      {showClaimModal && (
        <div className="modal-overlay" onClick={() => { setShowClaimModal(false); setClaimSuccess(false); setClaimError(""); }}>
          <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{item.type === 'lost' ? 'Respond to Lost Item' : 'Claim Found Item'}</h2>
              <button className="close-btn" onClick={() => { setShowClaimModal(false); setClaimSuccess(false); setClaimError(""); }}>✕</button>
            </div>
            {claimSuccess ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ color: "#10b981", margin: "0 auto 1.5rem" }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="64" height="64" style={{ margin: "0 auto", display: "block" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 style={{ marginBottom: "1rem", color: "var(--text-main)", fontSize: "1.5rem" }}>Message Sent!</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "1.1rem" }}>The reporter has been notified. They will contact you shortly.</p>
                <button type="button" className="btn-primary" onClick={() => { setShowClaimModal(false); setClaimSuccess(false); router.push("/"); }} style={{ width: "100%", padding: "0.8rem", fontSize: "1.1rem" }}>
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit}>
                <p className="modal-desc" style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  {item.type === 'lost' ? "Have you found this item? Leave a message and contact info so the owner can reach you." : "Is this your item? Provide identifying details and contact info."}
                </p>
                {!session && <div className="error-banner" style={{ marginBottom: "1rem", color: "#dc2626", background: "rgba(220,38,38,0.1)", padding: "0.75rem", borderRadius: "6px" }}>Please log in to claim or respond to items.</div>}
                {claimError && <div className="error-banner" style={{ marginBottom: "1rem", color: "#dc2626", background: "rgba(220,38,38,0.1)", padding: "0.75rem", borderRadius: "6px" }}>{claimError}</div>}
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                  <label htmlFor="claimMessage" style={{ fontWeight: 600 }}>Message</label>
                  <textarea
                    id="claimMessage"
                    required
                    rows={4}
                    className="form-control"
                    placeholder={item.type === 'lost' ? "E.g., I found your item near the library..." : "E.g., This is mine, it has a scratch on the back..."}
                    value={claimMessage}
                    onChange={e => setClaimMessage(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="claimPhone" style={{ fontWeight: 600 }}>Contact Phone <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                  <input
                    type="tel"
                    id="claimPhone"
                    className="form-control"
                    placeholder="Your phone number"
                    value={claimPhone}
                    onChange={e => setClaimPhone(e.target.value)}
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <button type="button" className="page-btn" onClick={() => setShowClaimModal(false)}>Cancel</button>
                  <button type="submit" className="btn-contact-claim" disabled={submittingClaim || !session} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600, border: "none", cursor: (submittingClaim || !session) ? "not-allowed" : "pointer", opacity: (submittingClaim || !session) ? 0.7 : 1 }}>
                    {submittingClaim ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
