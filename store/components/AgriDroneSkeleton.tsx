import React from "react";

/**
 * AgriDroneSkeleton
 * 
 * Skeletons for Agricultural Spraying Drone and high-spec UAV pages.
 * Replicates the hero badge, headline, dual CTAs, metric chips,
 * and technical specification table.
 */
export const AgriDroneSkeleton: React.FC = () => {
  return (
    <div
      className="agri-drone-skeleton-wrap"
      role="status"
      aria-busy="true"
      aria-label="Loading agricultural drone specifications"
      style={{ width: "100%", background: "#ffffff" }}
    >
      {/* ── Breadcrumb Strip ── */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="dronesz-skeleton" style={{ height: "14px", width: "45px" }} />
          <span style={{ color: "#94a3b8" }}>/</span>
          <div className="dronesz-skeleton" style={{ height: "14px", width: "180px" }} />
        </div>
      </div>

      {/* ── Hero Section ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: "2.5rem", alignItems: "center" }}>
          <div>
            <div className="dronesz-skeleton" style={{ height: "24px", width: "160px", marginBottom: "1rem" }} />
            <div className="dronesz-skeleton" style={{ height: "42px", width: "90%", marginBottom: "0.75rem" }} />
            <div className="dronesz-skeleton" style={{ height: "20px", width: "65%", marginBottom: "1rem" }} />
            <div className="dronesz-skeleton" style={{ height: "14px", width: "95%", marginBottom: "0.5rem" }} />
            <div className="dronesz-skeleton" style={{ height: "14px", width: "80%", marginBottom: "1.75rem" }} />

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <div className="dronesz-skeleton" style={{ height: "48px", width: "220px", borderRadius: "6px" }} />
              <div className="dronesz-skeleton" style={{ height: "48px", width: "180px", borderRadius: "6px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[1, 2, 3, 4].map((m) => (
                <div key={`agri-meta-${m}`} style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div className="dronesz-skeleton" style={{ height: "12px", width: "40%", marginBottom: "0.3rem" }} />
                  <div className="dronesz-skeleton" style={{ height: "16px", width: "80%" }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="dronesz-skeleton" style={{ aspectRatio: "16/10", width: "100%", borderRadius: "12px", minHeight: "320px" }} />
          </div>
        </div>
      </section>

      {/* ── Technical Specs Grid ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem 3rem" }}>
        <div className="dronesz-skeleton" style={{ height: "28px", width: "240px", marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={`spec-box-${row}`} style={{ padding: "1.25rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div className="dronesz-skeleton" style={{ height: "14px", width: "50%", marginBottom: "0.5rem" }} />
              <div className="dronesz-skeleton" style={{ height: "18px", width: "85%" }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

