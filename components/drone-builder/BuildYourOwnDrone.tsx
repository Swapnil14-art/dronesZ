"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./drone-builder.css";

export type DroneType = "quad-hex" | "vtol" | "fixed-wing";
export type VideoTransmission = "analog" | "digital-hd" | "cofdm";
export type VideoSetup = "daylight" | "day-night-thermal" | "multispectral-lidar" | "custom-mount";

interface DroneTypeOption {
  id: DroneType;
  name: string;
  badge: string;
  description: string;
  iconSvg: React.ReactNode;
}

const DRONE_TYPES: DroneTypeOption[] = [
  {
    id: "quad-hex",
    name: "Quad / Hexacopter",
    badge: "Heavy Lift · Multirotor",
    description: "Multi-rotor propulsion designed for precision stationary hovering, high payload capacity, and aggressive wind resistance.",
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        <circle cx="12" cy="2" r="1.5" />
        <circle cx="12" cy="22" r="1.5" />
        <circle cx="2" cy="12" r="1.5" />
        <circle cx="22" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    id: "vtol",
    name: "VTOL Platform",
    badge: "Hybrid Wing · Runway-Free",
    description: "Vertical multi-rotor takeoff combined with high-speed aerodynamic fixed-wing cruise for maximum BVLOS coverage.",
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4 20l8-4 8 4L12 2z" />
        <path d="M12 2v14" />
      </svg>
    ),
  },
  {
    id: "fixed-wing",
    name: "Fixed-Wing",
    badge: "Max Loiter · Long Range",
    description: "High-aspect-ratio carbon composite airframe optimized for prolonged surveillance loiter times and large-scale corridor mapping.",
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h20" />
        <path d="M12 2v20" />
        <path d="M7 7l5 5 5-5" />
      </svg>
    ),
  },
];

const PAYLOAD_PRESETS = [
  { label: "0.5 kg (Micro)", value: 0.5 },
  { label: "1.5 kg (Sensor)", value: 1.5 },
  { label: "3.5 kg (Dual EO/IR)", value: 3.5 },
  { label: "5.0 kg (Heavy Lift)", value: 5.0 },
  { label: "10.0 kg (Industrial)", value: 10.0 },
  { label: "15.0+ kg (Transport)", value: 15.0 },
];

const RANGE_PRESETS = [
  { label: "5 km (VLOS)", value: 5 },
  { label: "10 km (Medium)", value: 10 },
  { label: "20 km (Extended)", value: 20 },
  { label: "35 km (BVLOS)", value: 35 },
  { label: "50+ km (Tactical Link)", value: 50 },
];

const FLIGHT_TIME_PRESETS = [
  { label: "20 mins", value: 20 },
  { label: "30 mins", value: 30 },
  { label: "45 mins", value: 45 },
  { label: "60 mins", value: 60 },
  { label: "90+ mins", value: 90 },
];

const ALTITUDE_PRESETS = [
  { label: "500 m AGL (Standard)", value: 500 },
  { label: "1,000 m AGL (Tactical)", value: 1000 },
  { label: "2,500 m AMSL (High-Relief)", value: 2500 },
  { label: "4,500+ m AMSL (Himalayan Spec)", value: 4500 },
];

const VIDEO_TRANSMISSION_OPTIONS = [
  {
    id: "analog" as VideoTransmission,
    name: "Analog FPV (5.8 GHz)",
    desc: "Zero-latency instantaneous analog feed, standard definition, maximum pilot reflex.",
  },
  {
    id: "digital-hd" as VideoTransmission,
    name: "Digital HD (Low-Latency)",
    desc: "1080p60 ultra-crisp downlink, digital noise rejection, secure telemetry stream.",
  },
  {
    id: "cofdm" as VideoTransmission,
    name: "Tactical COFDM / Dual-Link",
    desc: "Military-grade NLOS penetration, AES-encrypted high-bandwidth video & C2 telemetry.",
  },
];

