"use client";

import { useEffect, useRef, useState } from "react";
import "./manufacturing.css";

interface Stage {
  id: string;
  number: string;
  action: string;
  phase: string;
  title: string;
  desc: string;
  image: string;
  side: "left" | "right";
}

const STAGES: Stage[] = [
  {
    id: "stage-1",
    number: "01",
    action: "YOU DEFINE",
    phase: "Phase 01 / Discovery",
    title: "YOUR VISION. OUR STARTING POINT.",
    desc: "Every great drone begins with an idea. Define your requirements, mission, and vision, and let us understand what you want to build.",
    image: "/manufacturing/stage-1-hd.jpg",
    side: "left",
  },
  {
    id: "stage-2",
    number: "02",
    action: "WE ENGINEER",
    phase: "Phase 02 / Design",
    title: "ENGINEERING YOUR VISION",
    desc: "Our engineering team transforms your requirements into a practical drone design through thoughtful engineering, component selection, and technical planning.",
    image: "/manufacturing/stage-2-hd.jpg",
    side: "right",
  },
  {
    id: "stage-3",
    number: "03",
    action: "WE PROTOTYPE",
    phase: "Phase 03 / Iteration",
    title: "FROM DESIGN TO REALITY",
    desc: "We bring the design to life through prototyping, integration, and refinement. Each iteration helps us develop a drone that meets the intended requirements.",
    image: "/manufacturing/stage-3.webp",
    side: "left",
  },
  {
    id: "stage-4",
    number: "04",
    action: "WE MANUFACTURE",
    phase: "Phase 04 / Build",
    title: "BUILT TO TAKE FLIGHT",
    desc: "Once the design is ready, we manufacture and assemble the drone with precision, bringing together the components and engineering that turn your vision into a flight-ready machine.",
    image: "/manufacturing/stage-4.webp",
    side: "right",
  },
];

