import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Social link-preview card (Open Graph + Twitter). Rendered once at build via next/og.
 * Brand-consistent dark "void" background with the red drone mark, the DronesZ wordmark
 * (red Z accent), and the tagline — so a shared link reads as intentional, not a bare URL.
 * Kept font-free (system weights) so generation never depends on a font fetch; the mark +
 * red accent carry the brand.
 */
export const alt = "DronesZ India — Redefining Flight. Assembling the Future.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VOID = "#0B0B0E";
const RED = "#EB0704";
const INK = "#FAFAFA";

export default function OpengraphImage() {
  // Embed the mark as a data URI — satori can't resolve app-relative paths at render time.
  const mark = readFileSync(join(process.cwd(), "public/brand/drone-mark.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: VOID,
        padding: "80px",
        // Faint red horizon so the void isn't dead-flat — echoes the site's hero scrim.
        backgroundImage: `radial-gradient(120% 80% at 50% 130%, rgba(235,7,4,0.22), transparent 60%)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markSrc} width={96} height={96} alt="" />
        <span style={{ fontSize: 64, fontWeight: 700, color: INK }}>
          Drones<span style={{ color: RED }}>Z</span>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <span
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.05,
          }}
        >
          Redefining Flight.
        </span>
        <span
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: RED,
            lineHeight: 1.05,
          }}
        >
          Assembling the Future.
        </span>
        <span style={{ fontSize: 30, color: "#9A9AA2", marginTop: "12px" }}>
          Custom airframes · Counter-UAS · Engineered in Indore
        </span>
      </div>
    </div>,
    { ...size },
  );
}