const VIDEO_SETUP_OPTIONS = [
  {
    id: "daylight" as VideoSetup,
    name: "Daylight Optical (4K / 30x Zoom)",
    desc: "High-resolution optical daylight sensor for GIS, inspection, and visual tracking.",
  },
  {
    id: "day-night-thermal" as VideoSetup,
    name: "Day / Night Dual (EO + IR Thermal)",
    desc: "Radiometric 640x512 uncooled thermal core + daylight optical zoom with 360° stabilization.",
  },
  {
    id: "multispectral-lidar" as VideoSetup,
    name: "Multi-Spectral / LiDAR Mount",
    desc: "Calibrated vibration-damped bracket and power bus for precision survey sensors.",
  },
  {
    id: "custom-mount" as VideoSetup,
    name: "Client Sensor (Custom Damping Plate)",
    desc: "Universal payload dovetail interface — mount your own proprietary instruments.",
  },
];

const APPLICATION_OPTIONS = [
  "Agricultural Spraying & Precision Farming",
  "Border Surveillance & Tactical Reconnaissance",
  "Powerline, Pipeline & Industrial Asset Inspection",
  "GIS Photogrammetry, 3D Mapping & Mining Survey",
  "Emergency Medical & Cargo Logistics Transit",
  "Disaster Management & Search and Rescue (SAR)",
  "Custom Aerospace R&D & Prototype Lab",
];