export function ManufacturingProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [svgPath, setSvgPath] = useState<string>("");
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 1200,
  });

  const updatePath = () => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const width = cRect.width;
    const height = cRect.height;
    setSvgDimensions({ width, height });

    const nodes = nodeRefs.current.filter((n): n is HTMLDivElement => !!n);
    if (nodes.length < 2) return;

    const points = nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - cRect.left,
        y: rect.top + rect.height / 2 - cRect.top,
      };
    });

    // Generate smooth curvy S-spline path connecting top loop -> nodes -> bottom loop
    const p1 = points[0];
    const p2 = points[1];
    const p3 = points[2];
    const p4 = points[3];

    if (!p1 || !p2 || !p3 || !p4) return;

    // S-curve sweep depth tailored to container width
    const sweep = Math.min(130, Math.max(75, width * 0.11));

    let path = "";

    if (width > 860) {
      // Top entrance swooping down into Node 01 from top-right
      const startX = p1.x + sweep * 0.85;
      const startY = Math.max(0, p1.y - 130);
      path = `M ${startX} ${startY}`;
      path += ` C ${startX - sweep * 0.3} ${p1.y - 75}, ${p1.x + 15} ${p1.y - 35}, ${p1.x} ${p1.y}`;

      // 01 -> 02: Sweeping outward to the right, deep graceful S-curve down into Node 02
      const dy1 = p2.y - p1.y;
      const cp1_x = p1.x + sweep * 1.15;
      const cp1_y = p1.y + dy1 * 0.32;
      const cp2_x = p2.x + sweep * 0.95;
      const cp2_y = p1.y + dy1 * 0.72;
      path += ` C ${cp1_x} ${cp1_y}, ${cp2_x} ${cp2_y}, ${p2.x} ${p2.y}`;

      // 02 -> 03: Sweeping outward to the left, deep graceful S-curve down into Node 03
      const dy2 = p3.y - p2.y;
      const cp3_x = p2.x - sweep * 1.15;
      const cp3_y = p2.y + dy2 * 0.32;
      const cp4_x = p3.x - sweep * 0.95;
      const cp4_y = p2.y + dy2 * 0.72;
      path += ` C ${cp3_x} ${cp3_y}, ${cp4_x} ${cp4_y}, ${p3.x} ${p3.y}`;

      // 03 -> 04: Sweeping outward to the right, deep graceful S-curve down into Node 04
      const dy3 = p4.y - p3.y;
      const cp5_x = p3.x + sweep * 1.15;
      const cp5_y = p3.y + dy3 * 0.32;
      const cp6_x = p4.x + sweep * 0.95;
      const cp6_y = p3.y + dy3 * 0.72;
      path += ` C ${cp5_x} ${cp5_y}, ${cp6_x} ${cp6_y}, ${p4.x} ${p4.y}`;

      // Exit curve trailing off from Node 04 down and to the left
      const exitEndX = p4.x - sweep * 1.1;
      const exitEndY = p4.y + 140;
      path += ` C ${p4.x - sweep * 0.6} ${p4.y + 60}, ${exitEndX + 25} ${exitEndY - 35}, ${exitEndX} ${exitEndY}`;
    } else {
      // Mobile: Smooth vertical wave connecting vertically stacked nodes
      const startY = Math.max(0, p1.y - 60);
      path = `M ${p1.x} ${startY}`;
      path += ` L ${p1.x} ${p1.y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const midY = (curr.y + next.y) / 2;
        path += ` C ${curr.x + 30} ${midY - 20}, ${next.x - 30} ${midY + 20}, ${next.x} ${next.y}`;
      }

      path += ` C ${p4.x + 20} ${p4.y + 40}, ${p4.x - 20} ${p4.y + 80}, ${p4.x} ${p4.y + 100}`;
    }

    setSvgPath(path);
  };

  useEffect(() => {
    updatePath();
    const handleResize = () => updatePath();
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => updatePath());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Delay a frame for image/font layout settlement
    const t = setTimeout(updatePath, 200);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <section
      id="manufacturing"
      className="manufacturing-section"
      aria-labelledby="manufacturing-title"
    >
      <div className="manufacturing-container">
        {/* Section Header */}
        <div className="manufacturing-header">
          <div className="manufacturing-header__watermark" aria-hidden="true">
            02
          </div>
          <div className="manufacturing-header__content">
            <span className="manufacturing-header__eyebrow">
              The Making of a Drone
            </span>
            <h2 id="manufacturing-title" className="manufacturing-header__title">
              From Components to Flight
            </h2>
            <p className="manufacturing-header__lead">
              Every DronesZ drone is built through a precise journey of engineering, assembly, and
              testing. Explore the process behind every flight-ready machine.
            </p>
          </div>
          <div className="manufacturing-header__divider" aria-hidden="true" />
        </div>

        {/* Timeline & Cards Layout */}
        <div ref={containerRef} className="manufacturing-timeline-wrap">
          {/* Dynamic SVG Curve connecting nodes */}
          <svg
            className="manufacturing-svg-layer"
            viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
            style={{ width: "100%", height: "100%" }}
            aria-hidden="true"
          >
            {svgPath && <path d={svgPath} className="manufacturing-curve-path" />}
          </svg>

          {/* Cards Grid */}
          <div className="manufacturing-grid">
            {STAGES.map((stage, idx) => (
              <article
                key={stage.id}
                className={`m-card m-card--${stage.side}`}
                aria-label={`Phase ${stage.number}: ${stage.title}`}
              >
                {/* Node on Timeline */}
                <div
                  ref={(el) => {
                    nodeRefs.current[idx] = el;
                  }}
                  className="m-node"
                  aria-hidden="true"
                >
                  {stage.number}
                </div>

                {/* Card Media */}
                <div className="m-card__media">
                  <img
                    src={stage.image}
                    alt={stage.title}
                    className="m-card__img"
                    loading="lazy"
                  />
                </div>

                {/* Card Content */}
                <div className="m-card__body">
                  <div className="m-card__meta">
                    <span className="m-card__action">{stage.action}</span>
                    <span className="m-card__phase">{stage.phase}</span>
                  </div>
                  <h3 className="m-card__title">{stage.title}</h3>
                  <p className="m-card__desc">{stage.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
