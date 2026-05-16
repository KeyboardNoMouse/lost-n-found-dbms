"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import "./history.css";
import "../page.css";

type Item = {
  _id: string;
  title: string;
  description: string;
  type: "lost" | "found";
  category: string;
  location: string;
  date: string;
  imageUrl?: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  status: "open" | "resolved" | "expired";
};

type Claim = {
  _id: string;
  itemId: { _id: string; title: string; type: string; category: string } | null;
  claimerName: string;
  claimerEmail: string;
  message: string;
  phone?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

type ItemReport = {
  _id: string;
  itemId: { _id: string; title: string; type: string; category: string } | null;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
};

export default function History() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [receivedClaims, setReceivedClaims] = useState<Claim[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [myReports, setMyReports] = useState<ItemReport[]>([]);
  const [activeTab, setActiveTab] = useState<"items" | "received_claims" | "my_claims" | "reports">("items");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [maxDatetime, setMaxDatetime] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setMaxDatetime(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) fetchDashboard();
  }, [session]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/dashboard`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data.myItems);
        setReceivedClaims(data.data.receivedClaims);
        setMyClaims(data.data.myClaims);
        setMyReports(data.data.myReports);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleClaimAction = async (claimId: string, action: "accepted" | "rejected") => {
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setSuccess(`Claim marked as ${action}!`);
        fetchDashboard();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update claim.");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Network error.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "resolved" : "open";
    // Optimistic update
    setItems(prev => prev.map(item => item._id === id ? { ...item, status: newStatus as Item["status"] } : item));
    setTogglingId(id);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Rollback on failure
        setItems(prev => prev.map(item => item._id === id ? { ...item, status: currentStatus as Item["status"] } : item));
        setError("Failed to update status. Please try again.");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setItems(prev => prev.map(item => item._id === id ? { ...item, status: currentStatus as Item["status"] } : item));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    // Optimistic
    const removed = items.find(i => i._id === id);
    setItems(prev => prev.filter(item => item._id !== id));
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok && removed) {
        setItems(prev => [...prev, removed]);
        setError("Failed to delete item.");
        setTimeout(() => setError(""), 3000);
      } else {
        setSuccess("Item deleted.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      if (removed) setItems(prev => [...prev, removed]);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/items/${editingItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingItem.title,
          description: editingItem.description,
          location: editingItem.location,
          date: editingItem.date,
          reporterPhone: editingItem.reporterPhone,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setItems(prev => prev.map(item => item._id === data._id ? data : item));
        setEditingItem(null);
        setSuccess("Item updated successfully.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update item.");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Network error.");
    }
  };

  if (status === "loading" || loading) {
    return <div className="text-center mt-2" style={{ color: "var(--text-muted)", marginTop: "4rem" }}>Loading history...</div>;
  }

  return (
    <main>
      <div className="dashboard-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="page-title">My Tracked Items</h1>
          <p style={{ color: "var(--text-muted)" }}>Manage your reported items, claims, and reports</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", background: "var(--surface-color)", padding: "0.4rem", borderRadius: "10px", border: "1px solid var(--border-color)", marginBottom: "2rem", overflowX: "auto", flexWrap: "wrap" }}>
        <button style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 500, background: activeTab === "items" ? "var(--primary)" : "transparent", color: activeTab === "items" ? "white" : "var(--text-muted)", transition: "all 0.2s" }} onClick={() => setActiveTab("items")}>My Items</button>
        <button style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 500, background: activeTab === "received_claims" ? "var(--primary)" : "transparent", color: activeTab === "received_claims" ? "white" : "var(--text-muted)", transition: "all 0.2s" }} onClick={() => setActiveTab("received_claims")}>Received Claims</button>
        <button style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 500, background: activeTab === "my_claims" ? "var(--primary)" : "transparent", color: activeTab === "my_claims" ? "white" : "var(--text-muted)", transition: "all 0.2s" }} onClick={() => setActiveTab("my_claims")}>My Claims</button>
        <button style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 500, background: activeTab === "reports" ? "var(--primary)" : "transparent", color: activeTab === "reports" ? "white" : "var(--text-muted)", transition: "all 0.2s" }} onClick={() => setActiveTab("reports")}>My Reports</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {activeTab === "items" && (
        <div className="items-grid">
          {items.length === 0 ? (
            <div className="empty-state custom-card">
              <h3 style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>No items reported</h3>
              <p>You haven't reported any lost or found items yet.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item._id} className={`custom-card item-card ${item.status === "resolved" ? "item-resolved" : ""}`} onClick={() => router.push(`/item/${item._id}`)} style={{ cursor: "pointer" }}>
                <span className={item.type === "lost" ? "item-badge-lost" : "item-badge-found"}>
                  {item.type.toUpperCase()}
                </span>
                {item.status === "resolved" && <div className="resolved-banner">RECOVERED</div>}

                <div className="item-image-wrapper">
                  <img
                    src={item.imageUrl || "/default-item.svg"}
                    alt={item.title}
                    className="item-image"
                    loading="lazy"
                  />
                </div>

                <div className="item-content">
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-desc">{item.description}</p>
                  <div className="item-meta">
                    <div className="meta-row">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.location}
                    </div>
                    <div className="meta-row">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(item.date).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Category: {item.category}
                    </div>
                  </div>

                  <div className="history-actions" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(item._id, item.status); }}
                      disabled={togglingId === item._id}
                      style={{ flex: 1, padding: "0.4rem", backgroundColor: item.status === "open" ? "#10b981" : "var(--text-muted)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 500, opacity: togglingId === item._id ? 0.6 : 1 }}>
                      {item.status === "open" ? "Mark Recovered" : "Reopen"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const localDate = new Date(new Date(item.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setEditingItem({ ...item, date: localDate });
                      }}
                      style={{ flex: 1, padding: "0.4rem", border: "1px solid var(--primary)", background: "transparent", color: "var(--primary)", borderRadius: "4px", cursor: "pointer", fontWeight: 500 }}>
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                      style={{ padding: "0.4rem 0.6rem", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", borderRadius: "4px", cursor: "pointer", fontWeight: 500 }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(activeTab === "received_claims" || activeTab === "my_claims" || activeTab === "reports") && (
        <div className="custom-card" style={{ padding: "0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-color)", borderBottom: "1px solid var(--border-color)" }}>
                {activeTab === "received_claims" && ["Item", "Claimer", "Message", "Status", "Date", "Actions"].map(h => <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)" }}>{h}</th>)}
                {activeTab === "my_claims" && ["Item", "Your Message", "Status", "Date"].map(h => <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)" }}>{h}</th>)}
                {activeTab === "reports" && ["Item", "Reason", "Status", "Date"].map(h => <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--text-muted)" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeTab === "received_claims" && receivedClaims.map(claim => (
                <tr key={claim._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>{claim.itemId ? <div><strong>{claim.itemId.title}</strong><br/><a href={`/item/${claim.itemId._id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none" }}>View Item &rarr;</a></div> : "Deleted Item"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}><div>{claim.claimerName}</div><div style={{fontSize: "0.75rem", color: "var(--text-muted)"}}>{claim.claimerEmail}</div>{claim.phone && <div style={{fontSize: "0.75rem", color: "var(--text-muted)"}}>Ph: {claim.phone}</div>}</td>
                  <td style={{ padding: "0.75rem 1rem", maxWidth: "200px" }}>{claim.message || "No message"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: claim.status === "pending" ? "rgba(245,158,11,0.1)" : claim.status === "accepted" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: claim.status === "pending" ? "#f59e0b" : claim.status === "accepted" ? "#10b981" : "#ef4444" }}>
                      {claim.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{new Date(claim.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {claim.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => handleClaimAction(claim._id, "accepted")} style={{ padding: "0.3rem 0.6rem", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>Accept</button>
                        <button onClick={() => handleClaimAction(claim._id, "rejected")} style={{ padding: "0.3rem 0.6rem", background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {activeTab === "my_claims" && myClaims.map(claim => (
                <tr key={claim._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>{claim.itemId ? <div><strong>{claim.itemId.title}</strong><br/><a href={`/item/${claim.itemId._id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none" }}>View Item &rarr;</a></div> : "Deleted Item"}</td>
                  <td style={{ padding: "0.75rem 1rem", maxWidth: "200px" }}>{claim.message || "No message"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: claim.status === "pending" ? "rgba(245,158,11,0.1)" : claim.status === "accepted" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: claim.status === "pending" ? "#f59e0b" : claim.status === "accepted" ? "#10b981" : "#ef4444" }}>
                      {claim.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{new Date(claim.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}

              {activeTab === "reports" && myReports.map(report => (
                <tr key={report._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>{report.itemId ? <div><strong>{report.itemId.title}</strong><br/><a href={`/item/${report.itemId._id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none" }}>View Item &rarr;</a></div> : "Deleted Item"}</td>
                  <td style={{ padding: "0.75rem 1rem", maxWidth: "250px" }}>{report.reason}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: report.status === "pending" ? "rgba(245,158,11,0.1)" : report.status === "reviewed" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)", color: report.status === "pending" ? "#f59e0b" : report.status === "reviewed" ? "#10b981" : "#6b7280" }}>
                      {report.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{new Date(report.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              
              {((activeTab === "received_claims" && receivedClaims.length === 0) || (activeTab === "my_claims" && myClaims.length === 0) || (activeTab === "reports" && myReports.length === 0)) && (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Nothing to show here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingItem && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingItem(null); }}>
          <div className="modal-content custom-card">
            <h2 style={{ marginBottom: "1rem" }}>Edit Item</h2>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Title", key: "title", type: "text" },
                { label: "Location", key: "location", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>{label}</label>
                  <input
                    type={type}
                    value={(editingItem as Record<string, string>)[key]}
                    onChange={(e) => setEditingItem({ ...editingItem, [key]: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="form-control"
                  style={{ minHeight: "80px" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={editingItem.date}
                  onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                  max={maxDatetime || undefined}
                  className="form-control"
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>Contact Phone (Optional)</label>
                <input
                  type="tel"
                  value={editingItem.reporterPhone ?? ""}
                  onChange={(e) => setEditingItem({ ...editingItem, reporterPhone: e.target.value })}
                  className="form-control"
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
