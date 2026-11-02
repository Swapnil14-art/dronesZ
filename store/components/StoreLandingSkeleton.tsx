import React from "react";

/**
 * StoreLandingSkeleton
 * 
 * Accurately mirrors the grid layout, card dimensions, and responsive breakpoints
 * of StoreLandingCatalog.tsx to eliminate layout shift during initial data loading.
 */
export const StoreLandingSkeleton: React.FC = () => {
  return (
    <div
      className="store-landing-skeleton-wrap"
      role="status"
      aria-busy="true"
      aria-label="Loading hardware catalog"
      style={{ width: "100%", marginBottom: "2rem" }}
    >
      {/* ── 1. Flagship Series Cards Grid Skeleton (3 columns) ── */}
      <div className="store-landing__series-grid" style={{ marginBottom: "2.5rem" }}>
        {[1, 2, 3].map((idx) => (
          <div key={`series-skel-${idx}`} className="store-skeleton-card">
            {/* Thumbnail Area */}
            <div className="store-skeleton-card__thumb dronesz-skeleton" style={{ width: "100%", height: "100%" }}>
              <div
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  left: "0.75rem",
                  width: "90px",
                  height: "20px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.7)",
                }}
              />
            </div>

            {/* Body */}
            <div className="store-skeleton-card__body">
              <div
                className="dronesz-skeleton"
                style={{ height: "24px", width: idx === 1 ? "75%" : idx === 2 ? "65%" : "80%", marginBottom: "0.6rem" }}
              />
              <div
                className="dronesz-skeleton"
                style={{ height: "14px", width: "95%", marginBottom: "0.4rem" }}
              />
              <div
                className="dronesz-skeleton"
                style={{ height: "14px", width: "70%", marginBottom: "1.25rem" }}
              />

              {/* Footer */}
              <div className="store-skeleton-card__footer">
                <div
                  className="dronesz-skeleton"
                  style={{ height: "16px", width: "110px", borderRadius: "4px" }}
                />
                <div
                  className="dronesz-skeleton"
                  style={{ height: "16px", width: "85px", borderRadius: "4px" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. Hardware Components Section Skeleton (4 items) ── */}
      <div style={{ marginTop: "1rem" }}>
        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div
            className="dronesz-skeleton"
            style={{ height: "24px", width: "240px", borderRadius: "4px" }}
          />
          <div
            className="dronesz-skeleton"
            style={{ height: "16px", width: "80px", borderRadius: "4px" }}
          />
        </div>

        {/* Hardware Grid */}
        <div className="store-landing__hardware-grid">
          {[1, 2, 3, 4].map((idx) => (
            <div key={`hw-skel-${idx}`} className="store-skeleton-hw">
              <div className="store-skeleton-hw__media dronesz-skeleton" />
              <div className="store-skeleton-hw__body">
                <div
                  className="dronesz-skeleton"
                  style={{ height: "16px", width: "85%", marginBottom: "0.4rem" }}
                />
                <div
                  className="dronesz-skeleton"
                  style={{ height: "12px", width: "45%", marginBottom: "0.75rem" }}
                />
                <div
                  className="dronesz-skeleton"
                  style={{ height: "18px", width: "40%", marginTop: "auto" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