export function BuildYourOwnDrone() {
  // Configuration state
  const [droneType, setDroneType] = useState<DroneType>("quad-hex");
  const [payload, setPayload] = useState<number>(5.0);
  const [range, setRange] = useState<number>(20);
  const [flightTime, setFlightTime] = useState<number>(45);
  const [altitude, setAltitude] = useState<number>(1000);
  const [videoTransmission, setVideoTransmission] = useState<VideoTransmission>("digital-hd");
  const [videoSetup, setVideoSetup] = useState<VideoSetup>("day-night-thermal");
  const [application, setApplication] = useState<string>("Industrial Infrastructure & Powerline Inspection");
  const [customNotes, setCustomNotes] = useState<string>("");

  // Customer contact state
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [honeypot, setHoneypot] = useState<string>("");

  // Submission state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Selected object labels for summary
  const selectedTypeObj = DRONE_TYPES.find((t) => t.id === droneType) || DRONE_TYPES[0];
  const selectedTxObj = VIDEO_TRANSMISSION_OPTIONS.find((v) => v.id === videoTransmission) || VIDEO_TRANSMISSION_OPTIONS[0];
  const selectedSetupObj = VIDEO_SETUP_OPTIONS.find((s) => s.id === videoSetup) || VIDEO_SETUP_OPTIONS[0];

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) {
      errors.phone = "Contact number is required";
    } else if (phone.trim().replace(/[\s()-]/g, "").length < 7) {
      errors.phone = "Please enter a valid contact phone number";
    }

    if (payload <= 0) errors.payload = "Payload must be greater than 0 kg";
    if (range <= 0) errors.range = "Range must be greater than 0 km";
    if (flightTime <= 0) errors.flightTime = "Flight time must be greater than 0 mins";
    if (altitude <= 0) errors.altitude = "Altitude must be greater than 0 m";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);

    if (!validate()) {
      const firstErrEl = document.querySelector(".drone-builder__field-error");
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Serialize full technical spec into structured message
      const messageBody = [
        "==================================================",
        "BESPOKE UAV BUILD ENQUIRY — DRONESZ INDIA",
        "==================================================",
        "",
        "--- 1. AIRFRAME & PROPULSION SPECIFICATIONS ---",
        `• Platform Type: ${selectedTypeObj.name} (${selectedTypeObj.badge})`,
        `• Payload Capacity: ${payload} kg`,
        `• Required Range: ${range} km`,
        `• Flight Time / Endurance: ${flightTime} mins`,
        `• Operating Altitude Ceiling: ${altitude} m AGL/AMSL`,
        "",
        "--- 2. AVIONICS & SENSOR SUITE ---",
        `• Video Transmission: ${selectedTxObj.name}`,
        `• Video / Sensor Setup: ${selectedSetupObj.name}`,
        `• Intended Application: ${application}`,
        "",
        "--- 3. CLIENT CREDENTIALS ---",
        `• Client Name: ${name.trim()}`,
        `• Email Address: ${email.trim()}`,
        `• Contact Number: ${phone.trim()}`,
        organization.trim() ? `• Organization / Agency: ${organization.trim()}` : null,
        city.trim() ? `• Target Location: ${city.trim()}` : null,
        "",
        "--- 4. DISPATCH ADVISORY ---",
        "• Production Lead Time: SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS (Acknowledged)",
        "",
        customNotes.trim() ? `--- 5. MISSION NOTES & CUSTOM REQUIREMENTS ---\n${customNotes.trim()}` : null,
        "==================================================",
      ]
        .filter(Boolean)
        .join("\n");

      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("email", email.trim());
      formData.set("phone", phone.trim());
      formData.set("path", "general");
      formData.set("message", messageBody);
      formData.set("_hp", honeypot);

      const res = await fetch("/api/custom-build", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit custom drone enquiry. Please try again.");
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="drone-builder">
        <div style={{ maxWidth: "800px", margin: "4rem auto 0", padding: "0 1.5rem" }}>
          <div className="drone-builder__success-box">
            <div className="drone-builder__success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="drone-builder__success-title">UAV Architecture Enquiry Received</h2>
            <p className="drone-builder__success-desc">
              Thank you, <strong>{name}</strong>. Your custom drone architecture specification has been forwarded to our aerospace engineering team at the Indore UAV lab. We will review your CAD/flight envelope and reply to <strong>{email}</strong> within 24 business hours.
            </p>

            <div className="drone-builder__shipping-banner" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
              <div className="drone-builder__shipping-left">
                <div className="drone-builder__shipping-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div className="drone-builder__shipping-title">
                    SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS
                  </div>
                  <p className="drone-builder__shipping-desc">
                    Your bespoke airframe and propulsion system will undergo structural carbon validation, stator winding balance tests, and bench qualification prior to dispatch.
                  </p>
                </div>
              </div>
            </div>

            <div className="drone-builder__success-specs">
              <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>Submitted Specification Summary:</div>
              <div>• <strong>Platform:</strong> {selectedTypeObj.name}</div>
              <div>• <strong>Payload Capacity:</strong> {payload} kg</div>
              <div>• <strong>Target Range:</strong> {range} km</div>
              <div>• <strong>Flight Time:</strong> {flightTime} minutes</div>
              <div>• <strong>Ceiling:</strong> {altitude} m AGL</div>
              <div>• <strong>Video Transmission:</strong> {selectedTxObj.name}</div>
              <div>• <strong>Sensor Package:</strong> {selectedSetupObj.name}</div>
              <div>• <strong>Intended Mission:</strong> {application}</div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="drone-builder__submit-btn"
                style={{ width: "auto", padding: "0.75rem 1.75rem" }}
                onClick={() => {
                  setIsSubmitted(false);
                  setName("");
                  setEmail("");
                  setPhone("");
                  setOrganization("");
                  setCustomNotes("");
                }}
              >
                Configure Another Architecture
              </button>
              <Link
                href="/store"
                className="btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Explore Hardware Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drone-builder">
      {/* ------------------------------------------------------------
          1. HERO HEADER
          ------------------------------------------------------------ */}
      <section className="drone-builder__hero">
        <div className="drone-builder__hero-grid" aria-hidden="true" />
        <div className="drone-builder__hero-aura drone-builder__hero-aura--saffron" aria-hidden="true" />
        <div className="drone-builder__hero-aura drone-builder__hero-aura--red" aria-hidden="true" />

        <div className="drone-builder__hero-inner">
          <div className="drone-builder__badge-row">
            <span className="drone-builder__tag">
              <span className="drone-builder__tag-pulse" aria-hidden="true" />
              <span>Bespoke UAV Engineering · Indore Lab</span>
            </span>
            <span className="drone-builder__tag" style={{ color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.3)" }}>
              <span>100% In-House R&amp;D</span>
            </span>
          </div>

          <h1 className="drone-builder__hero-title">
            Build Your Own <span className="accent">Drone</span>
          </h1>

          <p className="drone-builder__hero-lead">
            Configure custom multi-rotor, VTOL, or fixed-wing UAV architectures engineered for your exact operational envelope. Specify payload, range, flight endurance, and sensor payloads below.
          </p>

          <div className="drone-builder__hero-features">
            <div className="drone-builder__feat-item">
              <span className="drone-builder__feat-icon">✓</span>
              <span>Zero Import Dependency</span>
            </div>
            <div className="drone-builder__feat-item">
              <span className="drone-builder__feat-icon">✓</span>
              <span>High-Torque 12S Stators</span>
            </div>
            <div className="drone-builder__feat-item">
              <span className="drone-builder__feat-icon">✓</span>
              <span>CNC 3K Carbon Airframes</span>
            </div>
            <div className="drone-builder__feat-item">
              <span className="drone-builder__feat-icon">✓</span>
              <span>Autonomous Parachute Integration</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------
          2. WORKSPACE GRID: CONFIGURATOR + LIVE SUMMARY
          ------------------------------------------------------------ */}
      <div className="drone-builder__workspace">
        <form className="drone-builder__form-pane" onSubmit={handleSubmit} noValidate>
          {/* PROMINENT TASTEFUL SHIPPING ADVISORY NOTICE */}
          <div className="drone-builder__shipping-banner" role="status">
            <div className="drone-builder__shipping-left">
              <div className="drone-builder__shipping-icon-box" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <div className="drone-builder__shipping-title">
                  <span>SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS</span>
                  <span className="badge-highlight">Bench Flight Qualified</span>
                </div>
                <p className="drone-builder__shipping-desc">
                  Every custom UAV architecture is CNC milled, dynamically stator-balanced, and test-flown in Indore before flight-ready dispatch.
                </p>
              </div>
            </div>
            <div className="drone-builder__shipping-badge">
              <span>DISPATCH WINDOW</span>
              <span className="drone-builder__shipping-badge-val">8–9 DAYS</span>
            </div>
          </div>

          {/* STEP 1: DRONE TYPE */}
          <div className="drone-builder__card">
            <div className="drone-builder__card-header">
              <div>
                <span className="drone-builder__step-tag">Step 01 / Configuration</span>
                <h2 className="drone-builder__card-title">Airframe &amp; Platform Architecture</h2>
                <p className="drone-builder__card-desc">
                  Select the flight platform geometry tailored to your mission envelope.
                </p>
              </div>
            </div>

            <div className="drone-builder__type-grid">
              {DRONE_TYPES.map((type) => {
                const isSelected = droneType === type.id;
                return (
                  <div
                    key={type.id}
                    className={`drone-builder__type-card ${isSelected ? "drone-builder__type-card--selected" : ""}`}
                    onClick={() => setDroneType(type.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") setDroneType(type.id);
                    }}
                  >
                    <div className="drone-builder__type-top">
                      <div className="drone-builder__type-icon" aria-hidden="true">
                        {type.iconSvg}
                      </div>
                      <div className="drone-builder__type-radio" aria-hidden="true">
                        {isSelected && <div className="drone-builder__type-radio-dot" />}
                      </div>
                    </div>
                    <div className="drone-builder__type-name">{type.name}</div>
                    <span className="drone-builder__type-badge">{type.badge}</span>
                    <p className="drone-builder__type-desc">{type.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: FLIGHT PERFORMANCE SPECS */}
          <div className="drone-builder__card">
            <div className="drone-builder__card-header">
              <div>
                <span className="drone-builder__step-tag">Step 02 / Flight Specifications</span>
                <h2 className="drone-builder__card-title">Payload, Range &amp; Endurance</h2>
                <p className="drone-builder__card-desc">
                  Tune target payload capacity, flight endurance, and communications range.
                </p>
              </div>
            </div>

            {/* Payload Capacity */}
            <div className="drone-builder__spec-group">
              <div className="drone-builder__spec-label-row">
                <label htmlFor="payload-input" className="drone-builder__spec-label">
                  Payload Capacity
                  <span className="drone-builder__spec-unit">(kg)</span>
                </label>
                <div className="drone-builder__spec-current-val">{payload.toFixed(1)} kg</div>
              </div>

              <div className="drone-builder__preset-pills">
                {PAYLOAD_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`drone-builder__pill ${payload === p.value ? "drone-builder__pill--active" : ""}`}
                    onClick={() => setPayload(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="drone-builder__input-row">
                <input
                  id="payload-range"
                  type="range"
                  min="0.5"
                  max="25.0"
                  step="0.5"
                  value={payload}
                  onChange={(e) => setPayload(parseFloat(e.target.value) || 0.5)}
                  className="drone-builder__range-slider"
                  aria-label="Payload capacity slider"
                />
                <input
                  id="payload-input"
                  type="number"
                  min="0.1"
                  max="50.0"
                  step="0.1"
                  value={payload}
                  onChange={(e) => setPayload(parseFloat(e.target.value) || 0.5)}
                  className="drone-builder__num-input"
                />
              </div>
              {fieldErrors.payload && <div className="drone-builder__field-error">{fieldErrors.payload}</div>}
            </div>

            {/* Required Range */}
            <div className="drone-builder__spec-group">
              <div className="drone-builder__spec-label-row">
                <label htmlFor="range-input" className="drone-builder__spec-label">
                  Required Operational Range
                  <span className="drone-builder__spec-unit">(km)</span>
                </label>
                <div className="drone-builder__spec-current-val">{range} km</div>
              </div>

              <div className="drone-builder__preset-pills">
                {RANGE_PRESETS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`drone-builder__pill ${range === r.value ? "drone-builder__pill--active" : ""}`}
                    onClick={() => setRange(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="drone-builder__input-row">
                <input
                  id="range-slider"
                  type="range"
                  min="2"
                  max="80"
                  step="1"
                  value={range}
                  onChange={(e) => setRange(parseInt(e.target.value, 10) || 5)}
                  className="drone-builder__range-slider"
                  aria-label="Operational range slider"
                />
                <input
                  id="range-input"
                  type="number"
                  min="1"
                  max="150"
                  value={range}
                  onChange={(e) => setRange(parseInt(e.target.value, 10) || 5)}
                  className="drone-builder__num-input"
                />
              </div>
              {fieldErrors.range && <div className="drone-builder__field-error">{fieldErrors.range}</div>}
            </div>

            {/* Flight Time */}
            <div className="drone-builder__spec-group">
              <div className="drone-builder__spec-label-row">
                <label htmlFor="time-input" className="drone-builder__spec-label">
                  Target Flight Time / Endurance
                  <span className="drone-builder__spec-unit">(minutes)</span>
                </label>
                <div className="drone-builder__spec-current-val">{flightTime} mins</div>
              </div>

              <div className="drone-builder__preset-pills">
                {FLIGHT_TIME_PRESETS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`drone-builder__pill ${flightTime === t.value ? "drone-builder__pill--active" : ""}`}
                    onClick={() => setFlightTime(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="drone-builder__input-row">
                <input
                  id="time-slider"
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={flightTime}
                  onChange={(e) => setFlightTime(parseInt(e.target.value, 10) || 20)}
                  className="drone-builder__range-slider"
                  aria-label="Flight time slider"
                />
                <input
                  id="time-input"
                  type="number"
                  min="10"
                  max="240"
                  value={flightTime}
                  onChange={(e) => setFlightTime(parseInt(e.target.value, 10) || 20)}
                  className="drone-builder__num-input"
                />
              </div>
              {fieldErrors.flightTime && <div className="drone-builder__field-error">{fieldErrors.flightTime}</div>}
            </div>

            {/* Flying Altitude Ceiling */}
            <div className="drone-builder__spec-group">
              <div className="drone-builder__spec-label-row">
                <label htmlFor="alt-input" className="drone-builder__spec-label">
                  Flying Altitude Ceiling
                  <span className="drone-builder__spec-unit">(m AGL / AMSL)</span>
                </label>
                <div className="drone-builder__spec-current-val">{altitude} m</div>
              </div>

              <div className="drone-builder__preset-pills">
                {ALTITUDE_PRESETS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    className={`drone-builder__pill ${altitude === a.value ? "drone-builder__pill--active" : ""}`}
                    onClick={() => setAltitude(a.value)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="drone-builder__input-row">
                <input
                  id="alt-slider"
                  type="range"
                  min="200"
                  max="6000"
                  step="100"
                  value={altitude}
                  onChange={(e) => setAltitude(parseInt(e.target.value, 10) || 500)}
                  className="drone-builder__range-slider"
                  aria-label="Altitude ceiling slider"
                />
                <input
                  id="alt-input"
                  type="number"
                  min="100"
                  max="8000"
                  value={altitude}
                  onChange={(e) => setAltitude(parseInt(e.target.value, 10) || 500)}
                  className="drone-builder__num-input"
                />
              </div>
              {fieldErrors.altitude && <div className="drone-builder__field-error">{fieldErrors.altitude}</div>}
            </div>
          </div>

          {/* STEP 3: VIDEO TRANSMISSION & SENSORS */}
          <div className="drone-builder__card">
            <div className="drone-builder__card-header">
              <div>
                <span className="drone-builder__step-tag">Step 03 / Avionics &amp; Payloads</span>
                <h2 className="drone-builder__card-title">Video Link &amp; Sensor Package</h2>
                <p className="drone-builder__card-desc">
                  Select your telemetry downlink protocol and optical/thermal sensor suite.
                </p>
              </div>
            </div>

            {/* Video Transmission */}
            <div className="drone-builder__spec-group">
              <label className="drone-builder__spec-label" style={{ marginBottom: "0.5rem" }}>
                Video Transmission Protocol
              </label>
              <div className="drone-builder__option-grid">
                {VIDEO_TRANSMISSION_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`drone-builder__option-card ${videoTransmission === opt.id ? "drone-builder__option-card--selected" : ""}`}
                    onClick={() => setVideoTransmission(opt.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") setVideoTransmission(opt.id);
                    }}
                  >
                    <div className="drone-builder__option-title">
                      <span>{opt.name}</span>
                      {videoTransmission === opt.id && (
                        <span style={{ color: "#e52b31", fontSize: "14px" }}>●</span>
                      )}
                    </div>
                    <p className="drone-builder__option-desc">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Setup */}
            <div className="drone-builder__spec-group">
              <label className="drone-builder__spec-label" style={{ marginBottom: "0.5rem" }}>
                Camera &amp; Vision Setup
              </label>
              <div className="drone-builder__option-grid">
                {VIDEO_SETUP_OPTIONS.map((setup) => (
                  <div
                    key={setup.id}
                    className={`drone-builder__option-card ${videoSetup === setup.id ? "drone-builder__option-card--selected" : ""}`}
                    onClick={() => setVideoSetup(setup.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") setVideoSetup(setup.id);
                    }}
                  >
                    <div className="drone-builder__option-title">
                      <span>{setup.name}</span>
                      {videoSetup === setup.id && (
                        <span style={{ color: "#e52b31", fontSize: "14px" }}>●</span>
                      )}
                    </div>
                    <p className="drone-builder__option-desc">{setup.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 4: USE CASE & MISSION SCOPE */}
          <div className="drone-builder__card">
            <div className="drone-builder__card-header">
              <div>
                <span className="drone-builder__step-tag">Step 04 / Mission Scope</span>
                <h2 className="drone-builder__card-title">Operational Use Case &amp; Notes</h2>
                <p className="drone-builder__card-desc">
                  Select your primary application to help our engineers optimize flight controller firmware and motor kv.
                </p>
              </div>
            </div>

            <div className="drone-builder__field" style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="application-select" className="drone-builder__field-label">
                Intended Application / Industry
              </label>
              <select
                id="application-select"
                value={application}
                onChange={(e) => setApplication(e.target.value)}
                className="drone-builder__select"
              >
                {APPLICATION_OPTIONS.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>
            </div>

            <div className="drone-builder__field">
              <label htmlFor="notes-textarea" className="drone-builder__field-label">
                Custom Requirements &amp; Mission Notes <span style={{ fontWeight: 400, color: "#64748b" }}>(Optional)</span>
              </label>
              <textarea
                id="notes-textarea"
                rows={4}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Specify target wind speed tolerances, operating temperature (-20°C to +55°C), battery chemistry preferences, parachute triggers, or specific gimbal models..."
                className="drone-builder__textarea"
              />
            </div>
          </div>

          {/* STEP 5: CUSTOMER INFORMATION */}
          <div className="drone-builder__card">
            <div className="drone-builder__card-header">
              <div>
                <span className="drone-builder__step-tag">Step 05 / Contact Details</span>
                <h2 className="drone-builder__card-title">Customer Credentials</h2>
                <p className="drone-builder__card-desc">
                  Provide your direct contact details so our Indore lab engineers can send the CAD blueprint and feasibility report.
                </p>
              </div>
            </div>

            {/* Honeypot field for bot suppression */}
            <input
              type="text"
              name="_hp"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="drone-builder__input-grid">
              <div className="drone-builder__field">
                <label htmlFor="cust-name" className="drone-builder__field-label">
                  Full Name <span className="req">*</span>
                </label>
                <input
                  id="cust-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="drone-builder__text-input"
                  required
                />
                {fieldErrors.name && <div className="drone-builder__field-error">{fieldErrors.name}</div>}
              </div>

              <div className="drone-builder__field">
                <label htmlFor="cust-email" className="drone-builder__field-label">
                  Business / Official Email <span className="req">*</span>
                </label>
                <input
                  id="cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="drone-builder__text-input"
                  required
                />
                {fieldErrors.email && <div className="drone-builder__field-error">{fieldErrors.email}</div>}
              </div>

              <div className="drone-builder__field">
                <label htmlFor="cust-phone" className="drone-builder__field-label">
                  Contact Number <span className="req">*</span>
                </label>
                <input
                  id="cust-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98273 44411"
                  className="drone-builder__text-input"
                  required
                />
                {fieldErrors.phone && <div className="drone-builder__field-error">{fieldErrors.phone}</div>}
              </div>

              <div className="drone-builder__field">
                <label htmlFor="cust-org" className="drone-builder__field-label">
                  Company / Agency <span style={{ fontWeight: 400, color: "#64748b" }}>(Optional)</span>
                </label>
                <input
                  id="cust-org"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. AeroDynamics Pvt Ltd"
                  className="drone-builder__text-input"
                />
              </div>
            </div>

            <div className="drone-builder__field" style={{ marginTop: "1.25rem" }}>
              <label htmlFor="cust-city" className="drone-builder__field-label">
                Target Operation City / State <span style={{ fontWeight: 400, color: "#64748b" }}>(Optional)</span>
              </label>
              <input
                id="cust-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Indore, Madhya Pradesh"
                className="drone-builder__text-input"
              />
            </div>
          </div>

          {submitError && (
            <div className="drone-builder__error-banner" role="alert">
              <strong>Submission Error:</strong> {submitError}
            </div>
          )}
        </form>

        {/* ------------------------------------------------------------
            5. STICKY LIVE ARCHITECTURE SUMMARY
            ------------------------------------------------------------ */}
        <aside className="drone-builder__summary-card">
          <div className="drone-builder__summary-header">
            <span className="drone-builder__summary-tag">Live Architecture Spec</span>
            <h3 className="drone-builder__summary-title">Bespoke UAV Blueprint</h3>
          </div>

          <div className="drone-builder__summary-list">
            <div className="drone-builder__summary-row">
              <span className="drone-builder__summary-label">Airframe Geometry</span>
              <span className="drone-builder__summary-val">{selectedTypeObj.name}</span>
            </div>
            <div className="drone-builder__summary-row">
              <span className="drone-builder__summary-label">Target Payload</span>
              <span className="drone-builder__summary-val">{payload.toFixed(1)} kg</span>
            </div>
            <div className="drone-builder__summary-row">
              <span className="drone-builder__summary-label">Operational Range</span>
              <span className="drone-builder__summary-val">{range} km</span>
            </div>
            <div className="drone-builder__summary-row">
              <span className="drone-builder__summary-label">Flight Endurance</span>
              <span className="drone-builder__summary-val">{flightTime} mins</span>
            </div>
            <div className="drone-builder__summary-row">
              <span className="drone-builder__summary-label">Ceiling / AGL</span>
              <span className="drone-builder__summary-val">{altitude} m</span>
            </div>

            <div className="drone-builder__summary-divider" />

            <div className="drone-builder__summary-row">
              <span className="drone-builder__summary-label">Video Telemetry</span>
              <span className="drone-builder__summary-val" style={{ fontSize: "11px", maxWidth: "180px" }}>
                {selectedTxObj.name}
              </span>
            </div>
            <div className="drone-builder__summary-row">
              <span className="drone-builder__summary-label">Vision Package</span>
              <span className="drone-builder__summary-val" style={{ fontSize: "11px", maxWidth: "180px" }}>
                {selectedSetupObj.name}
              </span>
            </div>
          </div>

          {/* PROMINENT TASTEFUL SHIPPING NOTICE REITERATED */}
          <div className="drone-builder__summary-dispatch-box">
            <span className="drone-builder__summary-dispatch-badge">
              ⚡ Production &amp; Flight Test Notice
            </span>
            <p className="drone-builder__summary-dispatch-text">
              <strong>SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS</strong> following aerodynamic qualification and motor balance tuning in Indore.
            </p>
          </div>

          {/* Submit Enquiry Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="drone-builder__submit-btn"
          >
            {isSubmitting ? (
              <span>Submitting Enquiry...</span>
            ) : (
              <>
                <span>Submit Enquiry</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          <p className="drone-builder__submit-note">
            Directly routed to the DronesZ engineering desk. Guaranteed response within 24 business hours.
          </p>
        </aside>
      </div>
    </div>
  );
}
