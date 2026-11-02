import React from "react";

/**
 * ProductDetailSkeleton
 *
 * Content-matched blueprint skeleton for /products/[id] pages.
 * Accurately replicates the 2-column CAD gallery + specification layout,
 * breadcrumbs, purchasing actions, and technical documentation table.
 */
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div
      className="product-detail-page-container product-detail-skeleton-wrap"
      role="status"
      aria-busy="true"
      aria-label="Loading DronesZ hardware specifications"
      style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
    >
      {/* ── 1. Breadcrumb Navigation Skeleton ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div className="dronesz-skeleton" style={{ height: "14px", width: "50px", borderRadius: "3px" }} />
        <span style={{ color: "#cbd5e1" }}>/</span>
        <div className="dronesz-skeleton" style={{ height: "14px", width: "110px", borderRadius: "3px" }} />
        <span style={{ color: "#cbd5e1" }}>/</span>
        <div className="dronesz-skeleton" style={{ height: "14px", width: "100px", borderRadius: "3px" }} />
        <span style={{ color: "#cbd5e1" }}>/</span>
        <div className="dronesz-skeleton" style={{ height: "14px", width: "160px", borderRadius: "3px" }} />
      </nav>

      {/* ── 2. Primary 2-Column Responsive Blueprint & Spec Layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "clamp(1.5rem, 3vw, 3rem)",
          alignItems: "start",
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* Left Column: CAD Showcase Stage */}
        <div style={{ width: "100%", minWidth: 0 }}>
          {/* Main Showcase Stage */}
          <div
            className="product-skeleton-blueprint dronesz-skeleton"
            style={{
              width: "100%",
              aspectRatio: "4/3",
              minHeight: "360px",
              borderRadius: "8px",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "2px solid rgba(229, 43, 49, 0.2)",
                opacity: 0.7,
              }}
            />
          </div>

          {/* 4 Thumbnail Placeholders */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.75rem",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`thumb-skel-${i}`}
                className="dronesz-skeleton"
                style={{
                  height: "56px",
                  borderRadius: "6px",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Spec Metadata, Pricing & Order Execution */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", minWidth: 0 }}>
          {/* Badge & Class Line */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <div
              className="dronesz-skeleton"
              style={{ height: "20px", width: "115px", borderRadius: "4px" }}
            />
            <div
              className="dronesz-skeleton"
              style={{ height: "14px", width: "160px", borderRadius: "3px" }}
            />
          </div>

          {/* Title */}
          <div
            className="dronesz-skeleton"
            style={{ height: "38px", width: "85%", marginBottom: "0.6rem", borderRadius: "6px" }}
          />

          {/* SKU / Spec bar */}
          <div
            className="dronesz-skeleton"
            style={{ height: "14px", width: "50%", marginBottom: "1.75rem", borderRadius: "3px" }}
          />

          {/* Big Price Display */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
              <div
                className="dronesz-skeleton"
                style={{ height: "36px", width: "140px", borderRadius: "6px" }}
              />
              <div
                className="dronesz-skeleton"
                style={{ height: "16px", width: "80px", borderRadius: "3px" }}
              />
            </div>
            <div
              className="dronesz-skeleton"
              style={{ height: "12px", width: "180px", marginTop: "0.5rem", borderRadius: "3px" }}
            />
          </div>

          {/* Package Selector Skeleton */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div
              className="dronesz-skeleton"
              style={{ height: "42px", flex: 1, borderRadius: "6px" }}
            />
            <div
              className="dronesz-skeleton"
              style={{ height: "42px", flex: 1, borderRadius: "6px" }}
            />
          </div>

          {/* Action Buttons: Add to Cart + Enquire */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <div
              className="dronesz-skeleton"
              style={{ height: "46px", flex: "1 1 180px", borderRadius: "6px" }}
            />
            <div
              className="dronesz-skeleton"
              style={{ height: "46px", flex: "1 1 180px", borderRadius: "6px" }}
            />
          </div>

          {/* Key Specs Highlights Box */}
          <div
            style={{
              padding: "1.25rem",
              background: "#ffffff",
              border: "1px solid var(--color-outline, rgba(15, 23, 42, 0.08))",
              borderRadius: "8px",
            }}
          >
            <div
              className="dronesz-skeleton"
              style={{ height: "16px", width: "40%", marginBottom: "1rem" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[1, 2, 3, 4].map((s) => (
                <div key={`spec-box-skel-${s}`}>
                  <div
                    className="dronesz-skeleton"
                    style={{ height: "12px", width: "60%", marginBottom: "0.3rem" }}
                  />
                  <div
                    className="dronesz-skeleton"
                    style={{ height: "16px", width: "85%" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Below Fold: Detailed Specifications Panel ── */}
      <div style={{ marginTop: "2.5rem" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--color-outline, rgba(15, 23, 42, 0.08))",
            borderRadius: "8px",
            padding: "2rem",
          }}
        >
          <div
            className="dronesz-skeleton"
            style={{ height: "24px", width: "160px", marginBottom: "1.25rem" }}
          />
          <div
            className="dronesz-skeleton"
            style={{ height: "14px", width: "95%", marginBottom: "0.5rem" }}
          />
          <div
            className="dronesz-skeleton"
            style={{ height: "14px", width: "88%", marginBottom: "1.5rem" }}
          />

          {/* Spec Table Rows */}
          {[1, 2, 3].map((r) => (
            <div
              key={`table-row-skel-${r}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.75rem 0",
                borderTop: "1px solid rgba(15, 23, 42, 0.06)",
              }}
            >
              <div className="dronesz-skeleton" style={{ height: "14px", width: "30%" }} />
              <div className="dronesz-skeleton" style={{ height: "14px", width: "45%" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

