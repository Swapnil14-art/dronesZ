import React, { useState, useEffect } from "react";

export interface EnquiryAttachmentMeta {
  id: number;
  enquiryId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface EnquiryItem {
  id: number;
  reference: string;
  enquiryType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  message?: string | null;
  specifications?: Record<string, any> | null;
  productItems?: any[] | null;
  totalItems: number;
  indicativeTotal: number;
  deliveryStatus: "PENDING" | "SENT" | "FAILED";
  deliveryError?: string | null;
  deliveryAttempts: number;
  lastAttemptedAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: EnquiryAttachmentMeta[];
}

export interface EnquiryStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

interface EnquiryManagementProps {
  token: string;
}

export const EnquiryManagement: React.FC<EnquiryManagementProps> = ({ token }) => {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [stats, setStats] = useState<EnquiryStats>({ total: 0, sent: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Selected Enquiry for Details Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);

  // Retry state
  const [retryingId, setRetryingId] = useState<number | null>(null);

  // Two-step Delete States
  // Step 1: target enquiry identified
  const [deleteTarget, setDeleteTarget] = useState<EnquiryItem | null>(null);
  // Step 2: explicit confirmation step active
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("sort", sortOrder);
      params.set("limit", "100");

      const res = await fetch(`/api/admin/enquiries?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to load enquiries.");
      }

      const data = await res.json();
      setEnquiries(data.enquiries || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setError(err.message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [typeFilter, statusFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEnquiries();
  };

  const handleRetry = async (enquiry: EnquiryItem) => {
    setRetryingId(enquiry.id);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiry.id}/retry`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Retry failed.");
      }

      setActionSuccess(`Email successfully delivered for enquiry #${enquiry.reference}!`);
      // Update local state
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? { ...e, deliveryStatus: "SENT", deliveryError: null } : e))
      );
      if (selectedEnquiry && selectedEnquiry.id === enquiry.id) {
        setSelectedEnquiry({ ...selectedEnquiry, deliveryStatus: "SENT", deliveryError: null });
      }
      setStats((prev) => ({
        ...prev,
        sent: prev.sent + 1,
        failed: enquiry.deliveryStatus === "FAILED" ? Math.max(0, prev.failed - 1) : prev.failed,
      }));
    } catch (err: any) {
      setError(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDownloadAttachment = async (enquiryId: number, attachment: EnquiryAttachmentMeta) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/attachments/${attachment.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Could not download file.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    }
  };

  // Two-Step Deletion Handlers
  const initiateDelete = (enquiry: EnquiryItem) => {
    setDeleteTarget(enquiry);
    setDeleteStep(1);
  };

  const confirmStep1 = () => {
    setDeleteStep(2);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteStep(1);
    setDeleting(false);
  };

  const executeFinalDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enquiries/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Could not delete enquiry.");
      }

      setActionSuccess(`Enquiry #${deleteTarget.reference} and associated attachments have been permanently deleted.`);
      setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      if (selectedEnquiry && selectedEnquiry.id === deleteTarget.id) {
        setSelectedEnquiry(null);
      }
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        sent: deleteTarget.deliveryStatus === "SENT" ? Math.max(0, prev.sent - 1) : prev.sent,
        failed: deleteTarget.deliveryStatus === "FAILED" ? Math.max(0, prev.failed - 1) : prev.failed,
        pending: deleteTarget.deliveryStatus === "PENDING" ? Math.max(0, prev.pending - 1) : prev.pending,
      }));
      cancelDelete();
    } catch (err: any) {
      setError(`Deletion failed: ${err.message}`);
      setDeleting(false);
    }
  };

  const formatTypeBadge = (type: string) => {
    let bg = "#e2e8f0";
    let color = "#334155";
    let label = type;

    if (type.includes("design")) {
      bg = "#dbeafe";
      color = "#1e40af";
      label = "CAD Design";
    } else if (type.includes("idea")) {
      bg = "#fef3c7";
      color = "#92400e";
      label = "Idea / Concept";
    } else if (type.includes("byod") || type.includes("build_your_own")) {
      bg = "#ede9fe";
      color = "#5b21b6";
      label = "BYOD Architecture";
    } else if (type.includes("cart")) {
      bg = "#fce7f3";
      color = "#9d174d";
      label = "Cart Quotation";
    } else {
      bg = "#f1f5f9";
      color = "#475569";
      label = "General Contact";
    }

    return (
      <span
        style={{
          background: bg,
          color,
          fontSize: "11px",
          fontWeight: 700,
          padding: "3px 8px",
          borderRadius: "4px",
          display: "inline-block",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
    );
  };

  const formatStatusBadge = (status: string) => {
    let bg = "#fef3c7";
    let color = "#92400e";
    let icon = "⏳";

    if (status === "SENT") {
      bg = "#d1fae5";
      color = "#065f46";
      icon = "✓";
    } else if (status === "FAILED") {
      bg = "#fee2e2";
      color = "#991b1b";
      icon = "✕";
    }

    return (
      <span
        style={{
          background: bg,
          color,
          fontSize: "11px",
          fontWeight: 800,
          padding: "3px 8px",
          borderRadius: "4px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>{icon}</span> {status}
      </span>
    );
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header & Stats Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
            Customer Enquiries &amp; Leads
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
            PostgreSQL-persisted enquiries with direct Resend email delivery and attachment inspection.
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          disabled={loading}
          className="btn-stitch-ghost"
          style={{ fontSize: "13px", color: "#38bdf8", borderColor: "#38bdf8" }}
        >
          {loading ? "Refreshing..." : "↻ Refresh List"}
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Total Enquiries</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f8fafc", marginTop: "4px" }}>{stats.total}</div>
        </div>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "12px", color: "#10b981", textTransform: "uppercase", fontWeight: 600 }}>Delivered (Resend)</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>{stats.sent}</div>
        </div>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "12px", color: "#f43f5e", textTransform: "uppercase", fontWeight: 600 }}>Delivery Failed</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f43f5e", marginTop: "4px" }}>{stats.failed}</div>
        </div>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "12px", color: "#f59e0b", textTransform: "uppercase", fontWeight: 600 }}>Pending Dispatch</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>{stats.pending}</div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div style={{ background: "#065f46", color: "#d1fae5", padding: "0.85rem 1.25rem", borderRadius: "6px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} style={{ background: "none", border: "none", color: "#d1fae5", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div style={{ background: "#991b1b", color: "#fee2e2", padding: "0.85rem 1.25rem", borderRadius: "6px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#fee2e2", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: "1 1 300px", maxWidth: "480px" }}>
          <input
            type="text"
            placeholder="Search by reference, name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: "#0f172a",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          />
          <button type="submit" className="btn-stitch-primary" style={{ padding: "0.5rem 1rem", fontSize: "13px" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <option value="all">All Enquiry Types</option>
            <option value="contact_general">General Contact</option>
            <option value="contact_design">CAD Design</option>
            <option value="contact_idea">Idea / Concept</option>
            <option value="build_your_own_drone">Build Your Own Drone</option>
            <option value="cart_enquiry">Cart Hardware Quotation</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <option value="all">All Delivery Statuses</option>
            <option value="SENT">Delivered (Sent)</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table List View */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          Loading customer enquiries...
        </div>
      ) : enquiries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#1e293b", borderRadius: "8px", color: "#94a3b8", border: "1px solid #334155" }}>
          No enquiries found matching the selected criteria.
        </div>
      ) : (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px", color: "#f8fafc" }}>
              <thead>
                <tr style={{ background: "#0f172a", borderBottom: "1px solid #334155", color: "#94a3b8", textTransform: "uppercase", fontSize: "11px" }}>
                  <th style={{ padding: "12px 16px" }}>Reference</th>
                  <th style={{ padding: "12px 16px" }}>Type</th>
                  <th style={{ padding: "12px 16px" }}>Customer</th>
                  <th style={{ padding: "12px 16px" }}>Submitted At</th>
                  <th style={{ padding: "12px 16px" }}>Files</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    style={{ borderBottom: "1px solid #334155", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#243248")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setSelectedEnquiry(enquiry)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#38bdf8",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          textDecoration: "underline",
                        }}
                      >
                        {enquiry.reference}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{formatTypeBadge(enquiry.enquiryType)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{enquiry.customerName}</div>
                      <div style={{ color: "#94a3b8", fontSize: "12px" }}>{enquiry.customerEmail}</div>
                      {enquiry.customerPhone && (
                        <div style={{ color: "#64748b", fontSize: "11px" }}>{enquiry.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                      {new Date(enquiry.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {enquiry.attachments && enquiry.attachments.length > 0 ? (
                        <span style={{ color: "#38bdf8", fontWeight: 600 }}>
                          📎 {enquiry.attachments.length}
                        </span>
                      ) : (
                        <span style={{ color: "#64748b" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{formatStatusBadge(enquiry.deliveryStatus)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => setSelectedEnquiry(enquiry)}
                          className="btn-stitch-ghost"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          title="View Details"
                        >
                          View 👁️
                        </button>
                        {enquiry.deliveryStatus !== "SENT" && (
                          <button
                            onClick={() => handleRetry(enquiry)}
                            disabled={retryingId === enquiry.id}
                            className="btn-stitch-ghost"
                            style={{ padding: "4px 8px", fontSize: "12px", color: "#f59e0b", borderColor: "#f59e0b" }}
                            title="Retry Email Delivery"
                          >
                            {retryingId === enquiry.id ? "Retrying..." : "Retry 🔄"}
                          </button>
                        )}
                        <button
                          onClick={() => initiateDelete(enquiry)}
                          className="btn-stitch-ghost"
                          style={{ padding: "4px 8px", fontSize: "12px", color: "#f43f5e", borderColor: "#f43f5e" }}
                          title="Delete Enquiry"
                        >
                          Delete 🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem",
          }}
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "10px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              color: "#f8fafc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "monospace", color: "#38bdf8" }}>
                  #{selectedEnquiry.reference}
                </span>
                {formatTypeBadge(selectedEnquiry.enquiryType)}
                {formatStatusBadge(selectedEnquiry.deliveryStatus)}
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.5rem" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem" }}>
              {/* Delivery Warning Banner if failed */}
              {selectedEnquiry.deliveryStatus === "FAILED" && (
                <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: "6px", padding: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#fca5a5" }}>Email Delivery Failed:</strong>
                    <div style={{ color: "#fecaca", fontSize: "12px", marginTop: "2px" }}>
                      {selectedEnquiry.deliveryError || "Resend rejected transmission or connection timed out."}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRetry(selectedEnquiry)}
                    disabled={retryingId === selectedEnquiry.id}
                    className="btn-stitch-primary"
                    style={{ fontSize: "12px", padding: "6px 12px", flexShrink: 0 }}
                  >
                    {retryingId === selectedEnquiry.id ? "Retrying..." : "Retry Email Now 🔄"}
                  </button>
                </div>
              )}

              {/* Customer Profile Grid */}
              <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                  Customer Profile
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "13px" }}>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Name:</span> <strong>{selectedEnquiry.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Email:</span> <a href={`mailto:${selectedEnquiry.customerEmail}`} style={{ color: "#38bdf8" }}>{selectedEnquiry.customerEmail}</a>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Phone:</span> {selectedEnquiry.customerPhone || "Not provided"}
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Date:</span> {new Date(selectedEnquiry.createdAt).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Form Specifications */}
              {selectedEnquiry.specifications && Object.keys(selectedEnquiry.specifications).length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                    Form Specifications &amp; Parameters
                  </div>
                  <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <tbody>
                        {Object.entries(selectedEnquiry.specifications).map(([k, v]) => (
                          <tr key={k} style={{ borderBottom: "1px solid #1e293b" }}>
                            <td style={{ padding: "8px 12px", color: "#94a3b8", width: "40%", fontWeight: 600 }}>
                              {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                            </td>
                            <td style={{ padding: "8px 12px", color: "#f8fafc", fontWeight: 500 }}>
                              {String(v)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cart Product Items */}
              {selectedEnquiry.productItems && selectedEnquiry.productItems.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                    Quoted Hardware Components ({selectedEnquiry.totalItems} items)
                  </div>
                  <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>
                          <th style={{ padding: "8px 12px" }}>Product</th>
                          <th style={{ padding: "8px 12px", textAlign: "center" }}>Qty</th>
                          <th style={{ padding: "8px 12px", textAlign: "right" }}>Unit Price</th>
                          <th style={{ padding: "8px 12px", textAlign: "right" }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEnquiry.productItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #1e293b" }}>
                            <td style={{ padding: "8px 12px" }}>
                              <div style={{ fontWeight: 600 }}>{item.productName}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>ID: #{item.productId} · {item.productType}</div>
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", color: "#94a3b8" }}>₹{Number(item.price || 0).toLocaleString("en-IN")}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#e52b31" }}>₹{Number(item.subtotal || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedEnquiry.indicativeTotal > 0 && (
                      <div style={{ padding: "10px 12px", textAlign: "right", background: "#162032", borderTop: "1px solid #334155" }}>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Indicative Material Value: </span>
                        <strong style={{ fontSize: "15px", color: "#e52b31" }}>₹{Number(selectedEnquiry.indicativeTotal).toLocaleString("en-IN")}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedEnquiry.message && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                    Customer Message &amp; Notes
                  </div>
                  <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", padding: "1rem", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "13px" }}>
                    {selectedEnquiry.message}
                  </div>
                </div>
              )}

              {/* Attachments List */}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                  Attachments ({selectedEnquiry.attachments?.length || 0})
                </div>
                {!selectedEnquiry.attachments || selectedEnquiry.attachments.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: "13px" }}>No attachments submitted with this enquiry.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {selectedEnquiry.attachments.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "6px",
                          padding: "0.75rem 1rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>{att.filename}</div>
                          <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                            {(att.fileSize / 1024 / 1024).toFixed(2)} MB · {att.contentType}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(selectedEnquiry.id, att)}
                          className="btn-stitch-primary"
                          style={{ fontSize: "12px", padding: "4px 10px" }}
                        >
                          Download ⬇️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => {
                  initiateDelete(selectedEnquiry);
                }}
                className="btn-stitch-ghost"
                style={{ color: "#f43f5e", borderColor: "#f43f5e", fontSize: "12px" }}
              >
                Delete Enquiry 🗑️
              </button>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {selectedEnquiry.deliveryStatus !== "SENT" && (
                  <button
                    onClick={() => handleRetry(selectedEnquiry)}
                    disabled={retryingId === selectedEnquiry.id}
                    className="btn-stitch-ghost"
                    style={{ color: "#f59e0b", borderColor: "#f59e0b", fontSize: "12px" }}
                  >
                    {retryingId === selectedEnquiry.id ? "Retrying..." : "Retry Email 🔄"}
                  </button>
                )}
                <button onClick={() => setSelectedEnquiry(null)} className="btn-stitch-ghost" style={{ fontSize: "12px" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Step Deletion Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1.5rem",
          }}
          onClick={cancelDelete}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #dc2626",
              borderRadius: "10px",
              maxWidth: "520px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              color: "#f8fafc",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>⚠️</div>

            {deleteStep === 1 ? (
              <>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f87171", marginBottom: "0.5rem" }}>
                  Step 1: Delete Enquiry #{deleteTarget.reference}?
                </h2>
                <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  You are about to delete the enquiry from <strong>{deleteTarget.customerName}</strong> ({deleteTarget.customerEmail}).
                  <br />
                  <span style={{ color: "#fca5a5", fontWeight: 600 }}>
                    This action is destructive and irreversible. All form specifications, messages, and retained attachment files will be permanently erased.
                  </span>
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <button
                    onClick={cancelDelete}
                    className="btn-stitch-ghost"
                    style={{ padding: "0.6rem 1.25rem", fontSize: "13px" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStep1}
                    className="btn-stitch-primary"
                    style={{ background: "#dc2626", borderColor: "#dc2626", padding: "0.6rem 1.25rem", fontSize: "13px" }}
                  >
                    Proceed to Confirmation →
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ef4444", marginBottom: "0.5rem" }}>
                  Step 2: Confirm Permanent Deletion
                </h2>
                <p style={{ color: "#fecaca", fontSize: "14px", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  Please confirm that you want to permanently purge <strong>#{deleteTarget.reference}</strong> from the database.
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <button
                    onClick={cancelDelete}
                    disabled={deleting}
                    className="btn-stitch-ghost"
                    style={{ padding: "0.6rem 1.25rem", fontSize: "13px" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeFinalDelete}
                    disabled={deleting}
                    className="btn-stitch-primary"
                    style={{ background: "#991b1b", borderColor: "#991b1b", padding: "0.6rem 1.5rem", fontSize: "13px", fontWeight: 700 }}
                  >
                    {deleting ? "Purging Record..." : "Yes, Permanently Delete Now 🗑️"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryManagement;
