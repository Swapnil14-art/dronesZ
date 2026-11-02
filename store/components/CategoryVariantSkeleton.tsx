import React from "react";

/**
 * CategoryVariantSkeleton
 *
 * Grid skeleton matching .stitch-product-card layout for category series views
 * and child variant listings in PublicStore.tsx.
 */
export const CategoryVariantSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading series variants"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
        gap: "1.5rem",
        width: "100%",
        marginBottom: "2rem",
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={`variant-skel-${i}`}
          style={{
            background: "#ffffff",
            border: "1px solid var(--color-outline, rgba(15, 23, 42, 0.08))",
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Media stage */}
          <div
            className="dronesz-skeleton"
            style={{
              position: "relative",
              aspectRatio: "16/10",
              background: "#f8fafc",
              borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                width: "80px",
                height: "18px",
                borderRadius: "3px",
                background: "rgba(255, 255, 255, 0.75)",
              }}
            />
          </div>

          {/* Details */}
          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div
              className="dronesz-skeleton"
              style={{ height: "20px", width: "75%", marginBottom: "0.5rem" }}
            />
            <div
              className="dronesz-skeleton"
              style={{ height: "13px", width: "45%", marginBottom: "1.25rem" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
              <div
                className="dronesz-skeleton"
                style={{ height: "22px", width: "80px" }}
              />
              <div
                className="dronesz-skeleton"
                style={{ height: "34px", width: "95px", borderRadius: "4px" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

