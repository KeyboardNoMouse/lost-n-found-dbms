"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

type FieldError = { field: string; message: string };

const CAMPUS_LOCATIONS = [
  "Main Block", "Library", "Canteen", "Sports Complex", "Auditorium",
  "Computer Science Block", "ECE Block", "Mechanical Block", "Civil Block",
  "Workshop", "Admin Block", "Boys Hostel", "Girls Hostel", "Parking Lot", "Other",
];

export default function AddItem() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [maxDatetime, setMaxDatetime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setMaxDatetime(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  if (status === "loading") return <main><div className="text-center mt-2">Loading...</div></main>;
  if (!session) {
    return (
      <main className="flex-center" style={{ minHeight: "60vh" }}>
        <div className="custom-card text-center" style={{ maxWidth: "400px" }}>
          <h2 className="mb-2" style={{ color: "var(--text-main)" }}>Login Required</h2>
          <p className="mb-2" style={{ color: "var(--text-muted)" }}>
            You must be logged in to report a lost or found item.
          </p>
          <button className="btn-primary" onClick={() => signIn("google")}>Login with Google</button>
        </div>
      </main>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setImagePreview(null); return; }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Only JPEG, PNG, WebP and GIF allowed" }));
      setImagePreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 5 MB" }));
      setImagePreview(null);
      return;
    }
    setErrors((prev) => { const n = { ...prev }; delete n.image; return n; });
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGlobalError("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/items", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 429) { setGlobalError(data.error ?? "Too many requests."); return; }
      if (res.status === 422 && data.errors) {
        const fieldErrors: Record<string, string> = {};
        (data.errors as FieldError[]).forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
        return;
      }
      if (!data.success) { setGlobalError(data.error ?? "Submission failed"); return; }
      setSuccessMsg("Item reported successfully! Redirecting...");
      setTimeout(() => router.push("/"), 1200);
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fc = (field: string) => `form-control${errors[field] ? " input-error" : ""}`;

  return (
    <main style={{ display: "flex", justifyContent: "center" }}>
      <div className="custom-card" style={{ width: "100%", maxWidth: "768px" }}>
        <h2 className="page-title text-center" style={{ marginBottom: "0.2rem" }}>Report an Item</h2>
        <p className="text-center" style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Help us keep our campus community connected
        </p>

        {globalError && <div className="alert alert-error" role="alert">{globalError}</div>}
        {successMsg && <div className="alert alert-success" role="status">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <h3 className="form-section-title">Item Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="type">Report Type</label>
              <select id="type" name="type" className={fc("type")} required defaultValue="lost">
                <option value="lost">LOST</option>
                <option value="found">FOUND</option>
              </select>
              {errors.type && <span className="field-error" role="alert">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="title">Item Name</label>
              <input id="title" type="text" name="title" className={fc("title")}
                placeholder="E.g., Blue Backpack, Dell Laptop" maxLength={100} required
                aria-describedby={errors.title ? "title-err" : undefined} />
              {errors.title && <span id="title-err" className="field-error" role="alert">{errors.title}</span>}
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" className={fc("description")}
                rows={3} placeholder="Color, brand, identifying marks..." maxLength={500} required />
              {errors.description && <span className="field-error" role="alert">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" className={fc("category")} required>
                <option value="Electronics">Electronics</option>
                <option value="Keys">Keys</option>
                <option value="Documents">Documents/IDs</option>
                <option value="Clothing">Clothing</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <span className="field-error" role="alert">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="image">Upload Image (Optional)</label>
              <input id="image" type="file" name="image" className="form-control"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ padding: "0.5rem" }} onChange={handleImageChange} />
              <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.3rem" }}>
                JPEG, PNG, WebP or GIF — max 5 MB
              </small>
              {errors.image && <span className="field-error" role="alert">{errors.image}</span>}
              {imagePreview && (
                <img src={imagePreview} alt="Preview" style={{
                  marginTop: "0.75rem", width: "100%", maxHeight: "180px",
                  objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)"
                }} />
              )}
            </div>
          </div>

          <h3 className="form-section-title">Where &amp; When</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <select id="location" name="location" className={fc("location")} required>
                <option value="">— Select a location —</option>
                {CAMPUS_LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.location && <span className="field-error" role="alert">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="date">Date &amp; Time Lost/Found</label>
              <input id="date" type="datetime-local" name="date" className={fc("date")}
                max={maxDatetime || undefined} required />
              {errors.date && <span className="field-error" role="alert">{errors.date}</span>}
            </div>
          </div>

          <h3 className="form-section-title">Contact Information</h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input id="phone" type="tel" name="phone" className={fc("phone")}
                placeholder="E.g., +91 9876543210" />
              {errors.phone && <span className="field-error" role="alert">{errors.phone}</span>}
              <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.4rem" }}>
                If provided, people can contact you directly about this report.
              </small>
            </div>
          </div>

          <button type="submit" className="btn-primary"
            style={{ width: "100%", marginTop: "1rem", padding: "1rem" }} disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </main>
  );
}
