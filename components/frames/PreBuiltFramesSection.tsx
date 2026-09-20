import { FrameDossierPanel } from "./FrameDossierPanel";
import { FRAME_STORIES } from "@/data/frames";
import { FRAME_CALLOUTS } from "@/data/frame-callouts";

/**
 * Pre-built frames as engineering-dossier panels: each real exploded flat-lay is a specimen with
 * annotation callouts that draw on scroll (see FrameDossierPanel). `#frames-section` is the nav
 * "Frames" scrollTo target. refreshPriority strictly decreases down the page (Hero=100 above) so
 * stacked pins refresh top-first and don't engage at stale offsets (ScrollSection / ADR-1).
 */
export function PreBuiltFramesSection() {
  return (
    <div id="frames-section">
      {FRAME_STORIES.map((story, i) => (
        <FrameDossierPanel
          key={story.id}
          story={story}
          callouts={FRAME_CALLOUTS[story.id] ?? []}
          priority={i === 0}
          refreshPriority={90 - i * 10}
        />
      ))}
    </div>
  );
}
