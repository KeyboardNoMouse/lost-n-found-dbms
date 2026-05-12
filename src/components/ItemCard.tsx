"use client";

import { Item } from "@/types";

interface ItemCardProps {
  item: Item;
  /** Show reporter email/phone (owner or admin view) */
  showContact?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).toUpperCase();
}

export default function ItemCard({ item, showContact = false }: ItemCardProps) {
  return (
    <div className="custom-card item-card">
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
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {item.location}
          </div>
          <div className="meta-row">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(item.date)}
          </div>
          <div className="meta-row">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {item.reporterName}
          </div>

          {showContact && (
            <div className="meta-actions">
              {item.reporterPhone && (
                <a
                  href={`tel:${item.reporterPhone}`}
                  className="btn-contact btn-contact-phone"
                  aria-label={`Call ${item.reporterName}`}
                >
                  Call
                </a>
              )}
              {item.reporterEmail && (
                <a
                  href={`mailto:${item.reporterEmail}`}
                  className="btn-contact btn-contact-email"
                  aria-label={`Email ${item.reporterName}`}
                >
                  Email
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
