"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import "./page.css";
import React from "react";

export default function ClaimPage({ params }: { params: Promise<{ itemId: string }> }) {
  const unwrappedParams = React.use(params);
  const itemId = unwrappedParams.itemId;
  
  const { data: session } = useSession();
  const router = useRouter();
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError("You must be logged in to claim an item.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, message, phone }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to submit claim. You might have already claimed this item.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="claim-container"><div className="loading-spinner"></div></div>;
  if (!item) return <div className="claim-container"><p className="error-text">{error || "Item not found"}</p></div>;

  if (success) {
    return (
      <div className="claim-container">
        <div className="custom-card success-card">
          <div className="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="success-title">{item.type === 'lost' ? 'Response Submitted!' : 'Claim Submitted!'}</h2>
          <p className="success-message">We've sent an email to the reporter with your details and message.</p>
          <p className="success-message">You should also receive a confirmation email shortly.</p>
          <button className="btn-primary success-btn" onClick={() => router.push("/")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-container">
      <div className="custom-card claim-card">
        <div className="claim-header">
          <h2 className="claim-title">{item.type === 'lost' ? 'Respond to Lost Item' : 'Claim Found Item'}</h2>
          <span className={item.type === "lost" ? "badge badge-lost" : "badge badge-found"}>
            {item.type.toUpperCase()}
          </span>
        </div>
        
        <div className="item-summary">
          {item.imageUrl && (
             <div className="item-image-wrapper-small">
               <img src={item.imageUrl} alt={item.title} className="item-image-small" />
             </div>
          )}
          <div className="item-details-brief">
            <h3>{item.title}</h3>
            <p className="desc">{item.description}</p>
            <p className="item-meta-text">
              <strong>Location:</strong> {item.location}
            </p>
            <p className="item-meta-text">
              <strong>Reporter:</strong> {item.reporterName}
            </p>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="claim-form">
          <div className="form-group">
            <label htmlFor="message">Message to Reporter (Optional)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={item.type === 'lost' ? "Hi, I have information about this lost item..." : "Hi, this looks like my item. I can provide more details if needed..."}
              rows={4}
              className="form-input"
            />
            <p className="helper-text">{item.type === 'lost' ? 'If left empty, a default response will be sent.' : 'If left empty, a default claim message will be sent.'}</p>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="form-input"
            />
            <p className="helper-text">Provide your phone number for faster contact.</p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => router.push("/")}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Sending Email..." : (item.type === 'lost' ? "Submit Response" : "Submit Claim")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
