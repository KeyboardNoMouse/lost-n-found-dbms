"use client";

import { useEffect, useState, useCallback } from "react";
import "./page.css";
import { Item, Pagination } from "@/types";
import { useSession, signIn } from "next-auth/react";

const CATEGORIES = ["All", "Electronics", "Keys", "Documents", "Clothing", "Other"];
const CAMPUS_LOCATIONS = [
  "Main Block", "Library", "Canteen", "Sports Complex", "Auditorium",
  "Computer Science Block", "ECE Block", "Mechanical Block", "Civil Block",
  "Workshop", "Admin Block", "Boys Hostel", "Girls Hostel", "Parking Lot", "Other",
];

function SkeletonCard() {
  return (
    <div className="custom-card item-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-image" />
      <div className="item-content">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text short" />
        <div className="meta-actions" style={{ marginTop: "1.5rem" }}>
          <div className="skeleton" style={{ height: "32px", flex: 1 }} />
          <div className="skeleton" style={{ height: "32px", flex: 1 }} />
        </div>
      </div>
    </div>
  );
}

type ClaimState = "idle" | "open" | "submitting" | "done" | "error";

function ClaimModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ClaimState>("idle");
  const [errMsg, setErrMsg] = useState("");

  const submit = async () => {
    if (!message.trim()) return;
    setState("submitting");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item._id, message }),
      });
      const data = await res.json();
      if (data.success) {
        setState("done");
      } else {
        setErrMsg(data.error ?? "Submission failed");
        setState("error");
      }
    } catch {
      setErrMsg("Network error");
      setState("error");
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="claim-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content custom-card">
        {state === "done" ? (
          <>
            <h2 id="claim-title" style={{ marginBottom: "0.75rem" }}>Claim submitted!</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              The reporter has been notified and will contact you if your claim matches.
            </p>
            <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h2 id="claim-title" style={{ marginBottom: "0.25rem" }}>Claim this item</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
              <strong>{item.title}</strong> — describe why this belongs to you
            </p>
            {state === "error" && <div className="alert alert-error">{errMsg}</div>}
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe identifying details, serial numbers, where you lost it..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              style={{ marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn-primary"
                onClick={submit}
                disabled={state === "submitting" || !message.trim()}
                style={{ flex: 2 }}
              >
                {state === "submitting" ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [claimItem, setClaimItem] = useState<Item | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      if (category !== "All") params.set("category", category);
      if (search) params.set("search", search);
      params.set("sort", sort);
      params.set("page", String(page));

      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [filter, category, search, sort, page]);

  useEffect(() => { setPage(1); }, [filter, category, search, sort]);
  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <main>
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Campus Hub</h1>
          <p style={{ color: "var(--text-muted)" }}>Lost &amp; Found listings at NIE</p>
        </div>
        <div className="filters" role="group" aria-label="Filter by type">
          {(["all", "lost", "found"] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Category + Sort */}
      <div className="search-bar">
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              className="search-input"
              placeholder="Search items..."
              aria-label="Search items"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="search-clear" aria-label="Clear search"
                onClick={() => { setSearchInput(""); setSearch(""); }}>✕</button>
            )}
          </div>

          {/* Sort control */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
            className="form-control"
            aria-label="Sort order"
            style={{ width: "auto", padding: "0.6rem 0.9rem", fontSize: "0.875rem" }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <div className="category-tabs" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`category-btn ${category === c ? "active" : ""}`}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="items-grid" role="status" aria-label="Loading items">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {pagination && (
            <p className="results-count" aria-live="polite">
              {pagination.total} Report{pagination.total !== 1 ? "s" : ""} found
            </p>
          )}
          <div className="items-grid">
            {items.length === 0 ? (
              <div className="empty-state custom-card">
                <h3 style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>No items found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item._id} className="custom-card item-card">
                  <span className={item.type === "lost" ? "item-badge-lost" : "item-badge-found"}>
                    {item.type.toUpperCase()}
                  </span>
                  <span className="category-badge">{item.category}</span>

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
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {item.location}
                      </div>
                      <div className="meta-row">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(item.date).toLocaleString("en-GB", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit", hour12: true,
                        }).toUpperCase()}
                      </div>
                      <div className="meta-row">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {item.reporterName}
                      </div>

                      <div className="meta-actions">
                        {item.reporterPhone && (
                          <a href={`tel:${item.reporterPhone}`} className="btn-contact btn-contact-phone">
                            Call
                          </a>
                        )}
                        {item.reporterEmail && (
                          <a href={`mailto:${item.reporterEmail}`} className="btn-contact btn-contact-email">
                            Email
                          </a>
                        )}
                        {session ? (
                          <button
                            className="btn-contact btn-contact-email"
                            style={{ cursor: "pointer" }}
                            onClick={() => setClaimItem(item)}
                            aria-label={`Claim ${item.title}`}
                          >
                            I found / own this
                          </button>
                        ) : (
                          <button
                            className="btn-contact btn-contact-email"
                            style={{ cursor: "pointer" }}
                            onClick={() => signIn("google")}
                          >
                            Login to claim
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination" role="navigation" aria-label="Pagination">
              <button className="page-btn" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="page-info">Page {page} of {pagination.totalPages}</span>
              <button className="page-btn" disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {claimItem && <ClaimModal item={claimItem} onClose={() => setClaimItem(null)} />}
    </main>
  );
}
